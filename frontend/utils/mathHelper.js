export function ceilPrecision(x, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.ceil(x * multiplier) / multiplier;
}