import Logger from '../../Domain/Logger/Logger';
import type { Selector } from './types';

const DataLayerHandler = {
    // Keep last values for inputs to avoid duplicate pushes
    lastFieldValues: new WeakMap<Element, any>(),

    get dataLayerName(): string {
        try { const cfg = (window as any).SAGUTID_CONFIG || {}; return (typeof cfg.dataLayerName === 'string' && cfg.dataLayerName) ? cfg.dataLayerName : 'dataLayer'; } catch (e) { return 'dataLayer'; }
    },

    hasErrors(): boolean {
        return document.querySelectorAll('.rsform-error').length > 0;
    },

    pushEvent(eventData: any) {
        const name = (this as any).dataLayerName;
        (window as any)[name] = (window as any)[name] || [];
        try { (window as any)[name].push(eventData); } catch (e) { Array.prototype.push.call((window as any)[name], eventData); }
        if (Logger.debugMode) {
            if ((this as any).hasErrors()) Logger.Error('Validation errors present, check your form.', 'DataLayerHandler');
            Logger.Info('Event pushed to dataLayer: ' + JSON.stringify(eventData), 'DataLayerHandler');
        }
    },

    resolveElements(selector: Selector): Element[] {
        if (!selector) return [];
        if (typeof selector === 'string') return Array.from(document.querySelectorAll(selector));
        if ((selector as NodeListOf<Element>).length !== undefined) return Array.from(selector as NodeListOf<Element>);
        return [selector as Element];
    },

    bindTrackEvent(selector: Selector, eventType: string, eventName: string, step: any, formId: any, getData?: (target: any) => any) {
        const elements = (this as any).resolveElements(selector);
        if (!elements.length) { Logger.Warn(`No elements found for selector: ${String(selector)}`, 'DataLayerHandler'); return; }
        elements.forEach((element) => {
            element.addEventListener(eventType, (event: any) => {
                try {
                    if ((eventType === 'change') || (document.activeElement === element && !(this as any).hasErrors())) {
                        const stepData = step || {};
                        const enrichedData = getData ? getData(event.target) : {};
                        const eventPayload = Object.assign({ event: eventName, formId }, stepData, enrichedData);
                        (this as any).pushEvent(eventPayload);
                    }
                } catch (err) { Logger.Warn('Error in bindTrackEvent handler: ' + ((err as any)?.message || err), 'DataLayerHandler'); }
            });
        });
        Logger.Info(`Event binding added for selector: ${String(selector)}`, 'DataLayerHandler');
    },

    createFormFieldEvent(field: any) {
        const name = field.name || field.id || 'unknown';
        const type = (field.type || (field.tagName || '').toLowerCase()) || 'unknown';
        const isSensitive = /(email|name|phone|tel|adres|address)/i.test(String(name));
        const rawValue = field.value;
        const value = isSensitive ? '[masked]' : rawValue;
        let label = '';
        try { if (field.id) { const lab = document.querySelector(`label[for="${field.id}"]`); if (lab) label = (lab.textContent || '').trim(); } } catch (e) { }
        Logger.Info(`Form field event created for field: ${name}`, 'DataLayerHandler');
        return { event: 'formFieldChange', fieldName: name, fieldType: type, fieldLabel: label, fieldValue: value };
    },

    initializeDataLayer() {
        const name = (this as any).dataLayerName;
        (window as any)[name] = (window as any)[name] || [];
        const originalPush = (window as any)[name].push;
        (window as any)[name].push = (...args: any[]) => { if (Logger.debugMode) args.forEach((arg) => Logger.Info('Pushed to dataLayer: ' + JSON.stringify(arg), 'DataLayerHandler')); return originalPush.apply((window as any)[name], args); };
        Logger.Info('DataLayer initialized and enhanced with debug logging.', 'DataLayerHandler');
    },

    attachFormEventListeners(form: Element, formId: any) {
        (this as any).bindTrackEvent(form, 'rsform-init', 'formStep', { step: 1 }, formId);
        (form as HTMLElement).dispatchEvent(new Event('rsform-init'));
        (this as any).bindTrackEvent('.rsform-button-next', 'click', 'formStep', { step: 2 }, formId);
        (this as any).bindTrackEvent('.rsform-submit-button', 'click', 'formSubmission', { step: 'submit' }, formId);
        (form.querySelectorAll('input, select, textarea') as NodeListOf<Element>).forEach((element: any) => {
            const fieldId = element.id;
            const sel = fieldId ? `#${fieldId}` : element;
            (this as any).bindTrackEvent(sel, 'change', 'formFieldChange', null, formId, (this as any).createFormFieldEvent);
        });
        form.addEventListener('keyup', (event: any) => {
            try {
                const target = event.target as Element | null;
                if (!target) return;
                const classValue = (target as any).className || '';
                const fid = target.closest('form')?.id || formId;
                if (event.key === 'Enter') {
                    let step: any = null;
                    if ((target as Element).classList && (target as Element).classList.contains('rsform-submit-button')) step = 'submit';
                    if ((target as Element).classList && (target as Element).classList.contains('rsform-button-next')) step = 2;
                    if (step) { (this as any).bindTrackEvent(`.${classValue}`, 'click', 'formStep', step, fid); }
                }
            } catch (err) { Logger.Warn('Error handling form keyup: ' + ((err as any)?.message || err), 'DataLayerHandler'); }
        });
        Logger.Info('Form event listeners attached.', 'DataLayerHandler');
    },

    init() {
        if (typeof document === 'undefined') return;
        (this as any).initializeDataLayer();
        document.addEventListener('click', (event: any) => {
            const target = event.target as Element | null;
            if (!target || !(target instanceof Element)) return;
            const tagName = (target.tagName || '').toLowerCase();
            const elementText = (target.textContent || '').trim();
            const elementClass = (target.className || '').toString();
            const elementId = (target as any).id || null;
            const elementHref = (target as any).href || null;
            const eventData = { event: 'interaction', elementType: tagName, elementText, elementClass, elementId, elementHref };
            (this as any).pushEvent(eventData);
            Logger.Info('Interaction tracked: ' + JSON.stringify(eventData), 'DataLayerHandler');
        }, { capture: true });
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.querySelector('.rsform form');
            if (!form) { Logger.Warn('No form found on the page.', 'DataLayerHandler'); return; }
            const formId = (form as any).id;
            (this as any).attachFormEventListeners(form, formId);
        });
        try {
            (window as any).SAGUTID_DATA_LAYER = (window as any).SAGUTID_DATA_LAYER || {};
            (window as any).SAGUTID_DATA_LAYER.pushEvent = (this as any).pushEvent;
            (window as any).SAGUTID_DATA_LAYER.checkHasErrors = (this as any).hasErrors;
            (window as any).SAGUTID_DATA_LAYER.checkManifestNow = undefined;
        } catch (e) { /* ignore */ }
        Logger.Info('DataLayerHandler initialized.', 'DataLayerHandler');
    }
};

export default DataLayerHandler;
