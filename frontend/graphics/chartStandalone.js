import { executeWhenDomLoaded, setReady } from "../utils/domHelper.js";
import { GeoChart } from '../modules/chart.js';
import Resolutions from '../constants/resolutions.js';
import { fetchData, getFullUrl } from "../utils/requestHelper.js";
import ChartTypes, { ChartOptions } from "../modules/chartType.js";
import { filterPropertiesByArray } from "../utils/objectHelper.js";

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

            // Inject Event Handler into ChartType
            var chartType = ChartTypes[paramsParsed['chart']];
            chartType.ChartOptions = Object.assign(new ChartOptions(), chartType.ChartOptions, {
                options: {
                    animation: {
                        duration: 1
                    }
                }
            });

            // Initialize Chart
            var chart = new GeoChart('chartContainer', ChartTypes[paramsParsed['chart']]);
            chart.hide()
            var chartParams = { ...filterPropertiesByArray(paramsParsed, ChartTypes[paramsParsed['chart']].Params) };
            chart.unhide();
            chart.update(chartParams, function() {
                setTimeout(setReady, 2500);
            });

            // Ensure that one chart is active and update indicators and controls
            GeoChart.activateFirstIfNoneActive();
            GeoChart.updateCarouselIndicators();
        });
    } else {
        throw 'Mandatory parameter "search" is missing';
    }
}