import type { UXGuardOptions } from './types/ux';

const instances = new WeakMap<Document | HTMLElement, {
    selectStartHandler?: EventListener;
    contextMenuHandler?: EventListener;
    originalUserSelect?: string;
}>();

const UXGuardHandler = {
    attach(root: Document | HTMLElement = document, opts: UXGuardOptions = {}) {
        try {
            const doc = root as Document;
            // ensure we start from a clean state
            this.detach(root);

            const state: any = {};

            if (opts.disableTextSelection) {
                const selectStartHandler = (e: Event) => { try { e.preventDefault(); } catch (_) { /* ignore */ } };
                doc.addEventListener('selectstart', selectStartHandler);
                state.selectStartHandler = selectStartHandler;
                try {
                    state.originalUserSelect = (document.documentElement.style as any).userSelect || '';
                    (document.documentElement.style as any).userSelect = 'none';
                } catch (e) { /* ignore */ }
            }

            if (opts.disableContextMenu) {
                const contextMenuHandler = (e: Event) => { try { e.preventDefault(); } catch (_) { /* ignore */ } };
                doc.addEventListener('contextmenu', contextMenuHandler);
                state.contextMenuHandler = contextMenuHandler;
            }

            instances.set(root, state);
        } catch (e) { /* ignore */ }
    },

    detach(root: Document | HTMLElement = document) {
        try {
            const doc = root as Document;
            const state = instances.get(root);
            if (!state) return;
            if (state.selectStartHandler) doc.removeEventListener('selectstart', state.selectStartHandler);
            if (state.contextMenuHandler) doc.removeEventListener('contextmenu', state.contextMenuHandler);
            if (typeof state.originalUserSelect !== 'undefined') {
                try { (document.documentElement.style as any).userSelect = state.originalUserSelect || ''; } catch (e) { /* ignore */ }
            }
            instances.delete(root);
        } catch (e) { /* ignore */ }
    }
};

export default UXGuardHandler;
