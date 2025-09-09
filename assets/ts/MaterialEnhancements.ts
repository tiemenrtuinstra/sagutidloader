// Lightweight Material-style enhancements: ripple + keyboard activation
// Safe to import in browser bundles. No external deps.

type Options = {
    selector?: string;
    rippleClass?: string;
    rippleColor?: string;
    keyboard?: boolean;
};

const DEFAULTS: Required<Options> = {
    selector: '.uk-button--clickable, .uk-chip--clickable, .uk-button.uk-chip--clickable',
    rippleClass: 'uk-ripple',
    rippleColor: 'rgba(255,255,255,0.18)',
    keyboard: true,
};

function createRipple(el: HTMLElement, x: number, y: number, color: string, className: string) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = className;
    const maxDim = Math.max(rect.width, rect.height) * 2;
    Object.assign(ripple.style, {
        position: 'absolute',
        left: `${x - rect.left}px`,
        top: `${y - rect.top}px`,
        width: '8px',
        height: '8px',
        background: color,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%) scale(0)',
        opacity: '0.95',
        pointerEvents: 'none',
        transition: 'transform 420ms cubic-bezier(.22,.61,.36,1), opacity 420ms',
        willChange: 'transform, opacity',
        zIndex: '9999',
    } as CSSStyleDeclaration);

    // ensure container is positioned
    const prevPos = getComputedStyle(el).position;
    if (prevPos === 'static' || !prevPos) el.style.position = 'relative';

    el.appendChild(ripple);

    // expand
    requestAnimationFrame(() => {
        ripple.style.width = `${maxDim}px`;
        ripple.style.height = `${maxDim}px`;
        ripple.style.transform = `translate(-50%, -50%) scale(1)`;
        ripple.style.opacity = '0';
    });

    // cleanup
    setTimeout(() => {
        ripple.remove();
        // if we changed inline position and it was previously static, leave as-is - minimal side effects
    }, 520);

    return ripple;
}

class MaterialEnhancements {
    opts: Required<Options>;
    roots: Set<HTMLElement> = new Set();
    pointerHandler: (e: PointerEvent) => void;
    keydownHandler: (e: KeyboardEvent) => void;

    constructor(options?: Options) {
        this.opts = { ...DEFAULTS, ...(options || {}) };

        this.pointerHandler = (e: PointerEvent) => {
            const el = (e.target as Element).closest(this.opts.selector) as HTMLElement | null;
            if (!el) return;
            // only left button
            if ('button' in e && (e as any).button !== 0) return;
            createRipple(el, e.clientX, e.clientY, this.opts.rippleColor, this.opts.rippleClass);
        };

        this.keydownHandler = (e: KeyboardEvent) => {
            if (!this.opts.keyboard) return;
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (!target.matches(this.opts.selector)) return;
            if (e.key === 'Enter' || e.key === ' ') {
                // emulate click and centered ripple
                const rect = target.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                createRipple(target, cx, cy, this.opts.rippleColor, this.opts.rippleClass);
                // Trigger native activation
                (target as HTMLElement).click();
                e.preventDefault();
            }
        };
    }

    attach(root: Document | HTMLElement = document) {
        // attach delegated pointer listener at document level for simplicity
        if (!this.roots.has(root as HTMLElement)) {
            (root as Document).addEventListener('pointerdown', this.pointerHandler, { passive: true });
            if (this.opts.keyboard) (root as Document).addEventListener('keydown', this.keydownHandler);
            this.roots.add(root as HTMLElement);
        }
    }

    detach(root: Document | HTMLElement = document) {
        if (this.roots.has(root as HTMLElement)) {
            (root as Document).removeEventListener('pointerdown', this.pointerHandler);
            if (this.opts.keyboard) (root as Document).removeEventListener('keydown', this.keydownHandler);
            this.roots.delete(root as HTMLElement);
        }
    }

    init(options?: Options) {
        if (options) this.opts = { ...this.opts, ...options };
        if (typeof document === 'undefined') return;
        // Attach automatically once DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attach(document);
                this.setIconsFromClass(document);
            });
        } else {
            this.attach(document);
            this.setIconsFromClass(document);
        }
    }

    /**
     * Scan the DOM for classes like `uk-icon-home` and set `data-icon="home"`.
     * Converts hyphens to underscores to match Material symbol names (e.g. account-circle -> account_circle).
     */
    setIconsFromClass(root: Document | HTMLElement = document) {
        try {
            // Only consider elements that explicitly opt-in with .uk-icon--material
            const els = Array.from((root as Document).querySelectorAll('.uk-icon--material')) as Element[];
            const re = /^uk-icon-([a-z0-9-]+)$/i;
            els.forEach((el) => {
                const classes = Array.from(el.classList || []);
                for (const c of classes) {
                    // only match single-dash names like `uk-icon-home` (not `uk-icon--modifier`)
                    const m = re.exec(c);
                    if (m) {
                        const iconName = m[1].replace(/-/g, '_');
                        if (!(el as HTMLElement).hasAttribute('data-icon')) {
                            (el as HTMLElement).setAttribute('data-icon', iconName);
                        }
                        break; // only first match
                    }
                }
            });
        } catch (e) {
            // ignore failures - non-critical
        }
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
