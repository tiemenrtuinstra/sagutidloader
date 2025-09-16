import Logger from '../Logger/Logger';
import type { InstallPromptEvent } from './types/types';

const PWAHandler = {
    deferredPrompt: null as InstallPromptEvent | null,
    installPopupEl: null as HTMLElement | null,
    documentClickHandler: null as ((e: Event) => void) | null,

    init() {
        const installPopup = document.getElementById('installPopup') as HTMLElement | null;
        if (!installPopup) { Logger.Error('Install popup element not found.', 'PWAHandler'); return; }
        this.installPopupEl = installPopup;
        this.hideInstallPopup();
        this.listenForInstallPrompt();
        this.listenForAppInstalled();
        this.registerDocumentClickHandler();
        this.registerServiceWorker();
    },

    hideInstallPopup() { if (!this.installPopupEl) return; this.installPopupEl.style.display = 'none'; Logger.Info('Install popup hidden.', 'PWAHandler'); },

    listenForInstallPrompt() { window.addEventListener('beforeinstallprompt', (e: any) => { e.preventDefault(); this.deferredPrompt = e; if (this.installPopupEl) this.installPopupEl.style.display = 'block'; Logger.Info('Install prompt triggered and popup displayed.', 'PWAHandler'); }); },

    registerDocumentClickHandler() {
        if (this.documentClickHandler) return;
        this.documentClickHandler = async (ev: Event) => {
            const e = ev as MouseEvent & { target: Element };
            try {
                if (!e.target) return;
                const target = e.target as Element;
                if (target.matches('[aria-label="install-app"]')) { ev.preventDefault(); await (this as any).handleInstallAction(); }
                else if (target.matches('[aria-label="dismiss-install-popup"]')) { ev.preventDefault(); if (this.installPopupEl) this.installPopupEl.style.display = 'none'; Logger.Warn('Install popup dismissed.', 'PWAHandler'); }
            } catch (err) { Logger.Warn('Error handling document click', 'PWAHandler'); }
        };
        document.addEventListener('click', this.documentClickHandler);
    },

    async handleInstallAction() {
        if (!this.deferredPrompt) return;
        try {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            if (result && result.outcome === 'accepted') { Logger.Info('🎉 App install accepted by user.', 'PWAHandler'); this.requestForcePrecache(); }
            else { Logger.Warn('❌ App installation declined.', 'PWAHandler'); }
        } catch (err) { Logger.Error('Error during install flow', 'PWAHandler', err); }
        finally { this.deferredPrompt = null; if (this.installPopupEl) this.installPopupEl.style.display = 'none'; }
    },

    listenForAppInstalled() { window.addEventListener('appinstalled', () => { Logger.Info('🎉 App installed (appinstalled event). Triggering FORCE_PRECACHE_NOW', 'PWAHandler'); this.requestForcePrecache(); }); },

    requestForcePrecache() {
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                const channel = new MessageChannel();
                channel.port1.onmessage = (e: any) => Logger.Info('SW FORCE_PRECACHE_NOW result: ' + JSON.stringify(e.data), 'PWAHandler');
                navigator.serviceWorker.controller.postMessage({ type: 'FORCE_PRECACHE_NOW', limit: 0 }, [channel.port2]);
            }
        } catch (err) { Logger.Warn('Failed to request FORCE_PRECACHE_NOW', 'PWAHandler'); }
    },

    registerServiceWorker() { return; }
};

export default PWAHandler;
