import Logger from './Util/Logger';

const HeaderHandler = {
    init() {
        if (typeof document === 'undefined') return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.removeHeaderOnPages(), { once: true });
        } else {
            this.removeHeaderOnPages();
        }
    },

    removeHeaderOnPages() {
        try {
            const pathsToRemoveHeader = ['/sagu-overzicht', '/verhalen/', '/gedichten/', '/overig/'];
            const pathname = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
            const shouldRemoveHeader = pathsToRemoveHeader.some(path => pathname.includes(path));
            if (!shouldRemoveHeader) return;
            const selector = '.tm-header-mobile, .tm-header, .tm-toolbar, #mobile-tab-menu, #footer-copyright';
            const win: any = window as any;
            if (win && typeof win.$ === 'function') {
                try { win.$(selector).remove(); Logger.Success('Header verwijderd van pagina (jQuery)', 'HeaderHandler'); return; } catch (e) { }
            }
            const els = document.querySelectorAll(selector);
            if (els && els.length) { els.forEach(el => el.remove()); Logger.Success('Header verwijderd van pagina', 'HeaderHandler'); }
        } catch (err) { Logger.Warn('Failed to remove header elements: ' + ((err as any)?.message || err), 'HeaderHandler'); }
    }
};

export default HeaderHandler;
