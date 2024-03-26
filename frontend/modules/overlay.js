import { fetchData, getFullUrl, getQueryString } from "../utils/requestHelper.js";

class OverlayStyle {
    filter;
    iconOptions;
    fillColor;
    fillOpacity;
    height;
    textOptions;
    strokeColor;
    strokeWidth;
}

export class Overlay {
    // Properties
    Name = '';
    DataSource = '';
    Params = [''];
    LayerType;
    Style = new OverlayStyle();

    constructor(name, dataSource, params, layerType, style = new OverlayStyle(), getDataOverride, setDataCallback, getLayerOverride, shouldBeShownOverride) {
        // Set Properties
        this.Name = name;
        this.DataSource = dataSource;
        this.Params = params;
        this.LayerType = layerType
        this.Style = style;

        // Set Default Filter (this limits styling to data belonging to this overlay)
        this.#setDefaultFilterIfNotSet();

        // Override functions and set callbacks, if necessary
        if (getDataOverride) {
            this.getData = getDataOverride.bind(this);
        }

        if (setDataCallback) {
            this.dataCallback = setDataCallback.bind(this);
        }

        if (getLayerOverride) {
            this.getLayer = getLayerOverride.bind(this);
        }

        if (shouldBeShownOverride) {
            this.shouldBeShown = shouldBeShownOverride.bind(this);
        }
    }

    setData(source, data) {
        if (this.dataCallback) {
            this.dataCallback(data);
        }
        source.add(data);
    }

    #setDefaultFilterIfNotSet() {
        if (!this.Style.filter) {
            this.Style.filter = ['==', ['get', 'overlay'], this.Name];
        }
    }

    // Default Functions
    async getData(paramValues) {
        return fetchData(getFullUrl(this.DataSource, getQueryString(paramValues)));
    }

    getLayer(source) {
        return new this.LayerType(source, this.Name, this.Style);
    }

    shouldBeShown({}) {
        return true;
    }

    // Callbacks
    dataCallback(data) {}
}

// DataFunction Overrides
async function convertCoordsToCircle({ lon, lat, radius }) {
    return new atlas.data.Feature(new atlas.data.Point([lon, lat]), {
        subType: 'Circle',
        radius: radius
    });
}

async function convertCoordsToPoint({ lon, lat }) {
    return new atlas.data.Feature(new atlas.data.Point([lon, lat]));
}

// DataCallbacks
function calculateAndAddPercentagePassersby(data) {
    var uniquePassersby = data.filter(d => d.properties?.uniquePassersby).map(d => d.properties.uniquePassersby);
    var max = Math.max(...uniquePassersby);
    data.forEach(d => {
        if (d.properties) {
            d.properties.percentage = (d.properties.uniquePassersby / max) * 100;
        }
    });
}

function calculateAndAddPercentageVisitors(data) {
    var uniqueVisitors = data.filter(d => d.properties?.uniqueVisitors).map(d => d.properties.uniqueVisitors);
    var max = Math.max(...uniqueVisitors);
    data.forEach(d => {
        if (d.properties) {
            d.properties.percentage = (d.properties.uniqueVisitors / max) * 100;
            d.properties.labelText = `${d.properties.name}\n${d.properties.uniqueVisitors < 0 ? '<20' : Math.ceil(d.properties.uniqueVisitors).toLocaleString('de-DE').replaceAll('.', ' ')}`;
        }
    });
}

// LayerFunction Overrides
function passersbyGridLayerWithPopups(source) {
    // Create a popup but leave it closed so we can update it and display it later.
    var popup = new atlas.Popup({
        position: [0, 0],
        closeButton: true
    });

    // Create Layer and add handler
    var gridLayer = new atlas.layer.PolygonExtrusionLayer(source, this.Name, this.Style);
    var addHandler = addClickHandler.bind(this);
    addHandler(source, gridLayer, gridClickHandler, [source, popup]);
    return gridLayer;
}

function visitorOriginsLayerWithLabels(source) {
    return [
        new this.LayerType(source, this.Name, this.Style),
        new atlas.layer.SymbolLayer(source, `${this.Name}Labels`, this.Style)
    ];
}

function showWhenAreaOrNotMunicipality({ isArea, isMunicipality }) {
    return isArea || !isMunicipality;
}

// Handlers
function addClickHandler(source, layer, handler, handlerParams = []) {
    if(!this.handlerRef) {
        this.handlerRef = handler.bind(this, ...handlerParams);
    } else {
        source.map.events.remove('click', layer, this.handlerRef);
    }
    source.map.events.add('click', layer, this.handlerRef);
}

function gridClickHandler(source, popup, e) {
    // Make sure the event occurred on a polygon
    if (
        e.shapes &&
        e.shapes.length > 0 &&
        e.shapes[0].getType() === "Polygon"
    ) {
        var properties = e.shapes[0].getProperties();
        var coords = e.shapes[0].getCoordinates();

        var maxX = Math.max(...coords[0].map(c => c[0]));
        var minX = Math.min(...coords[0].map(c => c[0]));
        var maxY = Math.max(...coords[0].map(c => c[1]));
        var minY = Math.min(...coords[0].map(c => c[1]));

        var midX = (maxX + minX) / 2;
        var midY = (maxY + minY) / 2;

        popup.setOptions({
            // update content of popup
            content: `<div class="popup-box"><strong>ø Personen</strong><br>${properties.uniquePassersby?.toFixed(0) || 'keine Daten'}</div>`,

            // update position of popup with the tile coordinate.
            position: [midX, midY]
        });

        popup.open(source.map);
    }
}

// Overlays
const Overlays = {};

// Municipality
Overlays['Municipality'] = new Overlay(
    'Municipality',
    'Municipality',
    ['lon', 'lat'],
    atlas.layer.LineLayer,
    {
        strokeColor: '#0d6efd',
        strokeWidth: 3
    },
    undefined,
    undefined,
    undefined,
    undefined
);

// Perimeter
Overlays['Perimeter'] = new Overlay(
    'Perimeter',
    undefined,
    ['lon', 'lat', 'radius'],
    atlas.layer.LineLayer,
    {
        strokeColor: '#0d6efd',
        strokeWidth: 1
    },
    convertCoordsToCircle,
    undefined,
    undefined,
    undefined
);

// Pin
Overlays['Pin'] = new Overlay(
    'Pin',
    undefined,
    ['lon', 'lat'],
    atlas.layer.SymbolLayer,
    {
        iconOptions: {
            image: 'marker-blue'
        }
    },
    convertCoordsToPoint,
    undefined,
    undefined,
    showWhenAreaOrNotMunicipality
);

// PassersbyGrid
Overlays['PassersbyGrid'] = new Overlay(
    'PassersbyGrid',
    'PassersbyGrid',
    ['areaId', 'lon', 'lat', 'res', 'month', 'weekday', 'gender', 'ageGroup'],
    atlas.layer.PolygonExtrusionLayer,
    {
        fillColor: [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, 'white',
            25, 'green',
            50, 'yellow',
            75, 'orange',
            100, 'red'
        ],
        fillOpacity: 0.5,
        height: [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, 1,
            50, 100,
            100, 1000
        ],
    },
    undefined,
    calculateAndAddPercentagePassersby,
    passersbyGridLayerWithPopups,
    undefined
);

// PassersbyGridPerimeter
Overlays['PassersbyGridPerimeter'] = new Overlay(
    'PassersbyGridPerimeter',
    'PassersbyGridPerimeter',
    ['areaId', 'lon', 'lat', 'res', 'radius', 'month', 'weekday', 'gender', 'ageGroup'],
    atlas.layer.PolygonExtrusionLayer,
    {
        fillColor: [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, 'white',
            25, 'green',
            50, 'yellow',
            75, 'orange',
            100, 'red'
        ],
        fillOpacity: 0.5,
        height: [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, 1,
            50, 100,
            100, 1000
        ],
    },
    undefined,
    calculateAndAddPercentagePassersby,
    passersbyGridLayerWithPopups,
    undefined
);

// VisitorOrigins
Overlays['VisitorOrigins'] = new Overlay(
    'VisitorOrigins',
    'VisitorOrigins',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'gender', 'ageGroup'],
    atlas.layer.PolygonExtrusionLayer,
    {
        iconOptions: {
            image: 'none'
        },
        textOptions: {
            color: 'black',
            haloColor: 'white',
            haloWidth: 2,
            size: 18,
            textField: ['get', 'labelText']
        },
        fillColor: [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, 'white',
            25, 'green',
            50, 'yellow',
            75, 'orange',
            100, 'red'
        ],
        fillOpacity: 0.7,
        height: [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, 1,
            50, 100,
            100, 1000
        ],
    },
    undefined,
    calculateAndAddPercentageVisitors,
    visitorOriginsLayerWithLabels
);

export default Overlays;