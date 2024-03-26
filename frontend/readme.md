# Frontend
Frontend für Mobility Insights

## Ausführung Entwicklungsumgebung
Um das Frontend lokal zu starten, wird folgendes benötigt:
- http-server
- npm

**Initiales Setup**
1. http-server installieren
```Shell
npm install -g http-server
```
2. npm install ausführen, um packages zu laden
```Shell
npm install
```

**Ausführung**
Script `run.ps1` ausführen. Dies startet http-server auf dem richtigen Port (8081). Der Browser wird ebenfalls automatisch geöffnet.

Code-Änderungen können über `STRG+F5` im Browser übernommen werden.

*Die Seite ist nur mit Aufruf über `127.0.0.1` erreichbar. Ein Aufruf über `localhost` wird von der auf Azure hinterlegten CORS-Konfiguration geblockt.*