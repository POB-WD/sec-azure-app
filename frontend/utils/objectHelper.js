export function hasNullValues(obj) {
    return Object.keys(obj).some(k => !obj[k] && obj[k] !== false); // Second condition in case of boolean
}

export function addPropertyIfNotFalsy(obj, value, propertyName) {
    if (value) {
        obj[propertyName] = value;
    }
}

export function filterPropertiesByArray(obj, array) {
    var resultObj = {};
    Object.keys(obj).filter(k => array.includes(k)).forEach(k => resultObj[k] = obj[k]);
    return resultObj;
}