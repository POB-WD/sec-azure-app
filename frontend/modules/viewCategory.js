import { loadFile } from "../utils/fileHelper.js";
import Config from "./config.js";
import Views from "./view.js";

class ViewCategory {
    Name = '';
    DisplayName = '';
    Icon = '';
    Views = [];

    constructor(name, displayName, icon, views = []) {
        this.Name = name;
        this.DisplayName = displayName;
        this.Icon = icon || 'bi-square';
        this.Views = views.map(v => Views[v]);
    }

    static async importAll(fileToImport) {
        return loadFile(fileToImport)
            .then(file => Object.keys(file).map(key => file[key]))
            .then(categories => ViewCategory.#generateObjectFromViews(categories));
    }

    static #generateObjectFromViews(categories) {
        var categoryObject = {};
        categories.forEach(category => categoryObject[category.name] = this.#getViewFromObject(category));
        return categoryObject;
    }

    static #getViewFromObject(category) {
        return new ViewCategory(category.name, category.displayName, category.icon, category.views);
    }
}

const ViewCategories = await ViewCategory.importAll(Config.ViewCategoriesFile);

export default ViewCategories;