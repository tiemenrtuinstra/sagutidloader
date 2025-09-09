import { PWAHandler } from './PWAHandler';
import { ServiceWorkerHandler } from './ServiceWorkerHandler';
import { MetaTagHandler } from './MetaTagHandler';
import { CCommentHandler } from './CCommentHandler';
import { HeaderHandler } from './HeaderHandler';
import { PWAShareHandler } from './PWAShareHandler';
import { DataLayerHandler } from './DataLayerHandler';
import Material from './MaterialEnhancements';
import { Logger, LogType } from './Util/Logger';

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
    Logger?.log?.('Material load skipped: ' + e, undefined, 'sagutid.ts', LogType.WARN);
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
  Logger.log(`Debug mode: ${Logger.debugMode}`, 'sagutid.ts', LogType.INFO);

  // Always-on verification: echo the injected config value for quick debugging (not gated)
  try {
    Logger.info('[Sagutid] injected SAGUTID_CONFIG.debugMode = ' + String((window as any).SAGUTID_CONFIG?.debugMode), 'sagutid.ts');
  } catch (e) {
    // ignore
  }

  const handlers = [
    { condition: !!document.querySelector('#installPopup'), handler: PWAHandler },
    { condition: 'serviceWorker' in navigator, handler: ServiceWorkerHandler },
    { condition: true, handler: MetaTagHandler },
    { condition: true, handler: CCommentHandler },
    { condition: true, handler: HeaderHandler },
    { condition: true, handler: PWAShareHandler },
    { condition: true, handler: DataLayerHandler },
    { condition: true, handler: Material }
  ];

  handlers.forEach(({ condition, handler }) => {
    if (condition) {
      try {
        (handler as any).init();
      } catch (error) {
        Logger.error(`Error initializing ${(handler as any).name}: ${error}`, 'sagutid.ts');
      }
    }
  });
}

initializeApp();
