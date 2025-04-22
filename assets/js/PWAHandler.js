import { Logger } from './Util/Logger.js';

export class PWAHandler {
    static deferredPrompt = null;

    static init() {
        const installPopup = document.getElementById('installPopup');
        if (!installPopup) {
            Logger.error('Install popup element not found.', 'PWAHandler');
            return;
        }

        this.hideInstallPopup(installPopup);
        this.listenForInstallPrompt(installPopup);
        this.handleInstallButtonClick(installPopup);
        this.handleDismissButtonClick(installPopup);
        this.listenForAppInstalled();
        this.registerServiceWorker();
    }

    static hideInstallPopup(installPopup) {
        installPopup.style.display = 'none';
        Logger.log('Install popup hidden.', 'blue', 'PWAHandler');
    }

    static listenForInstallPrompt(installPopup) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            installPopup.style.display = 'block';
            Logger.log('Install prompt triggered and popup displayed.', 'green', 'PWAHandler');
        });
    }

    static handleInstallButtonClick(installPopup) {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('[aria-label="install-app"]')) {
                e.preventDefault();
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const result = await this.deferredPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                        Logger.log('🎉 App successfully installed.', 'green', 'PWAHandler');
                    } else {
                        Logger.log('❌ App installation declined.', 'red', 'PWAHandler');
                    }
                    this.deferredPrompt = null;
                    installPopup.style.display = 'none';
                }
            }
        });
    }

    static handleDismissButtonClick(installPopup) {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[aria-label="dismiss-install-popup"]')) {
                e.preventDefault();
                installPopup.style.display = 'none';
                Logger.log('Install popup dismissed.', 'orange', 'PWAHandler');
            }
        });
    }

    static listenForAppInstalled() {
        window.addEventListener('appinstalled', () => {
            Logger.log('🎉 App successfully installed via appinstalled event.', 'green', 'PWAHandler');
        });
    }

    static registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(SAGUTID_CONFIG.serviceWorkerPath)
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);

                    // Pass additional configuration to the service worker
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'INIT_CONFIG',
                            config: SAGUTID_CONFIG
                        });
                    }
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }
}