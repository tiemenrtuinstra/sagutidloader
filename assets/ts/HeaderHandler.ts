import { Logger, LogType } from './Util/Logger';

export class HeaderHandler {

    static init() {
        HeaderHandler.removeHeaderOnPages();
    }

    static removeHeaderOnPages() {
        const pathsToRemoveHeader = ["/sagu-overzicht", "/verhalen/", "/gedichten/", "/overig/"];
        const shouldRemoveHeader = pathsToRemoveHeader.some(path => window.location.pathname.includes(path));

        if (shouldRemoveHeader) {
            // jQuery usage retained
            (window as any).$(".tm-header-mobile, .tm-header, .tm-toolbar, #mobile-tab-menu, #footer-copyright").remove();
            Logger.log('Header verwijderd van pagina', undefined, 'HeaderHandler', LogType.WARN);
        }
    }
}
