import { Logger } from './Util/Logger.js';

export class ServiceWorkerHandler {
    static init() {
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
            this.listenForUpdate();
            this.updateDynamicContent();
        } else {
            Logger.log('Service workers are not supported in this browser.', 'orange', 'ServiceWorkerHandler');
        }
    }

    static registerServiceWorker() {
        if (typeof serviceWorkerPath === 'undefined') {
            Logger.error('Service worker path is not defined.', 'ServiceWorkerHandler');
            return;
        }

        navigator.serviceWorker.register(serviceWorkerPath)
            .then((reg) => {
                Logger.log(`Service worker registered at: ${reg.scope}`, 'green', 'ServiceWorkerHandler');
            })
            .catch((err) => {
                Logger.error(`Service worker registration failed: ${err}`, 'ServiceWorkerHandler');
            });
    }

    static listenForUpdate() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data === 'updateAvailable') {
                if (confirm('A new version is available. Update now?')) {
                    location.reload();
                }
            }
        });

        Logger.log('Listening for service worker updates.', 'blue', 'ServiceWorkerHandler');
    }

    static updateDynamicContent() {
        const controller = navigator.serviceWorker.controller;
        if (controller) {
            controller.postMessage({ type: 'UPDATE_DYNAMIC_CONTENT' });
            Logger.log('Message sent to service worker to update dynamic content.', 'blue', 'ServiceWorkerHandler');
        } else {
            Logger.error('Service worker controller is not available.', 'ServiceWorkerHandler');
        }
    }
}