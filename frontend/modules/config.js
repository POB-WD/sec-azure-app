import { loadFiles } from "../utils/fileHelper.js";

class ConfigFile {
    Path = '';
    Index = -1;

    constructor(index, path) {
        this.Index = index;
        this.Path = path;
    }
}

const ConfigFiles = {
    Base: new ConfigFile(0, '../appsettings.json'),
    Dev: new ConfigFile(1, '../appsettings.dev.json'),
    Prod: new ConfigFile(2, '../appsettings.prod.json')
}

// Parse content of Configuration files into Configuration object
async function parseConfigs() {
    return loadFiles(Object.keys(ConfigFiles).map(k => ConfigFiles[k].Path)).then(configs => {
        var baseConfiguration = configs[ConfigFiles.Base.Index];
        var envConfiguration = getEnvironmentConfig(configs);
        return { ...baseConfiguration, ...envConfiguration };
    });
}

// Get Environment Configuration based on hostname
function getEnvironmentConfig(configs) {
    return !configs[ConfigFiles.Base.Index].DevHosts.includes(window.location.hostname) ? configs[ConfigFiles.Prod.Index] : configs[ConfigFiles.Dev.Index];
}

// Setup empty Config object, which enables Javascript Intellisense
const Config = {
    SITE_TITLE: '',
    LOGO_CLIENT_B64: '',
    LOGO_CLIENT_MIME_TYPE: '',
    ViewsFile: '',
    ViewCategoriesFile: '',
    DefaultView: '',
    DEBUG: false,
    API_URL: '',
    REPORT_URL: '',
    AZURE_MAPS_CLIENT_ID: '',
    ENTRA_APP_ID: '',
    ENTRA_TENANT_ID: '',
    DevHosts: [],
    ChartOptions: {
        DEFAULT_COLOR_PALETTE: [''],
        DEFAULT_BORDER_WIDTH: -1
    },
    MapOptions: {
        MAX_BOUNDS: [],
        DEFAULT_VIEW: '',
        DEFAULT_STYLE: '',
        DEFAULT_MOVEMENT_STYLE: '',
        DEFAULT_VIEW_PADDING: {
            top: -1,
            bottom: -1,
            left: -1,
            right: -1
        },
        Controls: {
            DEFAULT_STYLE: '',
            DEFAULT_POSITION: '',
            MAP_STYLES_AVAILABLE: []
        }
    },
    SearchOptions: {
        SEARCH_TYPE: '',
        COUNTRY_SET: [],
        INDEX_SET: [],
        LANGUAGE: '',
        MIN_SEARCH_LENGTH: -1,
        KEY_STROKE_DELAY: -1,
        COUNT_AS_MUNICIPALITY: [],
        SEARCH_PREFIX: '',
        SEARCH_FILTER_SUBDIVISION: ''
    }
}

// Actually get Values for Config and export
Object.assign(Config, await parseConfigs());
export default Config;