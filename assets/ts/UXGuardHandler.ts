import type { UXGuardOptions } from './types/ux';

const instances = new WeakMap<Document | HTMLElement, {
    selectStartHandler?: EventListener;
    dragStartHandler?: EventListener;
    keyDownHandler?: EventListener;
    contextMenuHandler?: EventListener;
    originalUserSelect?: string;
    originalBodyUserSelect?: string;
}>();

const UXGuardHandler = {
    init() {
        // Initialize with default protection against text selection and context menu
        this.attach(document, {
            disableTextSelection: true,
            disableContextMenu: true
        });
        
        // Log initialization for testing
        try {
            const Logger = (window as any).Logger;
            if (Logger) {
                Logger.Success('UXGuardHandler initialized with text selection and context menu protection', 'UXGuardHandler.ts');
            }
        } catch (e) {
            // Logger not available yet, ignore
        }
    },

    attach(root: Document | HTMLElement = document, opts: UXGuardOptions = {}) {
        try {
            const doc = root as Document;
            // ensure we start from a clean state
            this.detach(root);

            const state: any = {};

            if (opts.disableTextSelection) {
                // Prevent selection through multiple methods
                const selectStartHandler = (e: Event) => { 
                    try { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        
                        // Log text selection prevention
                        const Logger = (globalThis as any)?.Logger;
                        if (Logger) {
                            Logger.Info('Text selection prevented by UXGuard', 'UXGuardHandler.ts');
                        }
                        
                        return false;
                    } catch (_) { /* ignore */ } 
                };
                
                const dragStartHandler = (e: Event) => { 
                    try { 
                        e.preventDefault(); 
                        return false;
                    } catch (_) { /* ignore */ } 
                };

                const keyDownHandler = (e: KeyboardEvent) => {
                    try {
                        // Prevent Ctrl+A (select all), Ctrl+C (copy), Ctrl+X (cut)
                        if (e.ctrlKey && (e.key === 'a' || e.key === 'A' || e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
                            e.preventDefault();
                            return false;
                        }
                    } catch (_) { /* ignore */ }
                };

                doc.addEventListener('selectstart', selectStartHandler, { passive: false });
                doc.addEventListener('dragstart', dragStartHandler, { passive: false });
                doc.addEventListener('keydown', keyDownHandler, { passive: false });
                
                state.selectStartHandler = selectStartHandler;
                state.dragStartHandler = dragStartHandler;
                state.keyDownHandler = keyDownHandler;
                
                try {
                    state.originalUserSelect = (document.documentElement.style as any).userSelect || '';
                    (document.documentElement.style as any).userSelect = 'none';
                    // Also apply to body for better coverage
                    state.originalBodyUserSelect = (document.body?.style as any)?.userSelect || '';
                    if (document.body) (document.body.style as any).userSelect = 'none';
                } catch (e) { /* ignore */ }
            }

            if (opts.disableContextMenu) {
                const contextMenuHandler = (e: Event) => { 
                    try { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        
                        // Log context menu blocking
                        const Logger = (globalThis as any)?.Logger;
                        if (Logger) {
                            Logger.Info('Context menu blocked by UXGuard', 'UXGuardHandler.ts');
                        }
                        
                        return false;
                    } catch (_) { /* ignore */ } 
                };
                doc.addEventListener('contextmenu', contextMenuHandler, { passive: false });
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
            
            // Remove all event listeners
            if (state.selectStartHandler) doc.removeEventListener('selectstart', state.selectStartHandler);
            if (state.dragStartHandler) doc.removeEventListener('dragstart', state.dragStartHandler);
            if (state.keyDownHandler) doc.removeEventListener('keydown', state.keyDownHandler);
            if (state.contextMenuHandler) doc.removeEventListener('contextmenu', state.contextMenuHandler);
            
            // Restore original CSS properties
            if (typeof state.originalUserSelect !== 'undefined') {
                try { (document.documentElement.style as any).userSelect = state.originalUserSelect || ''; } catch (e) { /* ignore */ }
            }
            if (typeof state.originalBodyUserSelect !== 'undefined') {
                try { 
                    if (document.body) (document.body.style as any).userSelect = state.originalBodyUserSelect || '';
                } catch (e) { /* ignore */ }
            }
            
            instances.delete(root);
        } catch (e) { /* ignore */ }
    }
};

export default UXGuardHandler;
