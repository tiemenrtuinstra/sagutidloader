export class PWAHandler {
    static deferredPrompt = null;

    static log(message, color = '#29abe2', ...args) {
        if (debugMode) {
            console.log(`%c[PWAHandler] 🚀 ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        const $installPopup = $('#installPopup');
        PWAHandler.hideInstallPopup($installPopup);
        PWAHandler.listenForInstallPrompt();
        PWAHandler.handleInstallButtonClick();
        PWAHandler.handleDismissButtonClick();
        PWAHandler.listenForAppInstalled();
    }

    static hideInstallPopup(installPopup) {
        installPopup.hide();
    }

    static listenForInstallPrompt(installPopup) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            PWAHandler.deferredPrompt = e;

            installPopup.fadeIn();
            PWAHandler.log('Installatie popup getoond');
        });
    }

    static handleInstallButtonClick() {
        $(document).on('click', '[aria-label="install-app"]', async (e) => {
            e.preventDefault();
            if (PWAHandler.deferredPrompt) {
                PWAHandler.deferredPrompt.prompt();
                const result = await PWAHandler.deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    PWAHandler.log('🎉 Sagutid is geïnstalleerd', 'green');
                } else {
                    PWAHandler.log('❌ Installatie geweigerd', 'red');
                }
                PWAHandler.deferredPrompt = null;
                $('#installPopup').fadeOut();
            }
        });
    }

    static handleDismissButtonClick() {
        $(document).on('click', '[aria-label="dismiss-install-popup"]', (e) => {
            e.preventDefault();
            $('#installPopup').fadeOut();
            PWAHandler.log('Installatie popup gesloten');
        });
    }

    static listenForAppInstalled() {
        window.addEventListener('appinstalled', () => {
            PWAHandler.log('🎉 App succesvol geïnstalleerd', 'green');
        });
    }
}