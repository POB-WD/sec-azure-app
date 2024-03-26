import { addCssClasses, hideElement, unhideElement } from "../utils/domHelper.js";

const cssClasses = ['spinner-border', 'text-primary', 'spinner-customization', 'position-absolute', 'visually-hidden'];

export class Spinner {
    #parent;
    #spinnerDiv;

    constructor(parent = new HTMLElement()) {
        this.#parent = parent;
        this.#initialize();
    }

    #initialize() {
        this.#spinnerDiv = document.createElement('div');
        addCssClasses(this.#spinnerDiv, cssClasses);

        this.#parent.appendChild(this.#spinnerDiv);
    }

    hide() {
        hideElement(this.#spinnerDiv);
    }

    unhide() {
        unhideElement(this.#spinnerDiv);
    }
}