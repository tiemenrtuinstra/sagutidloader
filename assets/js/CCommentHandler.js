import { Logger } from './Util/Logger.js';

export class CCommentHandler {
    static init() {
        this.removePoweredByLink();
    }

    static removePoweredByLink() {
        const poweredByElements = document.querySelectorAll('.ccomment-powered');

        if (poweredByElements.length > 0) {
            poweredByElements.forEach(element => element.remove());
            Logger.log('CComment "Powered by" link removed', 'orange', 'CCommentHandler');
        }
    }
}