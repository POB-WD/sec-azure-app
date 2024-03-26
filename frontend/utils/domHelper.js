import Alert from '../constants/alerts.js';

const DocumentReadyEvent = 'DOMContentLoaded';
const DocumentState = Object.freeze({
    Loading: 'loading',
    Interactive: 'interactive',
    Ready: 'complete'
});

const TooltipQuerySelector = '[data-bs-toggle="tooltip"]';

// Executes the provided function as soon as DOM has finished loading
export function executeWhenDomLoaded(func) {
    // If DOM is no longer loading, we need to execute manually, else we attach the handler
    if (document.readyState !== DocumentState.Loading) {
        func();
    } else {
        document.addEventListener(DocumentReadyEvent, func);
    }
}

export function setReady() {
    addCssClasses(document.getElementById('ready-check'), ['ready']);
}

export function initializeTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll(TooltipQuerySelector));
    return tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

export function createRefreshButton() {
    return createButton('btn-refresh', ['visually-hidden']);
}

export function createGenerateButton() {
    var gen = createButton('btn-generate', ['btn-primary', 'gi-animation']);
    gen.setAttribute('style', '--gi-animation-property: background-color');
    gen.innerHTML = '<span class="bi bi-filetype-pdf"></span> PDF Bericht generieren';
    return gen;
}

export function createButton(id = '', classes = ['']) {
    var btn = document.createElement('button');
    btn.id = id;
    addCssClasses(btn, classes);
    return btn;
}

export const iconSpanDefaultClasses = ['bi']

export function createIconSpan(iconClass, classes = [''], defaultClassesOverride = iconSpanDefaultClasses) {
    var icon = document.createElement('span');
    addCssClasses(icon, [...defaultClassesOverride, iconClass, ...classes]);
    return icon;
}

export function createIconSpanWrapped(iconClass, iconSpanClasses = [''], defaultClassesOverride = iconSpanDefaultClasses, outerClasses = [''], tooltip = '') {
    var div = document.createElement('div');
    addCssClasses(div, outerClasses);
    var icon = createIconSpan(iconClass, iconSpanClasses, defaultClassesOverride);
    if (tooltip) {
        addTooltip(icon, tooltip);
    }
    div.appendChild(icon);
    return div;
}

export function addTooltip(div, text, position = 'bottom') {
    div.setAttribute('data-bs-toggle', 'tooltip');
    div.setAttribute('data-bs-placement', position);
    div.setAttribute('data-bs-html', 'true');
    div.setAttribute('data-bs-trigger', 'hover');
    div.setAttribute('title', text);
}

export function getDivById(id) {
    return document.getElementById(id);
}

export function addCssClasses(div, classes = []) {
    classes.forEach(cssClass => {
        if (cssClass) {
            div.classList.add(cssClass);
        }
    });
}

export function getElementsByClass(cssClass) {
    var elements = document.getElementsByClassName(cssClass);
    return Array.from(elements);
}

export function elementIsActive(domElement) {
    return domElement.classList.contains('active');
}

export function activateElement(domElement) {
    if (!elementIsActive(domElement)) {
        domElement.classList.add('active');
    }
}

export function deactivateElement(domElement) {
    if (elementIsActive(domElement)) {
        domElement.classList.remove('active');
    }
}

export function elementIsHidden(domElement) {
    return domElement.classList.contains('visually-hidden');
}

export function hideElement(domElement) {
    if (!elementIsHidden(domElement)) {
        domElement.classList.add('visually-hidden');
    }
}

export function unhideElement(domElement) {
    if (elementIsHidden(domElement)) {
        domElement.classList.remove('visually-hidden');
    }
}

export function getCssVariableValue(name = '') {
    var style = getComputedStyle(document.body);
    return style.getPropertyValue(name);
}

export function createAlert(msgHtml = '', type = '', parentDiv = document.getElementById('alerts')) {
    var icon = '';

    if (!parentDiv) {
        throw new Error(`Parent Div not found!`);
    }

    switch(type) {
        case Alert.Success: icon = 'bi-check-circle-fill'; break;
        case Alert.Warning: icon = 'bi-exclamation-triangle-fill'; break;
        case Alert.Danger: icon = 'bi-exclamation-octagon-fill'; break;
        case Alert.Information: icon = 'bi-info-circle-fill'; break;
        default: throw new Error(`Alert-Type '${type}' is not supported!`);
    }

    var alert = document.createElement('div');
    addCssClasses(alert, ['alert', 'alert-dismissible', type, 'gi-animation']);
    alert.setAttribute('style', '--gi-animation-property: visibility');
    alert.innerHTML = `<div class="row"><div class="col-1 col-mini"><span class="bi ${icon}"></span></div><div class="col">${msgHtml}</div> <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    parentDiv.prepend(alert);
}