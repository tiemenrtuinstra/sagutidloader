import PWAHandler from './Domain/PWA/PWAHandler';
import ServiceWorkerHandler from './Domain/ServiceWorker/ServiceWorkerHandler';
import MetaTagHandler from './Domain/Meta/MetaTagHandler';
import CCommentHandler from './Domain/Comments/CCommentHandler';
import HeaderHandler from './Domain/Header/HeaderHandler';
import PWAShareHandler from './Domain/PWA/PWAShareHandler';
import DataLayerHandler from './Domain/Analytics/DataLayerHandler';
import UXGuardHandler from './Domain/UX/UXGuardHandler';
import Material from './Domain/Material/MaterialEnhancements';
import Logger, { LogType } from './Domain/Util/Logger';
import SpeechReader from './Domain/Speech/SpeechReader';

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

  // Initialize handlers (all handlers are exported as default singletons)
  try {
    if (document.querySelector('#installPopup')) PWAHandler.init();
  } catch (error) { Logger.Error(`Error initializing PWAHandler: ${error}`, 'sagutid.ts'); }

  try {
    if ('serviceWorker' in navigator) ServiceWorkerHandler.init();
  } catch (error) { Logger.Error(`Error initializing ServiceWorkerHandler: ${error}`, 'sagutid.ts'); }

  const handlers: any[] = [MetaTagHandler, CCommentHandler, HeaderHandler, PWAShareHandler, DataLayerHandler, Material, UXGuardHandler];
  handlers.forEach((h) => {
    if (!h) return;
    try { if (typeof h.init === 'function') h.init(); } catch (err) { Logger.Error(`Error initializing handler: ${err}`, 'sagutid.ts'); }
  });

  // Initialize optional speech reader for buttons with .speech-reader-button
  try { SpeechReader.init(); } catch (e) { Logger.Warn('SpeechReader init failed: ' + e); }
}

initializeApp();
