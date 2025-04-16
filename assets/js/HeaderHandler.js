export class HeaderHandler {
    static log(message, color = '#ee5253', ...args) {
        if (debugMode) {
            console.log(`%c[HeaderHandler] 🖼️ ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        HeaderHandler.removeHeaderOnPages();
    }

    static removeHeaderOnPages() {
        var pathsToRemoveHeader = ["/sagu-overzicht", "/verhalen/", "/gedichten/", "/overig/"];
        var shouldRemoveHeader = pathsToRemoveHeader.some(function (path) {
            return window.location.pathname.includes(path);
        });

        if (shouldRemoveHeader) {
            $(".tm-header-mobile, .tm-header, .tm-toolbar, #mobile-tab-menu, #footer-copyright").remove();
            HeaderHandler.log('Header verwijderd van pagina', 'orange');
        }
    }
}