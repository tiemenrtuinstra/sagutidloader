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
                            Logger.log('🎉 App successfully installed.', 'PWAHandler', LogType.INFO);
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
                    Logger.log('🎉 App successfully installed via appinstalled event.', 'PWAHandler', LogType.INFO);
        });
    }

    static registerServiceWorker() {
        // Registration is handled centrally in ServiceWorkerHandler to manage scope and updates
        return;
    }
}
