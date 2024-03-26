import DomIds from "../constants/domIds.js";
import { hideElement, addTooltip, unhideElement, createIconSpan } from "../utils/domHelper.js";
import { loadFile } from "../utils/fileHelper.js";
import ChartTypes from "./chartType.js";
import Config from "./config.js";
import Overlays from "./overlay.js";
import Resolution from "../constants/resolutions.js";

const headerId = 'view-title';

class View {
    Name = '';
    DisplayName = '';
    Icon = '';
    Description = '';
    Filters = [];
    Overlays = [];
    Charts = [];

    #headerText;
    #toolTip;

    constructor(name, displayName, icon, description, filters = [], overlays = [], charts = []) {
        this.Name = name;
        this.DisplayName = displayName;
        this.Icon = icon || 'bi-square';
        this.Description = description;
        this.Filters = filters.map(f => DomIds.Filters[f]);
        this.Overlays = overlays.map(o => Overlays[o]);
        this.Charts = charts.map(c => ChartTypes[c]);
    }

    getGridResolution() {
        var resolution = undefined;
        Object.keys(Resolution).forEach(res => {
            if (this.Name.endsWith(res)) {
                resolution = res;
            }
        });
        return resolution;
    }

    isPerimeterView() {
        return this.Name.startsWith('perimeter');
    }

    setInHeader() {
        // Hide other Headers
        var children = Array.from(document.getElementById(headerId).children);
        children.forEach(child => hideElement(child));

        // Unhide this view's header
        unhideElement(this.#headerText);
        unhideElement(this.#toolTip);
    }

    setupHeaderText() {
        var header = document.getElementById(headerId);
        this.#headerText = document.createElement('span');
        this.#headerText.textContent = this.DisplayName;
        hideElement(this.#headerText);
        header.appendChild(this.#headerText);
        this.setupTooltip();
    }

    setupTooltip() {
        var header = document.getElementById(headerId);
        this.#toolTip = createIconSpan('bi-question-circle', ['info-icon']);
        addTooltip(this.#toolTip, this.Description ?? '');
        this.#toolTip.setAttribute('data-bs-trigger', 'hover focus');
        hideElement(this.#toolTip);
        header.appendChild(this.#toolTip);
        return this.#toolTip;
    }

    static async importAll(fileToImport) {
        return loadFile(fileToImport)
            .then(file => Object.keys(file).map(key => file[key]))
            .then(views => View.#generateObjectFromViews(views));
    }

    static #generateObjectFromViews(views) {
        var viewsObject = {};
        views.forEach(view => viewsObject[view.name] = this.#getViewFromObject(view));
        return viewsObject;
    }

    static #getViewFromObject(view) {
        return new View(view.name, view.displayName, view.icon, view.description, view.filters, view.overlays, view.charts);
    }
}

const Views = await View.importAll(Config.ViewsFile);

export default Views;