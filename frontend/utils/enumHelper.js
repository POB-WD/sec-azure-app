export function getAllValuesFromEnum(enumConst) {
    return Object.keys(enumConst).map(k => enumConst[k]);
}