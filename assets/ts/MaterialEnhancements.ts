// Lightweight Material-style enhancements: ripple + keyboard activation
// Safe to import in browser bundles. No external deps.

type Options = {
    selector?: string;
    rippleClass?: string;
    rippleColor?: string;
    keyboard?: boolean;
};

const DEFAULTS: Required<Options> = {
    // target elements that will receive ripple behaviour
    selector: '.uk-button--clickable, .uk-icon-link, .uk-chip--clickable, .uk-button.uk-chip--clickable, .el-item a.uk-link-toggle',
    rippleClass: 'uk-ripple',
    rippleColor: 'rgba(255,255,255,0.18)',
    keyboard: true,
};

function readGlobalConfig(): Partial<Options> {
    try {
        const cfg = (window as any).SAGUTID_CONFIG || {};
        return cfg.materialEnhancements || {};
    } catch (e) {
        return {};
    }
}

function ensureRippleStyle(className: string) {
    const id = `material-ripple-style-${className}`;
    if (typeof document === 'undefined') return;
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `.${className} {
    position: absolute;
    left: 0; top: 0;
    width: 8px; height: 8px; border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.95; pointer-events: none;
    transition: transform 420ms cubic-bezier(.22,.61,.36,1), opacity 420ms;
    will-change: transform, opacity; z-index: 9999;
}`;
    document.head.appendChild(style);
}

function createRipple(el: HTMLElement, x: number, y: number, color: string, className: string) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = className;
    ripple.style.left = `${x - rect.left}px`;
    ripple.style.top = `${y - rect.top}px`;
    ripple.style.background = color;

    const maxDim = Math.max(rect.width, rect.height) * 2;

    // ensure container is positioned
    const prevPos = getComputedStyle(el).position;
    if (!prevPos || prevPos === 'static') el.style.position = 'relative';

    el.appendChild(ripple);

    requestAnimationFrame(() => {
        ripple.style.width = `${maxDim}px`;
        ripple.style.height = `${maxDim}px`;
        ripple.style.transform = `translate(-50%, -50%) scale(1)`;
        ripple.style.opacity = '0';
    });

    setTimeout(() => ripple.remove(), 520);
    return ripple;
}

class MaterialEnhancements {
    opts: Required<Options>;
    roots: Set<HTMLElement> = new Set();
    pointerHandler: (e: PointerEvent) => void;
    keydownHandler: (e: KeyboardEvent) => void;

    constructor(options?: Options) {
        const globalCfg = readGlobalConfig();
        this.opts = { ...DEFAULTS, ...globalCfg, ...(options || {}) };

        // ensure ripple CSS exists
        try { ensureRippleStyle(this.opts.rippleClass); } catch (e) { /* ignore */ }

        this.pointerHandler = (e: PointerEvent) => {
            const tgt = e.target as Element | null;
            if (!tgt) return;
            const el = tgt.closest(this.opts.selector) as HTMLElement | null;
            if (!el) return;
            if ('button' in e && (e as any).button !== 0) return;
            createRipple(el, (e as PointerEvent).clientX, (e as PointerEvent).clientY, this.opts.rippleColor, this.opts.rippleClass);
        };

        this.keydownHandler = (e: KeyboardEvent) => {
            if (!this.opts.keyboard) return;
            const tgt = e.target as Element | null;
            if (!tgt) return;
            // ignore typical input elements
            if (/^(INPUT|TEXTAREA|SELECT)$/i.test(tgt.tagName)) return;
            const el = tgt.closest ? (tgt as Element).closest(this.opts.selector) as HTMLElement | null : null;
            if (!el) return;
            if (e.key === 'Enter' || e.key === ' ') {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                createRipple(el, cx, cy, this.opts.rippleColor, this.opts.rippleClass);
                try { (el as HTMLElement).click(); } catch (err) { /* ignore */ }
                e.preventDefault();
            }
        };
    }

    attach(root: Document | HTMLElement = document) {
        if (this.roots.has(root as HTMLElement)) return;
        (root as Document).addEventListener('pointerdown', this.pointerHandler, { passive: true });
        if (this.opts.keyboard) (root as Document).addEventListener('keydown', this.keydownHandler);
        this.roots.add(root as HTMLElement);
    }

    detach(root: Document | HTMLElement = document) {
        if (!this.roots.has(root as HTMLElement)) return;
        (root as Document).removeEventListener('pointerdown', this.pointerHandler);
        if (this.opts.keyboard) (root as Document).removeEventListener('keydown', this.keydownHandler);
        this.roots.delete(root as HTMLElement);
    }

    init(options?: Options) {
        if (options) this.opts = { ...this.opts, ...options };
        if (typeof document === 'undefined') return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.enhanceButtonsAndIcons(document);
                this.setIconsFromClass(document);
                this.attach(document);
            }, { once: true });
        } else {
            this.enhanceButtonsAndIcons(document);
            this.setIconsFromClass(document);
            this.attach(document);
        }
    }

    /**
     * Ensure every `.uk-button` gets `.uk-button--clickable` and
     * every `.uk-icon` gets `.uk-icon-link` (and clickable) so the enhancements apply.
     */
    enhanceButtonsAndIcons(root: Document | HTMLElement = document) {
        try {
            const doc = root as Document;
            // make buttons clickable targets for ripple
            for (const btn of Array.from(doc.querySelectorAll<HTMLElement>('.uk-button'))) {
                if (!btn.classList.contains('uk-button--clickable')) btn.classList.add('uk-button--clickable');
            }

            // ensure icons are marked as link-style and clickable
            for (const ic of Array.from(doc.querySelectorAll<HTMLElement>('.uk-icon'))) {
                if (!ic.classList.contains('uk-icon-link')) ic.classList.add('uk-icon-link');
                if (!ic.classList.contains('uk-button--clickable')) ic.classList.add('uk-button--clickable');
            }
        } catch (e) { /* ignore */ }
    }

    /**
     * Scan the DOM for classes like `uk-icon-home` and set `data-icon="home"`.
     * Converts hyphens to underscores to match Material symbol names (e.g. account-circle -> account_circle).
     */
    setIconsFromClass(root: Document | HTMLElement = document) {
        try {
            const els = Array.from((root as Document).querySelectorAll('.uk-icon--material')) as Element[];
            const re = /^uk-icon-([a-z0-9-]+)$/i;
            els.forEach((el) => {
                const classes = Array.from(el.classList || []);
                for (const c of classes) {
                    const m = re.exec(c);
                    if (m) {
                        const iconName = m[1].replace(/-/g, '_');
                        if (!(el as HTMLElement).hasAttribute('data-icon')) {
                            (el as HTMLElement).setAttribute('data-icon', iconName);
                        }
                        break;
                    }
                }
            });
        } catch (e) { /* ignore non-critical failures */ }
    }

    destroy() {
        this.detach(document);
        this.roots.clear();
    }
}

const Material = new MaterialEnhancements();

export default Material;
export { MaterialEnhancements };
export type { Options };
