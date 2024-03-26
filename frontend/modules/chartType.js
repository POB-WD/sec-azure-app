import AgeGroup from "../constants/ageGroups.js";
import Gender from "../constants/genders.js";
import { getAllValuesFromEnum } from "../utils/enumHelper.js";
import { addLabelToAxis, getTimeLabels, parseStartTimeFromInterval } from "../utils/chartHelper.js";
import { getCssVariableValue } from "../utils/domHelper.js";
import { getFullUrl, getQueryString } from "../utils/requestHelper.js";
import Config from "./config.js";
import Demographics, { DemographicsDisplayNames } from "../constants/demographics.js";

// Classes
export class ChartOptions {
    title = '';
    responsive = true;
    maintainAspectRatio = false;
    type = '';
    scales = {
        y: {
            beginAtZero: true
        }
    };
    options = {};

    toChartOptions() {
        return {
            type: this.type,
            options: Object.assign(this.options, {
                responsive: this.responsive,
                maintainAspectRatio: this.maintainAspectRatio,
                scales: this.scales,
                plugins: {
                    title: {
                        display: true,
                        text: this.title,
                        position: 'top',
                        align: 'center'
                    }
                }
            })
        };
    }
}

class ChartDataset {
    label = '';
    backgroundColor = '';
    borderColor = '';
    borderWidth = -1;

    constructor(label, color, borderWidth, customCallback, customArgs = []) {
        this.label = label;
        this.backgroundColor = getCssVariableValue(`${color}-trans`);
        this.borderColor = getCssVariableValue(color);
        this.borderWidth = borderWidth;

        if (customCallback) {
            this.dataCallback = customCallback.bind(this, ...customArgs);
        }
    }

    dataCallback(datapoints) {
        return datapoints;
    }
}

export class ChartType {
    Name = '';
    DisplayName = '';
    DataSource = '';
    Params = [];
    Labels = [];
    Datasets = [];

    // Options
    Type = '';
    ChartOptions = new ChartOptions();

    constructor(name, displayName, dataSource, params = [], labels = [], datasets = [], options = new ChartOptions(), urlCallback, shouldBeShownOverride) {
        this.Name = name;
        this.DisplayName = displayName;
        this.DataSource = dataSource;
        this.Params = params;
        this.Labels = labels;
        this.Datasets = datasets;
        Object.assign(this.ChartOptions, options);
        this.ChartOptions.title = this.DisplayName;

        if (urlCallback) {
            this.urlCallback = urlCallback.bind(this);
        }

        if (shouldBeShownOverride) {
            this.shouldBeShown = shouldBeShownOverride.bind(this);
        }
    }

    shouldBeShown({}) {
        return true;
    }

    getUrl(paramValues) {
        return this.urlCallback ? this.urlCallback(paramValues) : getFullUrl(this.DataSource, getQueryString(paramValues));
    }

    getChartOptions() {
        return {...this.ChartOptions.toChartOptions(),
            data: {
                labels: this.Labels,
                datasets: this.Datasets
            }
        };
    }
}

// Function Overrides
function getUrlWithRadiusZero(paramValues) {
    paramValues['radius'] = 0;
    return getFullUrl(this.DataSource, getQueryString(paramValues));
}

function setDemoTotal(paramValues) {
    return setDemoParameter(this, paramValues, Demographics.DailyPopulation);
}

function setDemoResidents(paramValues) {
    return setDemoParameter(this, paramValues, Demographics.Residents);
}

function setDemoVisitors(paramValues) {
    return setDemoParameter(this, paramValues, Demographics.Visitors);
}

function setDemoParameter(context, paramValues, value) {
    paramValues['demo'] = value;
    return getFullUrl(context.DataSource, getQueryString(paramValues));
}

function passersbyDataFunction(datapoints) {
    return datapoints.map(index => {
        return {
            x: parseStartTimeFromInterval(index.timeSlice),
            y: Math.round(index.uniquePassersby)
        };
    });
}

function passersbyDemographicsDataFunction(gender, datapoints) {
    var sum = datapoints.map(d => d.uniquePassersby).reduce((acc, cur) => acc + cur, 0);
    return datapoints.filter(d => d.gender === gender).map(index => {
        return {
            x: index.ageGroup === AgeGroup.Unknown ? 'Unbekannt' : index.ageGroup,
            y: Math.round(index.uniquePassersby / sum * 100)
        }
    });
}

function visitorDemographicsDataFunction(gender, datapoints) {
    var sum = datapoints.map(d => d.uniqueVisitors).reduce((acc, cur) => acc + cur, 0);
    return datapoints.filter(d => d.gender === gender).map(index => {
        return {
            x: index.ageGroup === AgeGroup.Unknown ? 'Unbekannt' : index.ageGroup,
            y: Math.round(index.uniqueVisitors / sum * 100)
        }
    });
}

function visitorsDataFunction(datapoints) {
    return datapoints.map(index => {
        return {
            x: parseStartTimeFromInterval(index.timeSlice),
            y: Math.round(index.uniqueVisitors)
        };
    });
}

// ShouldBeShown Overrides
function onlyShowInAreaMode({ isArea }) {
    return isArea;
}

function onlyShowWhenNotInAreaMode({ isArea }) {
    return !isArea;
}

function showWhenAreaOrNotMunicipality({ isArea, isMunicipality }) {
    return isArea || !isMunicipality;
}

// Charts
const ChartTypes = {};

// Passersby
ChartTypes['Passersby'] = new ChartType(
    'Passersby',
    'Durchreisende',
    'PassersbyStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday'],
    getTimeLabels(5, 24),
    [
        new ChartDataset('Durchreisende', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    minRotation: 20
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    }
);

// PassersbyGrid
ChartTypes['PassersbyGrid'] = new ChartType(
    'PassersbyGrid',
    'Durchreisende durch Gemeinde auf Rasterbasis',
    'PassersbyGridStats',
    ['areaid', 'lon', 'lat', 'res', 'month', 'weekday', 'ageGroup', 'gender'],
    getTimeLabels(5,24),
    [
        new ChartDataset('Durchreisende', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    align: 'end'
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    },
    undefined,
    onlyShowWhenNotInAreaMode
);

// Grid Demographics
ChartTypes['PassersbyGridDemographics'] = new ChartType(
    'PassersbyGridDemographics',
    `Soziodemografie für Durchreisende durch Gemeinde auf Rasterbasis`,
    'PassersbyGridDemographicsStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender', 'res'],
    getAllValuesFromEnum(AgeGroup).map(value => value === AgeGroup.Unknown ? 'Unbekannt' : value),
    [
        new ChartDataset('Männlich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDemographicsDataFunction, [Gender.Male]),
        new ChartDataset('Weiblich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[1], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDemographicsDataFunction, [Gender.Female])
    ],
    {
        type: 'bar',
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Altersgruppe'
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                title: {
                    display: true,
                    text: 'Prozent'
                }
            }
        }
    }
);

// PassersbyGridPerimeter
ChartTypes['PassersbyGridPerimeter'] = new ChartType(
    'PassersbyGridPerimeter',
    'Durchreisende durch Umkreis auf Rasterbasis',
    'PassersbyGridPerimeterStats',
    ['areaid', 'lon', 'lat', 'res', 'radius', 'month', 'weekday', 'ageGroup', 'gender'],
    getTimeLabels(5,24),
    [
        new ChartDataset('Durchreisende', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    align: 'end'
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    },
    undefined,
    onlyShowInAreaMode
);

ChartTypes['PassersbyGridPerimeterDemographics'] = new ChartType(
    'PassersbyGridPerimeterDemographics',
    `Soziodemografie für Durchreisende durch Umkreis auf Rasterbasis`,
    'PassersbyGridPerimeterDemographicsStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender', 'res', 'radius'],
    getAllValuesFromEnum(AgeGroup).map(value => value === AgeGroup.Unknown ? 'Unbekannt' : value),
    [
        new ChartDataset('Männlich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDemographicsDataFunction, [Gender.Male]),
        new ChartDataset('Weiblich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[1], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDemographicsDataFunction, [Gender.Female])
    ],
    {
        type: 'bar',
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Altersgruppe'
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                title: {
                    display: true,
                    text: 'Prozent'
                }
            }
        }
    }
);

// PassersByTile
ChartTypes['PassersbyTile'] = new ChartType(
    'PassersbyTile',
    'Durchreisende durch Adress-Rasterzelle',
    'PassersbyGridPerimeterStats',
    ['areaid', 'lon', 'lat', 'res', 'radius', 'month', 'weekday', 'ageGroup', 'gender'],
    getTimeLabels(5, 24),
    [
        new ChartDataset('Durchreisende', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    align: 'end'
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    },
    getUrlWithRadiusZero,
    showWhenAreaOrNotMunicipality
);

ChartTypes['PassersbyTileDemographics'] = new ChartType(
    'PassersbyTileDemographics',
    `Soziodemografie für Durchreisende durch Adress-Rasterzelle`,
    'PassersbyGridPerimeterDemographicsStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender', 'res'],
    getAllValuesFromEnum(AgeGroup).map(value => value === AgeGroup.Unknown ? 'Unbekannt' : value),
    [
        new ChartDataset('Männlich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDemographicsDataFunction, [Gender.Male]),
        new ChartDataset('Weiblich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[1], Config.ChartOptions.DEFAULT_BORDER_WIDTH, passersbyDemographicsDataFunction, [Gender.Female])
    ],
    {
        type: 'bar',
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Altersgruppe'
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                title: {
                    display: true,
                    text: 'Prozent'
                }
            }
        }
    },
    getUrlWithRadiusZero,
    showWhenAreaOrNotMunicipality
);

// Visitors
ChartTypes['Visitors'] = new ChartType(
    'Visitors',
    `Aufenthalte ${DemographicsDisplayNames[Demographics.Visitors]}`,
    'VisitorStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender'],
    getTimeLabels(5,24),
    [
        new ChartDataset('Aufenthalte > 30 Minuten', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorsDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    align: 'end'
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    },
    setDemoVisitors
);

ChartTypes['Residents'] = new ChartType(
    'Residents',
    `Aufenthalte ${DemographicsDisplayNames[Demographics.Residents]}`,
    'VisitorStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender'],
    getTimeLabels(5,24),
    [
        new ChartDataset('Aufenthalte > 30 Minuten', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorsDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    align: 'end'
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    },
    setDemoResidents
);

ChartTypes['DailyPopulation'] = new ChartType(
    'DailyPopulation',
    `Aufenthalte ${DemographicsDisplayNames[Demographics.DailyPopulation]}`,
    'VisitorStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender'],
    getTimeLabels(5,24),
    [
        new ChartDataset('Aufenthalte > 30 Minuten', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorsDataFunction)
    ],
    {
        type: 'bar',
        scales: {
            x: {
                afterBuildTicks: function(event) {
                    addLabelToAxis(event, '00:00');
                },
                ticks: {
                    align: 'end'
                },
                title: {
                    display: true,
                    text: 'Uhrzeit'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Anzahl'
                }
            }
        }
    },
    setDemoTotal
);

// VisitorDemographics
ChartTypes['VisitorDemographics'] = new ChartType(
    'VisitorDemographics',
    `Soziodemografie ${DemographicsDisplayNames[Demographics.Visitors]}`,
    'VisitorDemographicsStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender', 'demo'],
    getAllValuesFromEnum(AgeGroup).map(value => value === AgeGroup.Unknown ? 'Unbekannt' : value),
    [
        new ChartDataset('Männlich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorDemographicsDataFunction, [Gender.Male]),
        new ChartDataset('Weiblich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[1], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorDemographicsDataFunction, [Gender.Female])
    ],
    {
        type: 'bar',
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Altersgruppe'
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                title: {
                    display: true,
                    text: 'Prozent'
                }
            }
        }
    },
    setDemoVisitors
);

ChartTypes['InhabitantDemographics'] = new ChartType(
    'InhabitantDemographics',
    `Soziodemografie ${DemographicsDisplayNames[Demographics.Residents]}`,
    'VisitorDemographicsStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender', 'demo'],
    getAllValuesFromEnum(AgeGroup).map(value => value === AgeGroup.Unknown ? 'Unbekannt' : value),
    [
        new ChartDataset('Männlich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorDemographicsDataFunction, [Gender.Male]),
        new ChartDataset('Weiblich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[1], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorDemographicsDataFunction, [Gender.Female])
    ],
    {
        type: 'bar',
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Altersgruppe'
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                title: {
                    display: true,
                    text: 'Prozent'
                }
            }
        }
    },
    setDemoResidents
);

ChartTypes['TotalDemographics'] = new ChartType(
    'TotalDemographics',
    `Soziodemografie ${DemographicsDisplayNames[Demographics.DailyPopulation]}`,
    'VisitorDemographicsStats',
    ['areaid', 'lon', 'lat', 'month', 'weekday', 'ageGroup', 'gender', 'demo'],
    getAllValuesFromEnum(AgeGroup).map(value => value === AgeGroup.Unknown ? 'Unbekannt' : value),
    [
        new ChartDataset('Männlich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[0], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorDemographicsDataFunction, [Gender.Male]),
        new ChartDataset('Weiblich', Config.ChartOptions.DEFAULT_COLOR_PALETTE[1], Config.ChartOptions.DEFAULT_BORDER_WIDTH, visitorDemographicsDataFunction, [Gender.Female])
    ],
    {
        type: 'bar',
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Altersgruppe'
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                title: {
                    display: true,
                    text: 'Prozent'
                }
            }
        }
    },
    setDemoTotal
);

export default ChartTypes;