export class ServiceWorkerHandler {
    static log(message, color = '#f9ca24', ...args) {
        if (debugMode) {
            console.log(`%c[ServiceWorkerHandler] ⚙️ ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        ServiceWorkerHandler.registerServiceWorker();
        ServiceWorkerHandler.listenForUpdate();
        ServiceWorkerHandler.updateDynamicContent();
    }

    static registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then((reg) => {
                    ServiceWorkerHandler.log('Service worker geregistreerd bij:' + reg.scope, 'green');
                })
                .catch((err) => {
                    ServiceWorkerHandler.log('SW registratie mislukt: ' + err, 'red');
                });
        }
    }

    static listenForUpdate() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data === 'updateAvailable') {
                if (confirm('Nieuwe versie beschikbaar. Nu updaten?')) {
                    location.reload();
                }
            }
        });
    }

    static updateDynamicContent() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_DYNAMIC_CONTENT'
            });
            ServiceWorkerHandler.log('Bericht verzonden naar service worker om dynamische inhoud bij te werken.', 'blue');
        } else {
            ServiceWorkerHandler.log('Service worker controller niet beschikbaar.', 'red');
        }
    }
}