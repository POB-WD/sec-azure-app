import { activateElement, addCssClasses, addTooltip, deactivateElement, elementIsHidden, getDivById, getElementsByClass, hideElement, unhideElement } from "../utils/domHelper.js";

const BtnGroupClasses = ['filter-group', 'div-inline'];
const FilterGroupClass = 'filter-group-option';

export class FilterValue {
    constructor(value, displayName, isDefault = undefined, toolTip = '', additionalClasses = ['']) {
        this.value = value;
        this.displayName = displayName ?? value;
        this.isDefault = isDefault;
        this.toolTip = toolTip;
        this.additionalClasses = additionalClasses;
    }
}

export class FilterOptions {
    mutuallyExclusive = false; // Whether or not multiple values can be selected at the same time
    showAllOrNothingButtons = false; // Whether or not to render buttons to allow checking / unchecking all at once
    btnClasses = ['btn-filter']; // Which css-Class to use for selected Filters (Bootstrap Classes: https://getbootstrap.com/docs/5.0/components/buttons/#examples)
    grpClasses = ['']; // Which css-Classes to use for the entire filter group
    btnGrpClasses = BtnGroupClasses; // Which css-Classes to use for the button-group itself
    addBefore; // Passes a div which will be added before the filter-group
    addAfter; // Passes a div which will be added after the filter-group
    optionNameOverride; // Overrides the name of each option instead of using the generated name
}

export class Filter {
    // DivIds
    #parentDivId;
    #containerDivId;
    #filterDivId;

    // Divs
    #parentDiv;
    #containerDiv;
    #filterDiv;
    #allOrNothingBtn;

    // Classes
    #genericItemClass;
    #instanceItemClass;

    // Properties
    Name;
    #filterValues = [];
    #filterOptions = new FilterOptions();

    constructor(filterName, parentDivId, filterValues = [], options = new FilterOptions()) {
        this.#genericItemClass = `${FilterGroupClass}`;
        this.#instanceItemClass = `${parentDivId}-${filterName}-${this.#genericItemClass}`;
        this.Name = filterName;
        this.#filterValues = filterValues;
        Object.assign(this.#filterOptions, options);

        // Parent
        this.#parentDivId = parentDivId;
        this.#parentDiv = getDivById(this.#parentDivId);

        // Container
        this.#containerDivId = `filter-group-${this.Name}`;
        this.#containerDiv = document.createElement('div');
        this.#containerDiv.id = this.#containerDivId;
        addCssClasses(this.#containerDiv, this.#filterOptions.grpClasses);
        this.#parentDiv.appendChild(this.#containerDiv);

        // Before
        this.#addDivsToContainer(this.#filterOptions.addBefore);

        // Filter
        this.#filterDivId = `filter-${this.Name}`;
        this.#filterDiv = this.#createButtonGroup(this.#filterDivId, this.#getClassesForBtnGroup());

        // Initialize All/Nothing Button if appropriate
        if (!this.#filterOptions.mutuallyExclusive && this.#filterOptions.showAllOrNothingButtons) {
            // Create All Button
            this.#allOrNothingBtn = this.#createButton(
                'button',
                `${this.#instanceItemClass}-all`,
                `${this.#instanceItemClass}-all`,
                new FilterValue('all', '', false),
                ['bi', 'bi-check-all', 'btn-all', 'gi-animation', 'filter-icon'],
                [this.#genericItemClass, `${this.#instanceItemClass}-allNone`, 'visually-hidden'],
                '--gi-animation-property: color'
            );
            addTooltip(this.#allOrNothingBtn, 'Alle aus- / abwählen');
        }
    }

    render(show = true) {
        if (!show) {
            this.hide();
        }

        // Create Buttons for Values
        this.#filterValues.forEach((element, index) => {
            var select = this.#shouldBeSelected(element, index);

            // Create Button
            var btn = this.#createButton(
                this.#filterOptions.mutuallyExclusive ? 'radio' : 'checkbox',
                `${this.#instanceItemClass}-${element.value}`,
                this.#filterOptions.mutuallyExclusive ? (this.#filterOptions.optionNameOverride ?? this.#instanceItemClass) : `${this.#instanceItemClass}-${element.value}`,
                element,
                ['btn', ...this.#filterOptions.btnClasses, ...element.additionalClasses, 'gi-animation'],
                [this.#genericItemClass, this.#instanceItemClass, 'visually-hidden'],
                '--gi-animation-property: background-color'
            );

            // Add Tooltip
            if (element.toolTip) {
                addTooltip(btn, element.toolTip);
            }

            if (select) {
                activateElement(btn);
            }

            this.#filterDiv.appendChild(btn);
        });

        // Add All/Nothing button
        if (this.#filterOptions.showAllOrNothingButtons) {
            this.#filterDiv.appendChild(this.#allOrNothingBtn);
        }

        // After Group
        this.#addDivsToContainer(this.#filterOptions.addAfter);

        this.#getAllButtons().forEach(btn => btn.addEventListener('click', this.clickHandler.bind(this)));
        if (this.#allOrNothingBtn) {
            this.#allOrNothingBtn.children[0].addEventListener('click', this.toggleAllButtonStates.bind(this));
        }
    }

    getContainerDivId() {
        return this.#containerDivId;
    }

    getFilterName() {
        return this.Name;
    }

    addEvent(event, handler) {
        var btns = this.#getAllButtons();
        btns.forEach(btn => btn.addEventListener(event, handler));

        if (this.#allOrNothingBtn) {
            this.#allOrNothingBtn.addEventListener(event, handler);
        }
    }

    clickHandler(event) {
        if (this.#filterOptions.mutuallyExclusive) {
            this.setAllButtonStates(false);
            event.target.checked = true; // Set clicked Button back to checked
        }

        if (event.target.checked) {
            activateElement(event.target.parentNode);
        } else {
            deactivateElement(event.target.parentNode);
        }
    }

    getCheckedValuesAsString() {
        if (this.isHidden()) {
            return '';
        }

        var checkedValues = this.#getAllCheckedValues();
        return checkedValues.length === this.#filterValues.length ? '' : checkedValues.join(',');
    }

    getCheckedNamesAsString() {
        if (this.isHidden()) {
            return '';
        }

        var checkedNames = this.#getAllCheckedDisplayNames();
        return checkedNames.join(', ');
    }

    anyChecked() {
        return !this.isHidden() && this.#getAllCheckedValues().length > 0;
    }

    hide() {
        hideElement(this.#containerDiv);
        this.defaultAllButtonStates();
    }

    unhide() {
        unhideElement(this.#containerDiv);
    }

    isHidden() {
        return elementIsHidden(this.#containerDiv)
    }

    setAllButtonStates(checked, btns) {
        btns = btns ?? this.#getAllButtons();
        btns.forEach(btn => {
            btn.checked = checked;
            if (checked) {
                activateElement(btn.parentNode);
            } else {
                deactivateElement(btn.parentNode);
            }
        });
    }

    toggleAllButtonStates() {
        var btns = this.#getAllButtons();
        if (btns.every(btn => btn.checked)) {
            this.setAllButtonStates(false, btns);
        } else {
            this.setAllButtonStates(true, btns);
        }
    }

    defaultAllButtonStates() {
        var btns = this.#getAllButtons();
        btns.forEach((btn, ind) => btn.checked = this.#filterValues[ind].isDefault);
    }

    activate(index) {
        var btns = this.#getAllButtons();
        btns[index].checked = true;
        activateElement(btns[index].parentNode);
    }

    deactivate(index) {
        var btns = this.#getAllButtons();
        btns[index].checked = false;
        deactivateElement(btns[index].parentNode);
    }

    #addDivsToContainer(divs) {
        if (!divs) {
            return;
        }

        if(!Array.isArray(divs)) {
            divs = [divs];
        }
        divs.forEach(div => this.#containerDiv.appendChild(div));
    }

    #createButton(type, id, name, filterValue = new FilterValue(''), parentClasses = [], childClasses = [], style = '') {
        var btn = document.createElement('label');
        btn.textContent = filterValue.displayName;
        addCssClasses(btn, parentClasses);
        btn.setAttribute('style', style);

        var input = document.createElement('input');
        input.id = id;
        input.name = name;
        input.type = type;
        input.checked = filterValue.isDefault;
        addCssClasses(input, childClasses);

        btn.appendChild(input);

        return btn;
    }

    #createButtonGroup(divId, cssClasses = this.#getClassesForBtnGroup()) {
        var div = document.createElement('div');
        div.id = divId;
        div.setAttribute('data-bs-toggle', 'buttons');
        addCssClasses(div, cssClasses);
        this.#containerDiv.appendChild(div);
        return div;
    }

    #getAllButtons() {
        return getElementsByClass(this.#instanceItemClass);
    }

    #getAllValues() {
        return this.#filterValues.map(fValue => fValue.value);
    }

    #getAllDisplayNames() {
        return this.#filterValues.map(fValue => fValue.displayName);
    }

    #getAllCheckedValues() {
        var values = [];
        var btns = this.#getAllButtons();
        var vals = this.#getAllValues();
        btns.forEach((btn, ind) => {
            if (!this.isHidden() && btn.checked) {
                values.push(vals[ind]);
            }
        });
        return values;
    }

    #getAllCheckedDisplayNames() {
        var names = [];
        var btns = this.#getAllButtons();
        var displayNames = this.#getAllDisplayNames();
        btns.forEach((btn, ind) => {
            if (!this.isHidden() && btn.checked) {
                names.push(displayNames[ind]);
            }
        });
        return names;
    }

    #getClassesForBtnGroup() {
        return this.#filterOptions.showAllOrNothingButtons ? [...this.#filterOptions.btnGrpClasses, 'div-inline'] : this.#filterOptions.btnGrpClasses;
    }

    #shouldBeSelected(element, index) {
        if (this.#filterValues.some(fValue => fValue.isDefault !== undefined)) {
            return element.isDefault;
        }
        return this.#filterOptions.mutuallyExclusive ? index === 0 : true;
    }
}