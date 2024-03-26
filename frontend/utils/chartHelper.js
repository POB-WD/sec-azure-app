export function getTimeLabels(start, end) {
    var labels = []
    for (var i = start; i < end; i++) {
        labels.push((`0${i}:00`).slice(-5));
    }
    return labels;
}

export function parseStartTimeFromInterval(interval) {
    // Interval Strings look like [05:00,06:00)
    return interval?.split(',')[0].slice(-5);
}

export function addLabelToAxis(axis, labelText) {
    axis.ticks.push({ value: labelText });
}