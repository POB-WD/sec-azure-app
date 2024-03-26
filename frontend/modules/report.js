import DomIds from "../constants/domIds.js";
import { createRefreshButton, executeWhenDomLoaded, createIconSpanWrapped, iconSpanDefaultClasses, initializeTooltips, createButton, createGenerateButton, createAlert, addCssClasses, unhideElement, hideElement } from "../utils/domHelper.js";
import { Filter, FilterValue } from "./filter.js";
import { getAllValuesFromEnum } from "../utils/enumHelper.js";
import Month from "../constants/months.js";
import Weekday from "../constants/weekdays.js";
import AgeGroup from "../constants/ageGroups.js";
import Gender from "../constants/genders.js";
import { Search } from "./search.js";
import ReqManager from "./requestManager.js";
import { fetchRawData, getQueryString, getReportUrl } from "../utils/requestHelper.js";
import { hasNullValues, addPropertyIfNotFalsy } from "../utils/objectHelper.js";
import Alert from "../constants/alerts.js";

executeWhenDomLoaded(ready);

function ready() {
    var running = false

    // Initialize SearchBar & Button
    var searchBox = document.getElementById(DomIds.Search.Box);
    var refreshButton = createRefreshButton();
    var generateButton = createGenerateButton();

    // Css-Classes for filter-icons
    const filterIconClasses = ['big-icon', 'filter-icon'];
    const filterWrapperClasses = ['filter-col-icon', 'col'];

    // Initialize Filters
    var filters = {};

    // Months
    var monthsIcon = createIconSpanWrapped('bi-calendar-month', filterIconClasses, iconSpanDefaultClasses, filterWrapperClasses, 'Monate');
    filters[DomIds.Filters.Month] = new Filter('month', 'filters', getAllValuesFromEnum(Month).map((value, index) => new FilterValue(index + 1, value, true, '', ['btn-filter'])), { showAllOrNothingButtons: true, addBefore: monthsIcon, btnGrpClasses: ['col'], grpClasses: ['row'], btnClasses: ['uniform-width-3chars'] });

    // Weekdays
    var weekdayIcon = createIconSpanWrapped('bi-calendar-day', filterIconClasses, iconSpanDefaultClasses, filterWrapperClasses, 'Wochentage');
    filters[DomIds.Filters.Weekday] = new Filter('weekday', 'filters', getAllValuesFromEnum(Weekday).map(value => new FilterValue(value, value, true, '', ['btn-filter'])), { addBefore: weekdayIcon, btnGrpClasses: ['col'], grpClasses: ['row'], btnClasses: ['uniform-width-5chars'] });

    // Genders
    var genderIcon = createIconSpanWrapped('bi-gender-ambiguous', filterIconClasses, iconSpanDefaultClasses, filterWrapperClasses, 'Geschlechter');
    var genderIcons = ['bi-gender-female', 'bi-gender-male'];
    filters[DomIds.Filters.Gender] = new Filter('gender', 'filters', getAllValuesFromEnum(Gender).map((value, index) => new FilterValue(value, '', true,value === 'UNKNOWN' ? 'Unbekannt' : value, ['btn-filter', 'bi', genderIcons[index]])), { addBefore: genderIcon, btnGrpClasses: ['col'], grpClasses: ['row'], addTooltip: true });

    // AgeGroups
    var ageIcon = createIconSpanWrapped('bi-cake', filterIconClasses, iconSpanDefaultClasses, filterWrapperClasses, 'Altersgruppen');
    filters[DomIds.Filters.Age] = new Filter('ageGroup', 'filters', getAllValuesFromEnum(AgeGroup).map(value => new FilterValue(value, value === 'UNKNOWN' ? 'Unbekannt' : value, true, '', ['btn-filter'])), { addBefore: ageIcon, btnGrpClasses: ['col'], showAllOrNothingButtons: true, grpClasses: ['row'], btnClasses: ['uniform-width-5chars'] });

    // Render Filters
    Object.keys(filters).forEach(key => {
        filters[key].render(true);
    });

    // Add Generate Button to Filter Group
    var buttonDiv = document.createElement('div');
    buttonDiv.setAttribute('id', 'btn-generate-row');
    addCssClasses(buttonDiv, ['row']);
    buttonDiv.appendChild(generateButton);
    document.getElementById('filters').appendChild(buttonDiv);

    // Add Spinner
    var spinner = document.createElement('span');
    addCssClasses(spinner, ['spinner-border', 'spinner-generate', 'visually-hidden']);
    buttonDiv.appendChild(spinner);

    // Initialize Search-Engine
    var search = new Search(searchBox.id, refreshButton, filters);

    // Initialize Tooltips
    initializeTooltips();

    // Handlers
    generateButton.addEventListener('click', function() {
        // Get Coordinates
        var coords = search.getCoords();

        // Abort if no searchTerm
        if (!search.getValue()) {
            createAlert(`Bitte geben Sie einen Suchbegriff ein.`, Alert.Warning);
            return;
        }

        // Abort if any coordinate is missing
        if (hasNullValues(coords)) {
            createAlert(`Der eingegebene Suchbegriff <strong>${search.getValue()}</strong> konnte keiner Gemeinde / Addresse exakt zugewiesen werden. <br> Bitte wählen Sie einen der Vorschläge aus oder stellen Sie sicher, dass Sie die Gemeinde / Addresse richtig eingegeben haben.`, Alert.Warning);
            return;
        }

        // Abort running fetch-requests
        ReqManager.reset();

        // Show Spinner
        unhideElement(spinner);
        generateButton.disabled = true;

        // Prepare Filter Parameters
        var filterParams = {};
        Object.keys(filters).forEach(key =>
            addPropertyIfNotFalsy(filterParams, key === DomIds.Filters.ToggleArea ? filters[key].anyChecked() : filters[key].getCheckedValuesAsString(), filters[key].getFilterName()));
        filterParams.radius = 3500; // TODO Replace with FilterValue
        filterParams.searchTerm = search.getValue();

        // Begin Generating Report
        createAlert(`Der PDF-Bericht für <strong>${filterParams.searchTerm}</strong> wird generiert. Dies kann einige Minuten in Anspruch nehmen.`, Alert.Information);
        var url = getReportUrl(getQueryString(filterParams));

        fetchRawData(url).then(response => {
            hideElement(spinner);
            generateButton.disabled = false;
            return response.text().then(t => {
                return Object.assign(response, { text: t });
            });
        }).then(response => {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText} - ${response.text}`);
            }
            createAlert(`Der PDF-Bericht für <strong>${filterParams?.searchTerm}</strong> wurde erfolgreich generiert. <strong><a href="${response?.text}" target="${response?.text ? '_self' : '_blank'}" class="gi-animation" style="--gi-animation-property: color"><span class="bi bi-floppy"></span> Datei herunterladen</a></strong>`, Alert.Success);
        }).catch((reason) => {
            hideElement(spinner);
            generateButton.disabled = false;
            console.error(reason);
            createAlert(`Beim Generieren ihres Berichts für <strong>${filterParams.searchTerm}</strong> ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.`, Alert.Danger);
        });
    });
}