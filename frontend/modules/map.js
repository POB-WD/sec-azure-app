import { filterPropertiesByArray } from "../utils/objectHelper.js";
import Config from "./config.js";
import Overlays, { Overlay } from "./overlay.js";
import Views from "./view.js";
import { Spinner } from "./spinner.js"

export class GeoMap {
    divId;
    #map;
    #dataSource;
    #spinner;
    #legendControl;
    #animation;
    #padding;

    constructor(divId, animation = Config.MapOptions.DEFAULT_MOVEMENT_STYLE, padding = Config.MapOptions.DEFAULT_VIEW_PADDING) {
        this.#animation = animation;
        this.#padding = padding;

        // Initialize Map
        this.divId = divId;
        this.#initializeMap();
        this.#spinner = new Spinner(document.getElementById(this.divId));
    }

    #initializeMap() {
        this.#map = new atlas.Map(this.divId, {
            preserveDrawingBuffer: true, // this is necessary for our PDF Report to be able to render the canvas
            maxBounds: Config.MapOptions.MAX_BOUNDS,
            center: atlas.data.BoundingBox.getCenter(Config.MapOptions.MAX_BOUNDS),
            view: Config.MapOptions.DEFAULT_VIEW,
            style: Config.MapOptions.DEFAULT_STYLE,

            // Authentication
            authOptions: {
                authType: "anonymous",
                clientId: Config.AZURE_MAPS_CLIENT_ID,
                getToken: function (resolve, reject, map) {
                    // URL to your authentication service that retrieves an Azure Active Directory Token.
                    var tokenServiceUrl = Config.API_URL + "/GetAzureMapsToken";

                    fetch(tokenServiceUrl).then(r => r.text()).then(token => resolve(token));
                }
                //aadAppId: Config.ENTRA_APP_ID,
                //aadTenant: Config.ENTRA_TENANT_ID,
                //aadInstance: "https://login.microsoftonline.com/"
            },
        });
    }

    #addDataSource() {
        if (!this.#dataSource) {
            this.#dataSource = new atlas.source.DataSource();
            this.#map.sources.add(this.#dataSource);
        }
    }

    addZoomButtons(position = Config.MapOptions.Controls.DEFAULT_POSITION) {
        // Add Zoom buttons
        this.#map.controls.add(
            new atlas.control.ZoomControl({
                style: Config.MapOptions.Controls.DEFAULT_STYLE,
            }),
            {
                position: position,
            }
        );
    }

    addStyleControl(position = Config.MapOptions.Controls.DEFAULT_POSITION) {
        this.#map.controls.add(
            new atlas.control.StyleControl({
                style: Config.MapOptions.Controls.DEFAULT_STYLE,
                mapStyles: Config.MapOptions.Controls.MAP_STYLES_AVAILABLE,
            }),
            {
                position: position,
            }
        );
    }

    addLegendControl(position = 'bottom-right') {
        this.#legendControl = new atlas.control.LegendControl({
            layout: 'carousel',
            style: Config.MapOptions.Controls.DEFAULT_STYLE,
            showToggle: false
        });
        this.#map.controls.add(this.#legendControl, {
            position: position
        });
    }

    async addOverlay(overlay = new Overlay(), paramValues, before) {
        this.#addDataSource();

        // Load Data for Map
        await overlay.getData({...filterPropertiesByArray(paramValues, overlay.Params)})
            .then(data => {
                if (!data) {
                    return;
                }

                // Set Overlay Name as property (to help map differentiate between layers)
                this.#addOverlayProperty(data, overlay.Name);

                // Add data
                overlay.setData(this.#dataSource, data);
            });

        // Setup Layer
        var layer = overlay.getLayer(this.#dataSource);
        if (!this.#map.layers.getLayerById(overlay.Name)) {
            this.#map.layers.add(layer, before || overlay.Name);
        }
    }

    #addOverlayProperty(data, overlayName) {
        if(Array.isArray(data)) {
            data.forEach(d => this.#addOverlayPropertyToData(d, overlayName));
        } else {
            this.#addOverlayPropertyToData(data, overlayName);
        }
    }

    #addOverlayPropertyToData(data, overlayName) {
        if (!data.properties) {
            data.properties = {}
        }
        data.properties.overlay = overlayName;
    }

    async setView(view, paramValues) {
        this.reset();
        this.#spinner.unhide();

        return Promise.all(view.Overlays.filter(overlay => overlay.shouldBeShown(paramValues)).map(async (overlay, index, overlays) => {
            var nextOverlay = overlays[index+1] || overlay; // use next overlay if available, else we default to self
            await this.addOverlay(overlay, paramValues, nextOverlay.Name)
            .then(() => {
                if (overlay.Name !== Overlays.Pin.Name) {
                    this.goToSearchResult();
                }
            });
        })).then(() => {
            this.#spinner.hide();
        });
    }

    reset() {
        var userLayers = this.#map.layers._getUserLayers();
        this.#map.layers.remove(userLayers.map(l => l.layer));
        this.#dataSource?.clear();
    }

    addEvent(event, handler) {
        this.#map.events.add(event, handler);
    }

    resetCamera() {
        this.goToLocation();
    }

    goToLocation(coords, zoom) {
        this.#map.setCamera({
            maxBounds: Config.MapOptions.MAX_BOUNDS,
            center: coords,
            zoom: zoom
        });
    }

    goToSearchResult() {
        var shapes = this.#dataSource?.getShapes();
        var bBox = atlas.data.BoundingBox.fromData(shapes);

        if (!bBox) {
            this.resetCamera();
            return;
        }

        this.#map.setCamera({
            //maxBounds: Config.MapOptions.MAX_BOUNDS,
            bounds: bBox,
            padding: this.#padding,
            type: this.#animation
        });
    }
}