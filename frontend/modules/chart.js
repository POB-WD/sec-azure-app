import { fetchData } from "../utils/requestHelper.js";
import { activateElement, addCssClasses, deactivateElement, getDivById, getElementsByClass, elementIsActive } from "../utils/domHelper.js";
import DomIds from "../constants/domIds.js";
import { ChartType } from "./chartType.js";
import { Spinner } from "./spinner.js";

const carouselDivId = 'carousel-inner';
const carouselItemClass = 'carousel-item';
const carouselIndicatorDivId = 'carousel-indicators';
const carouselControlsClass = 'carousel-control';
const carouselItemSubClasses = ['chart-carousel-item']

export class GeoChart {
    // Carousel Divs
    static carouselIndicatorDiv = getDivById(carouselIndicatorDivId);
    static carouselDiv = getDivById(carouselDivId);
    static carouselControlDivs = getElementsByClass(carouselControlsClass);

    // DivIds
    #carouselItemDivId;
    #chartParentDivId;
    #chartDivId;

    // Divs
    #carouselItemDiv;
    #chartParentDiv;
    #chartDiv;

    // Other
    name;
    #chart;
    #chartType;
    #spinner;

    constructor(divId, chartType = new ChartType()) {
        this.name = chartType.Name;

        // Create Carousel Item
        this.#carouselItemDivId = `${carouselItemClass}-${divId}`;
        this.#carouselItemDiv = this.#createSubElement(this.#carouselItemDivId, GeoChart.carouselDiv, 'div', [carouselItemClass]);

        // Create Chart Div
        this.#chartParentDivId = `parent-${divId}`;
        this.#chartParentDiv = this.#createSubElement(this.#chartParentDivId, this.#carouselItemDiv, 'div', carouselItemSubClasses);

        // Create Canvas
        this.#chartDivId = divId;
        this.#chartDiv = this.#createSubElement(this.#chartDivId, this.#chartParentDiv, 'canvas', ['d-block']);

        // Initialize Chart
        this.#initializeChart(chartType);
    }

    #initializeChart(chartType = new ChartType()) {
        this.#chart = new Chart(this.#chartDiv.getContext('2d'), chartType.getChartOptions());
        this.#chartType = chartType;
        this.#spinner = new Spinner(this.#chartParentDiv);
    }

    #createSubElement(divId, parentDiv, elementType, classes = []) {
        var div = document.createElement(elementType);
        div.setAttribute('id', divId);
        addCssClasses(div, classes);
        parentDiv.appendChild(div);
        return div;
    }

    #triggerDataCallbackForDatasets(datapoints) {
        this.#chart.config.data.datasets.forEach(dataset => {
            if (dataset.dataCallback) {
                dataset.data = dataset.dataCallback(datapoints);
            }
        });
    }

    update(paramValues, updateCallback = undefined) {
        this.#spinner.unhide();
        fetchData(this.#chartType.getUrl(paramValues)).then((datapoints) => {
            if (!datapoints) {
                return;
            }

            this.#triggerDataCallbackForDatasets(datapoints);
            this.#chart.update();
            this.#spinner.hide();

            if (updateCallback) {
                updateCallback();
            }
        });
    }

    hide() {
        // Only remove if it exists
        if (GeoChart.getAllItemDivs().find(e => e === this.#carouselItemDiv)) {
            GeoChart.carouselDiv.removeChild(this.#carouselItemDiv);
        }

        deactivateElement(this.#carouselItemDiv);
    }

    unhide() {
        // Only add if not exists
        if (!GeoChart.getAllItemDivs().find(e => e === this.#carouselItemDiv)) {
            GeoChart.carouselDiv.appendChild(this.#carouselItemDiv);
        }
    }

    static getAllItemDivs() {
        return Array.from(GeoChart.carouselDiv.children);
    }

    static activateFirstIfNoneActive() {
        var items = GeoChart.getAllItemDivs();
        if(!items.some(item => elementIsActive(item)) && items.length > 0) {
            activateElement(items[0]);
        }
    }

    static updateCarouselIndicators() {
        // Remove existing indicators
        Array.from(GeoChart.carouselIndicatorDiv.children).forEach(i => {
            GeoChart.carouselIndicatorDiv.removeChild(i)
        });

        // Add one indicator for each carousel item
        GeoChart.getAllItemDivs().forEach((item, ind) => {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-bs-target', `#${DomIds.Charts.Dynamic.Area}`);
            btn.setAttribute('data-bs-slide-to', ind);

            if (elementIsActive(item)) {
                activateElement(btn);
            }

            GeoChart.carouselIndicatorDiv.appendChild(btn);
        });

        // Hide Controls and Indicators if only one carousel item, else reverse
        if(GeoChart.carouselDiv.childElementCount <= 1) {
            GeoChart.carouselIndicatorDiv.classList.add('visually-hidden');
            GeoChart.carouselControlDivs.forEach(c => c.classList.add('visually-hidden'));
        } else {
            GeoChart.carouselIndicatorDiv.classList.remove('visually-hidden');
            GeoChart.carouselControlDivs.forEach(c => c.classList.remove('visually-hidden'));
        }
    }
}