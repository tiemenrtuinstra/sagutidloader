import Logger from './Util/Logger';

const CCommentHandler = {
    init() {
        if (typeof document === 'undefined') return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.removePoweredByLink(), { once: true });
        } else {
            this.removePoweredByLink();
        }
    },

    removePoweredByLink() {
        try {
            const els = document.getElementsByClassName('ccomment-powered');
            if (!els || els.length === 0) return;
            while (els.length) {
                const el = els[0] as HTMLElement | null;
                if (!el) break;
                el.remove();
            }
            Logger.Warn('CComment "Powered by" link removed', 'CCommentHandler');
        } catch (err) {
            Logger.Warn('Failed to remove CComment powered-by link: ' + ((err as any)?.message || err), 'CCommentHandler');
        }
    }
};

export default CCommentHandler;
