import Config from "./config.js";
import { fetchData } from "../utils/requestHelper.js"
import DomIds from "../constants/domIds.js";
import { addCssClasses } from "../utils/domHelper.js";

const latAttribute = 'data-value-lat';
const lonAttribute = 'data-value-lon';
const muniAttribute = 'data-value-is-muni';

const countyDistrict = ['data-value-county-district', 'Bezirk Bundesland'];
const municipality = ['data-value-muni', 'Gemeinde'];
const district = ['data-value-district', 'Bezirk Gemeinde'];
const street = ['data-value-street', 'Straße'];
const postal = ['data-value-postal', 'PLZ']

class ResultMapping {
    constructor(attributeName, valuePathFunc, displayName) {
        this.name = attributeName,
        this.getValue = valuePathFunc,
        this.displayName = displayName || attributeName;
    }
}

class ResultMapper {
    static latAttribute = new ResultMapping(latAttribute, r => r.position.lat);
    static lonAttribute = new ResultMapping(lonAttribute, r => r.position.lon);
    static muniAttribute = new ResultMapping(muniAttribute, r => Config.SearchOptions.COUNT_AS_MUNICIPALITY.includes(r.entityType));

    static countyDistrict = new ResultMapping(countyDistrict[0], r => r.address?.countrySecondarySubdivision ?? '', countyDistrict[1]);
    static muni = new ResultMapping(municipality[0], r => r.address?.municipality ?? '', municipality[1]);
    static district = new ResultMapping(district[0], r => r.address?.municipalitySubdivision ?? '', district[1]);
    static postal = new ResultMapping(postal[0], r => r.address?.postalCode ?? '', postal[1]);
    static street = new ResultMapping(street[0], r => {
        var res = '';
        if (r.address?.streetName) {
            res += r.address?.streetName;
        }
        if (r.address?.streetNumber) {
            res += ' ' + r.address?.streetNumber;
        }
        return res;
    }, street[1]);

    static mapResult(result) {
        var mapped = [];
        Object.keys(this).forEach(k => mapped[this[k].name] = this[k].getValue(result));
        return mapped;
    }
}

export class Search {
    divId;
    #searchBox;
    #searchButton;
    #filters;

    constructor(divIdBox, refreshButton, filters = {}) {
        this.divId = divIdBox;
        this.#searchBox = document.getElementById(divIdBox);
        this.#searchButton = refreshButton;
        this.#filters = filters;
        this.#initializeSuggestions();
    }

    #initializeSuggestions() {
        var searchBox = this.#searchBox;
        var searchBtn = this.#searchButton;
        var filters = this.#filters;

        // Turn off default autocomplete feature of browser
        searchBox.setAttribute('autocomplete', 'off');

        // Add suggestion class to parent-div
        searchBox.parentNode.classList.add(DomIds.Search.Suggestions.Outer);

        // Add Input listener
        searchBox.addEventListener('input', function(e) {
            inputHandler(e, searchBox, searchBtn, filters);
        });

        // Add click-event to document to close suggestion-lists on click
        document.addEventListener('click', function(e) {
            closeAllLists(e.target, searchBox);
        });
    }

    addEvent(event, handler) {
        this.#searchBox.addEventListener(event, handler);
    }

    getValue() {
        return this.#searchBox.value;
    }

    getCoords() {
        return {
            lon: Number(this.#searchBox.getAttribute(lonAttribute)),
            lat: Number(this.#searchBox.getAttribute(latAttribute))
        };
    }

    getMunicipalityFlag() {
        return this.#searchBox.getAttribute(muniAttribute) === 'true';
    }
}

function inputHandler(event, searchBox, searchBtn, filters) {
    var value = searchBox.value;

    searchBox.removeAttribute(lonAttribute);
    searchBox.removeAttribute(latAttribute);
    searchBox.removeAttribute(muniAttribute);
    closeAllLists(null, searchBox);

    // Only search if search-text is long enough
    if (value.length < Config.SearchOptions.MIN_SEARCH_LENGTH) {
        return;
    }

    // Wait a few milliseconds before starting the search in-case user is still typing
    setTimeout(() => {
        if (!inputChanged(value, searchBox)) {
            search(value, searchBox, searchBtn, filters);
        }
    }, Config.SearchOptions.KEY_STROKE_DELAY);
}

function inputChanged(value, searchBox) {
    return value !== searchBox.value
}

async function search(value, searchBox, searchBtn, filters) {
    // Get List from Search
    await getSuggestionList(value).then(searchResults => {
        closeAllLists(null, searchBox);
        createSuggestionList(searchBox, searchBtn, searchResults, filters);
    });
}

function createSuggestionList(searchBox, searchBtn, searchResults, filters) {
    // Create a div for the list and append to the container
    var list = document.createElement("div");
    list.setAttribute('id', `${searchBox.id}-${DomIds.Search.Suggestions.List}`);
    list.classList.add(DomIds.Search.Suggestions.List);
    searchBox.parentNode.appendChild(list);

    // Iterate over suggestions and create respective divs
    searchResults.forEach((searchResult) => {
        var resultMapping = ResultMapper.mapResult(searchResult);
        var attributes = [];
        Object.keys(resultMapping).forEach(k => attributes.push(`${k}="${resultMapping[k]}"`));
        var attributesString = attributes.join(' ');
        var item = document.createElement('div');
        item.innerHTML = searchResult.address.freeformAddress;
        item.innerHTML += `<input
            type="hidden"
            value="${searchResult.address.freeformAddress}"
            ${attributesString}>`;
        addCssClasses(item, [DomIds.Search.Suggestions.Item, 'gi-animation']);
        item.setAttribute('style', '--gi-animation-property: background-color');

        // Add click-handler to item
        item.addEventListener('click', function(e) {
            suggestionClickHandler(e, searchBox, searchBtn, filters);
        });

        list.appendChild(item);
    });
}

async function getSuggestionList(value) {
    var url = buildUrl(value);
    return await fetchData(url, {
        'X-Ms-Client-Id': Config.AZURE_MAPS_CLIENT_ID,
        'Authorization': 'Bearer '+ localStorage.getItem('access.token.key')
      }).then(d => {
        var res = d.results.filter(r => r.address.countrySubdivision === Config.SearchOptions.SEARCH_FILTER_SUBDIVISION);
        res.forEach(r => {
            if (r.address.freeformAddress.endsWith(r.address.municipality) && r.entityType === 'Neighbourhood' && r.address.neighbourhood) {
                r.address.freeformAddress += ` (${r.address.neighbourhood})`;
            }
        });
        return res;
    });
}

function suggestionClickHandler(e, searchBox, searchBtn, filters) {
    var tar = e.target.getElementsByTagName('input')[0];
    searchBox.value = tar.value;
    searchBox.setAttribute(latAttribute, tar.getAttribute(latAttribute));
    searchBox.setAttribute(lonAttribute, tar.getAttribute(lonAttribute));
    searchBox.setAttribute(muniAttribute, tar.getAttribute(muniAttribute));

    // Set Search-Info Area
    var infoArea = document.getElementById('muni-search-info');
    infoArea.parentNode.classList.remove('visually-hidden');
    infoArea.innerHTML = '';
    infoArea.innerHTML += `<h2>${searchBox.value}</h2>`;
    infoArea.innerHTML += '<p>';
    Object.keys(ResultMapper)
        .filter(k => ![latAttribute, lonAttribute, muniAttribute].includes(ResultMapper[k].name))
        .forEach(k => {
            var res = ResultMapper[k];
            if (tar.getAttribute(res.name)) {
                infoArea.innerHTML += `<strong>${res.displayName}</strong> ${tar.getAttribute(res.name)}<br>`;
            }
        });
    infoArea.innerHTML += '</p>';

    // Click Search Button for convenience
    searchBtn.click();
}

function buildUrl(value) {
    var url = `https://atlas.microsoft.com/search/${Config.SearchOptions.SEARCH_TYPE}/json`;
    url += `?api-version=1.0&typeahead=true`;
    url += `&countrySet=${Config.SearchOptions.COUNTRY_SET.join(',')}`;
    url += `&idxSet=${Config.SearchOptions.INDEX_SET.join(',')}&language=${Config.SearchOptions.LANGUAGE}`;
    url += `&query=${Config.SearchOptions.SEARCH_PREFIX}${value}`;
    return url;
}

function closeAllLists(element, searchBox) {
    // Close all potentially open suggestion lists, unless it is the clicked element
    var lists = document.getElementsByClassName(DomIds.Search.Suggestions.List);
    for(var i = 0; i < lists.length; i++) {
        if(element != lists[i] && element != searchBox) {
            lists[i].parentNode.removeChild(lists[i]);
        }
    }
}

