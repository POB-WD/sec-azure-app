// Load file content as Object
export async function loadFile(file) {
    return fetch(file).then(f => f.json());
}

// Load multiple files' content as multiple Objects
export async function loadFiles(files) {
    return Promise.all(files.map(f => loadFile(f)));
}