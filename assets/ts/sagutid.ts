import PWAHandler from './PWAHandler';
import ServiceWorkerHandler from './ServiceWorkerHandler';
import * as MetaTagHandlerMod from './MetaTagHandler';
import * as CCommentHandlerMod from './CCommentHandler';
import * as HeaderHandlerMod from './HeaderHandler';
import PWAShareHandler from './PWAShareHandler';
import * as DataLayerHandlerMod from './DataLayerHandler';
import * as UXGuardHandlerMod from './UXGuardHandler';
import * as MaterialMod from './MaterialEnhancements';
import Logger, { LogType } from './Util/Logger';

// Lazy-load Material Web only when needed to keep initial bundle small
async function loadMaterialIfNeeded() {
  try {
    if (typeof document === 'undefined') return;
    // Detect any Material Web custom element tags (md-*) present in DOM
    const hasMaterialElements = Array.from(document.getElementsByTagName('*')).some(
      (el) => el.tagName.startsWith('MD-')
    );
    if (!hasMaterialElements) return;

    // Load the full Material library and typography styles as a single async chunk
    await import(/* webpackChunkName: "material" */ '@material/web/all.js');
    const { styles: typescaleStyles } = await import(
      /* webpackChunkName: "material" */ '@material/web/typography/md-typescale-styles.js'
    );

    if ('adoptedStyleSheets' in document && (typescaleStyles as any)?.styleSheet) {
      (document as any).adoptedStyleSheets.push((typescaleStyles as any).styleSheet);
    }
  } catch (e) {
    Logger.Log('Material load skipped: ' + e, 'sagutid.ts', LogType.WARN);
  }
}

function initializeApp() {
  // Optionally load Material bundle and typography if the page uses md-* elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadMaterialIfNeeded(), { once: true });
  } else {
    // DOM is ready enough to scan
    loadMaterialIfNeeded();
  }

  // Log the debug mode status
  Logger.Log(`Debug mode: ${Logger.debugMode}`, 'sagutid.ts', LogType.INFO);

  // Always-on verification: echo the injected config value for quick debugging (not gated)
  try {
    Logger.Info('[Sagutid] injected SAGUTID_CONFIG.debugMode = ' + String((window as any).SAGUTID_CONFIG?.debugMode), 'sagutid.ts');
  } catch (e) {
    // ignore
  }

  // Helper: normalize various module shapes into an object exposing init() for legacy modules
  const normalize = (mod: any) => {
    if (!mod) return null;
    if (mod.default && typeof mod.default.init === 'function') return mod.default;
    if (typeof mod.init === 'function') return mod;
    for (const k of Object.keys(mod)) {
      if (mod[k] && typeof mod[k].init === 'function') return mod[k];
    }
    return null;
  };

  // Directly initialize handlers that are now default singletons
  try {
    if (document.querySelector('#installPopup')) PWAHandler.init();
  } catch (error) { Logger.Error(`Error initializing PWAHandler: ${error}`, 'sagutid.ts'); }

  try {
    if ('serviceWorker' in navigator) ServiceWorkerHandler.init();
  } catch (error) { Logger.Error(`Error initializing ServiceWorkerHandler: ${error}`, 'sagutid.ts'); }

  // Initialize remaining handlers (some modules still export named shapes)
  const remaining: any[] = [MetaTagHandlerMod, CCommentHandlerMod, HeaderHandlerMod, PWAShareHandler, DataLayerHandlerMod, MaterialMod, UXGuardHandlerMod];
  remaining.forEach((mod) => {
    const h = normalize(mod) || (mod && (mod as any).init ? (mod as any) : null);
    if (!h) return;
    try { h.init(); } catch (err) { Logger.Error(`Error initializing handler: ${err}`, 'sagutid.ts'); }
  });
}

initializeApp();
