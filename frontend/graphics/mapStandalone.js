import { executeWhenDomLoaded, setReady } from "../utils/domHelper.js";
import { GeoMap } from '../modules/map.js';
import Views from "../modules/view.js";
import { fetchData, getFullUrl } from "../utils/requestHelper.js";

executeWhenDomLoaded(ready);

function ready() {
    // Get Parameters from QueryString
    var params = new URLSearchParams(window.location.search);

    // Parse Parameters
    var paramsParsed = {};
    Array.from(params.keys()).forEach(k => paramsParsed[k] = params.get(k));

    // Get Coordinates
    var search = paramsParsed['address'];
    if (search) {
        fetchData(getFullUrl('Coordinates', `search=${search}`)).then(data => {
            paramsParsed = { ...paramsParsed, ...data };

            // Default Radius
            if (!paramsParsed['radius']) {
                paramsParsed['radius'] = 3500;
            }

            // Remove Height from Overlays
            var view = Views[paramsParsed['view']]; // This creates a deep clone of the view
            view.Overlays.forEach(o => o.Style.height = undefined);

            // Initialize Map
            var map = new GeoMap('mapContainer', 'jump', {
                top: 75,
                bottom: 75,
                left: 75,
                right: 75
            });
            map.addEvent('ready', function() {
                map.addZoomButtons();
                map.addStyleControl();

                // Update Map
                map.setView(view, paramsParsed).then(() => setTimeout(setReady, 2500));
            });
        });
    } else {
        throw 'Mandatory parameter "search" is missing';
    }
}