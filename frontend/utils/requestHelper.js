import Config from "../modules/config.js";
import ReqManager from "../modules/requestManager.js";

export async function fetchData(fullUrl, headers = {}) {
    const response = await fetch(fullUrl, {
        signal: ReqManager.getSignal(),
        headers: headers
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            if (error.name === 'AbortError') return;
            console.error('Error while fetching data: "', error);
        });
    return response;
}

export async function fetchRawData(fullUrl) {
    return await fetch(fullUrl, { signal: ReqManager.getSignal() })
}

export function getFullUrl(dataSource, queryString) {
    return `${Config.API_URL}/${dataSource}${queryString ? `?${queryString}` : ''}`;
}

export function getQueryString(paramValues) {
    return Object.keys(paramValues).map(paramKey => `${paramKey}=${paramValues[paramKey]}`).join('&');
}

export function getReportUrl(queryString = '') {
    return `${Config.REPORT_URL}?${queryString}`;
}