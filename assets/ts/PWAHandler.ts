import { Logger, LogType } from './Util/Logger';

export class PWAHandler {
    static deferredPrompt: any = null;

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

    static hideInstallPopup(installPopup: HTMLElement) {
        installPopup.style.display = 'none';
        Logger.log('Install popup hidden.', 'PWAHandler', LogType.INFO);
    }

    static listenForInstallPrompt(installPopup: HTMLElement) {
        window.addEventListener('beforeinstallprompt', (e: any) => {
            e.preventDefault();
            this.deferredPrompt = e;

            installPopup.style.display = 'block';
            Logger.log('Install prompt triggered and popup displayed.', 'PWAHandler', LogType.INFO);
        });
    }

    static handleInstallButtonClick(installPopup: HTMLElement) {
        document.addEventListener('click', async (e: any) => {
            if (e.target.matches('[aria-label="install-app"]')) {
                e.preventDefault();
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const result = await this.deferredPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                        Logger.log('🎉 App install accepted by user.', 'PWAHandler', LogType.INFO);
                        // Ask service worker to force precache now (best-effort)
                        try {
                            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                                const channel = new MessageChannel();
                                channel.port1.onmessage = (e: any) => Logger.log('SW FORCE_PRECACHE_NOW result: ' + JSON.stringify(e.data), 'PWAHandler');
                                navigator.serviceWorker.controller.postMessage({ type: 'FORCE_PRECACHE_NOW', limit: 0 }, [channel.port2]);
                            }
                        } catch (err) {
                            Logger.warn('Failed to request FORCE_PRECACHE_NOW', 'PWAHandler');
                        }
                    } else {
                        Logger.log('❌ App installation declined.', 'PWAHandler', LogType.ERROR);
                    }
                    this.deferredPrompt = null;
                    installPopup.style.display = 'none';
                }
            }
        });
    }

    static handleDismissButtonClick(installPopup: HTMLElement) {
        document.addEventListener('click', (e: any) => {
            if (e.target.matches('[aria-label="dismiss-install-popup"]')) {
                e.preventDefault();
                installPopup.style.display = 'none';
                Logger.log('Install popup dismissed.', 'PWAHandler', LogType.WARN);
            }
        });
    }

    static listenForAppInstalled() {
        window.addEventListener('appinstalled', () => {
            Logger.log('🎉 App installed (appinstalled event). Triggering FORCE_PRECACHE_NOW', 'PWAHandler', LogType.INFO);
            try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    const channel = new MessageChannel();
                    channel.port1.onmessage = (e: any) => Logger.log('SW FORCE_PRECACHE_NOW result: ' + JSON.stringify(e.data), 'PWAHandler');
                    navigator.serviceWorker.controller.postMessage({ type: 'FORCE_PRECACHE_NOW', limit: 0 }, [channel.port2]);
                }
            } catch (err) {
                Logger.warn('Failed to request FORCE_PRECACHE_NOW after appinstall', 'PWAHandler');
            }
        });
    }

    static registerServiceWorker() {
        // Registration is handled centrally in ServiceWorkerHandler to manage scope and updates
        return;
    }
}
