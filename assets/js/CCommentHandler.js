export class CCommentHandler {
    static log(message, color = '#1e3799', ...args) {
        if (debugMode) {
            console.log(`%c[CCommentHandler] 💬 ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        CCommentHandler.removePoweredByLink();
    }

    static removePoweredByLink() {
        if ($(".ccomment-powered").length > 0) {
            $(".ccomment-powered").remove();
            CCommentHandler.log('CComment Powered by link verwijderd', 'orange');
        }
    }
}