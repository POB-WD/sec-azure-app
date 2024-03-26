import DomIds from './constants/domIds.js';
import { GeoChart } from './modules/chart.js';
import { Filter, FilterValue } from './modules/filter.js';
import { GeoMap } from './modules/map.js';
import { Search } from './modules/search.js';
import Month from './constants/months.js';
import Weekday from './constants/weekdays.js';
import { addPropertyIfNotFalsy, hasNullValues, filterPropertiesByArray } from './utils/objectHelper.js';
import { getAllValuesFromEnum } from './utils/enumHelper.js';
import Views from './modules/view.js';
import AgeGroup from './constants/ageGroups.js';
import Gender from './constants/genders.js';
import ChartTypes from './modules/chartType.js';
import Resolution from './constants/resolutions.js';
import { addCssClasses, addTooltip, createIconSpan, createIconSpanWrapped, createRefreshButton, executeWhenDomLoaded, iconSpanDefaultClasses, initializeTooltips } from './utils/domHelper.js';
import Config from './modules/config.js';
import ReqManager from './modules/requestManager.js';
import ViewCategories from './modules/viewCategory.js';

executeWhenDomLoaded(ready);

// Execute this when DOM is loaded
function ready() {
    // Setup Branding and View-Info in Header
    var headerDiv = document.getElementById('branding-header');

    // Get Meta Div
    var metaDiv = document.getElementById('muni-search-meta');

    // Prepare Divs
    var title = document.createElement('div');
    title.id = 'mobins-title';
    addCssClasses(title, ['col-4', 'gi-col']);
    headerDiv.appendChild(title);

    var viewInfo = document.createElement('div');
    viewInfo.id = 'view-title';
    addCssClasses(viewInfo, ['col-4', 'gi-col']);
    headerDiv.appendChild(viewInfo);

    var clientLogo = document.createElement('div');
    clientLogo.id = 'client-brand';
    addCssClasses(clientLogo, ['col-4', 'gi-col']);
    headerDiv.appendChild(clientLogo);

    // Set Title on left div
    title.textContent = Config.SITE_TITLE;

    // Prepare View-Info for all Views
    Object.keys(Views).forEach(key => Views[key].setupHeaderText());

    // Set current view to the configured default
    var currentView = Views[Config.DefaultView];
    currentView.setInHeader();

    // Set client logo in right div
    var logoDiv = document.createElement('img');
    logoDiv.src = `data:${Config.LOGO_CLIENT_MIME_TYPE};base64,${Config.LOGO_CLIENT_B64}`;
    addCssClasses(logoDiv, ['logo']);
    clientLogo.appendChild(logoDiv);

    // Initialize SearchBar & Button
    var searchBox = document.getElementById(DomIds.Search.Box);
    var refreshButton = createRefreshButton();

    // Initialize Map
    var map = new GeoMap(DomIds.Map.AzureMap);
    map.addEvent('ready', function() {
        map.addZoomButtons();
        map.addStyleControl();
        map.addLegendControl();

        // Add meta div to map
        document.getElementById('mobinsMapContainer').appendChild(metaDiv);
    });

    // Initialize Charts
    var charts = {};
    charts['Passersby'] = new GeoChart(DomIds.Charts.Dynamic.Chart, ChartTypes.Passersby);
    charts['PassersbyTile'] = new GeoChart(DomIds.Charts.Single.Chart, ChartTypes.PassersbyTile);
    charts['PassersbyTileDemographics'] = new GeoChart(DomIds.Charts.TileDemo.Chart, ChartTypes.PassersbyTileDemographics);
    charts['PassersbyGrid'] = new GeoChart(DomIds.Charts.Grid.Chart, ChartTypes.PassersbyGrid);
    charts['PassersbyGridDemographics'] = new GeoChart(DomIds.Charts.GridDemo.Chart, ChartTypes.PassersbyGridDemographics);
    charts['PassersbyGridPerimeter'] = new GeoChart(DomIds.Charts.Grid.Chart, ChartTypes.PassersbyGridPerimeter);
    charts['PassersbyGridPerimeterDemographics'] = new GeoChart(DomIds.Charts.PerimeterDemo.Chart, ChartTypes.PassersbyGridPerimeterDemographics);
    charts['Residents'] = new GeoChart(DomIds.Charts.Residents.Chart, ChartTypes.Residents);
    charts['Visitors'] = new GeoChart(DomIds.Charts.Static.Chart, ChartTypes.Visitors);
    charts['DailyPopulation'] = new GeoChart(DomIds.Charts.DailyPop.Chart, ChartTypes.DailyPopulation);
    charts['InhabitantDemographics'] = new GeoChart(DomIds.Charts.Inhabitants.Chart, ChartTypes.InhabitantDemographics);
    charts['VisitorDemographics'] = new GeoChart(DomIds.Charts.Visitors.Chart, ChartTypes.VisitorDemographics);
    charts['TotalDemographics'] = new GeoChart(DomIds.Charts.Age.Chart, ChartTypes.TotalDemographics);
    Object.keys(charts).forEach(key => charts[key].hide()); // Hide all charts initially
    GeoChart.updateCarouselIndicators();

    // Css-Classes for filter-icons
    const filterIconClasses = ['big-icon', 'filter-icon'];
    const filterWrapperClasses = ['filter-col-icon', 'col'];

    // Initialize View Selection
    var viewSelects = {};
    Object.keys(ViewCategories).map(key => {
        return {
            ...ViewCategories[key],
            Key: key
        };
    }).forEach((category, catIndex) => {
        var viewIcon = createIconSpan(category.Icon, ['bigger-icon', 'filter-icon'], ['']);
        addTooltip(viewIcon, category.DisplayName);
        viewSelects[category.Name] = new Filter(category.Key, 'filter-group-view', category.Views.map((view, ind) => new FilterValue(view.Name, '', catIndex === 0 && ind === 0, view.DisplayName, ['big-icon', view.Icon])), { mutuallyExclusive: true, btnClasses: ['btn-outline-primary'], addBefore: viewIcon, grpClasses: ['col-5'], optionNameOverride: 'filter-group-view-option', btnGrpClasses: ['div-inline', 'view-select'] });
        viewSelects[category.Name].render();
    });

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
        filters[key].render(currentView.Filters.includes(key));
        filters[key].addEvent('click', function() {
            refreshButton.click();
        });
    });

    // Initialize Search-Engine
    var search = new Search(searchBox.id, refreshButton, filters);

    // Initialize Tooltips
    initializeTooltips();

    // Handlers
    refreshButton.addEventListener('click', function() {
        // Get Coordinates
        var coords = search.getCoords();

        // Abort if any coordinate is missing
        if (hasNullValues(coords)) {
            console.info(`Could not find coordinates for the current search-term '${search.getValue()}'`);
            return;
        }

        // Abort running fetch-requests
        ReqManager.reset();

        // Get Municipality Flag
        var isMunicipality = search.getMunicipalityFlag();

        // Prepare Filter Parameters
        var filterParams = {};
        Object.keys(filters).forEach(key =>
            addPropertyIfNotFalsy(filterParams, key === DomIds.Filters.ToggleArea ? filters[key].anyChecked() : filters[key].getCheckedValuesAsString(), filters[key].getFilterName()));
        filterParams.radius = 3500; // TODO Replace with FilterValue
        filterParams.res = Resolution[currentView.getGridResolution()];
        filterParams.isArea = currentView.isPerimeterView();

        // Merge all Params to param object
        var allParams = {};
        Object.assign(allParams, coords, { isMunicipality: isMunicipality }, filterParams);

        // Update Charts
        Object.keys(charts).map(key => charts[key]).forEach(chart => {
            // Hide all charts that aren't configured for current view
            if (!currentView.Charts.find(c => c?.Name === chart.name) || !ChartTypes[chart.name].shouldBeShown(allParams)) {
                chart.hide();
                return;
            }

            // Unhide and update chart
            var params = { ...filterPropertiesByArray(allParams, ChartTypes[chart.name].Params) };
            chart.unhide();
            chart.update(params);
        });

        // Ensure that one chart is active and update indicators and controls
        GeoChart.activateFirstIfNoneActive();
        GeoChart.updateCarouselIndicators();

        // Update Map
        map.setView(currentView, allParams).then(() => refreshButton.classList.remove('spin'));
    });

    Object.keys(viewSelects).forEach(key => {
        var viewSelect = viewSelects[key];
        viewSelect.addEvent('click', function() {
            var checkedValue = '';
            Object.keys(viewSelects).map(key => viewSelects[key]).forEach(vs => {
                // Uncheck all other selects values
                if (vs.Name !== viewSelect.Name) {
                    vs.setAllButtonStates(false);
                } else {
                    // Set checked value
                    checkedValue = vs.getCheckedValuesAsString();
                }
            });

            currentView = Views[checkedValue];
            currentView.setInHeader();
            Object.keys(filters).forEach(key => {
                if (currentView.Filters.includes(key)) {
                    filters[key].unhide();
                } else {
                    filters[key].hide();
                }
            });
            // Refresh
            refreshButton.click();
        });
    });

    window.addEventListener('resize', function() {
        // re-apply zoom to search-target after window-resize
        map.goToSearchResult();
    });
};

