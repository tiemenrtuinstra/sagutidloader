import { PWAHandler } from './PWAHandler.js';
import { ServiceWorkerHandler } from './ServiceWorkerHandler.js';
import { MetaTagHandler } from './MetaTagHandler.js';
import { CCommentHandler } from './CCommentHandler.js';
import { HeaderHandler } from './HeaderHandler.js';
import { PWAShareHandler } from './PWAShareHandler.js';
import { DataLayerHandler } from './DataLayerHandler.js';
import { Logger } from './Util/Logger.js';
import '@material/web/all.js';

function initializeApp() {
  // Log the debug mode status
  Logger.log(`Debug mode: ${Logger.debugMode}`, '#00ff00', 'sagutid.js');
    
  const handlers = [
    { condition: !!document.querySelector('#installPopup'), handler: PWAHandler },
    { condition: 'serviceWorker' in navigator, handler: ServiceWorkerHandler },
    { condition: true, handler: MetaTagHandler },
    { condition: true, handler: CCommentHandler },
    { condition: true, handler: HeaderHandler },
    { condition: true, handler: PWAShareHandler },
    { condition: true, handler: DataLayerHandler }
  ];

  handlers.forEach(({ condition, handler }) => {
    if (condition) {
      try {
        handler.init();
      } catch (error) {
        Logger.error(`Error initializing ${handler.name}: ${error}`, 'sagutid.js');
      }
    }
  });
}

initializeApp();