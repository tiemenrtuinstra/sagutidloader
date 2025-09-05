import { Logger, LogType } from './Util/Logger';

export class DataLayerHandler {
    static hasErrors(): boolean {
        return document.querySelectorAll('.rsform-error').length > 0;
    }

    static pushEvent(eventData: any) {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push(eventData);

        if (Logger.debugMode) {
            if (DataLayerHandler.hasErrors()) {
                Logger.error('Validation errors present, check your form.', 'DataLayerHandler');
            }
            Logger.log('Event pushed to dataLayer:', 'DataLayerHandler', LogType.INFO, eventData);
        }
    }

    static bindTrackEvent(selector: string, eventType: string, eventName: string, step: any, formId: any, getData?: (target:any)=>any) {
        const elements = document.querySelectorAll(selector);

        if (!elements.length) {
            Logger.log(`No elements found for selector: ${selector}`, undefined, 'DataLayerHandler', LogType.WARN);
            return;
        }

        elements.forEach((element) => {
            element.addEventListener(eventType, (event: any) => {
                if (
                    (document.activeElement === element && !DataLayerHandler.hasErrors()) ||
                    eventType === 'change'
                ) {
                    const stepData = step || {};
                    const enrichedData = getData?.(event.target) || {};
                    const eventPayload = {
                        event: eventName,
                        formId,
                        ...stepData,
                        ...enrichedData,
                    };
                    DataLayerHandler.pushEvent(eventPayload);
                }
            });
        });

    Logger.log(`Event binding added for selector: ${selector}`, 'DataLayerHandler', LogType.INFO);
    }

    static createFormFieldEvent(field: any) {
        const { name, id, type, tagName, value } = field;
        const fieldName = name || id || 'unknown';
        const fieldType = type || tagName.toLowerCase();
        const isSensitive = /(email|name|phone|tel|adres|address)/i.test(fieldName);
        const fieldValue = isSensitive ? '[masked]' : value;

    Logger.log(`Form field event created for field: ${fieldName}`, 'DataLayerHandler', LogType.INFO);

        return {
            event: 'formFieldChange',
            fieldName,
            fieldType,
            fieldValue,
        };
    }

    static initializeDataLayer() {
        (window as any).dataLayer = (window as any).dataLayer || [];
        const originalPush = (window as any).dataLayer.push;

        (window as any).dataLayer.push = (...args: any[]) => {
            if (Logger.debugMode) {
                args.forEach((arg) => Logger.log('Pushed to dataLayer:', 'DataLayerHandler', LogType.INFO, arg));
            }
            return originalPush.apply((window as any).dataLayer, args);
        };

    Logger.log('DataLayer initialized and enhanced with debug logging.', 'DataLayerHandler', LogType.INFO);
    }

    static attachFormEventListeners(form: any, formId: any) {
        DataLayerHandler.bindTrackEvent(form, 'rsform-init', 'formStep', 1, formId);
        form.dispatchEvent(new Event('rsform-init'));

        DataLayerHandler.bindTrackEvent('.rsform-button-next', 'click', 'formStep', 2, formId);
        DataLayerHandler.bindTrackEvent('.rsform-submit-button', 'click', 'formSubmission', 'submit', formId);

        form.querySelectorAll('input, select, textarea').forEach((element: any) => {
            const fieldId = element.id;
            if (fieldId) {
                DataLayerHandler.bindTrackEvent(
                    `#${fieldId}`,
                    'change',
                    'formFieldChange',
                    null,
                    formId,
                    DataLayerHandler.createFormFieldEvent,
                );
            }
        });

        form.addEventListener('keyup', (event: any) => {
            const target = event.target;
            const classValue = target.className;
            const formId = target.closest('form')?.id;

            if (event.key === 'Enter') {
                let step = null;
                if (target.classList.contains('rsform-submit-button')) {
                    step = 'submit';
                }
                if (target.classList.contains('rsform-button-next')) {
                    step = 2;
                }

                if (step) {
                    DataLayerHandler.bindTrackEvent(
                        `.${classValue}`,
                        'click',
                        'formStep',
                        step,
                        formId,
                    );
                }
            }
        });

    Logger.log('Form event listeners attached.', 'DataLayerHandler', LogType.INFO);
    }

    static init() {
        DataLayerHandler.initializeDataLayer();

        // Track all button clicks
        document.addEventListener('click', (event: any) => {
            const target = event.target as any;
            const tagName = target.tagName.toLowerCase();
            const elementText = target.textContent.trim();
            const elementClass = target.className;
            const elementId = target.id;
            const elementHref = target.href;

            const eventData = {
                event: 'interaction',
                elementType: tagName,
                elementText,
                elementClass,
                elementId,
                elementHref,
            };

            DataLayerHandler.pushEvent(eventData);
            Logger.log('Button clicked:', 'DataLayerHandler', LogType.INFO, eventData);
        });

        document.addEventListener('DOMContentLoaded', () => {
            const form = document.querySelector('.rsform form');
            if (!form) {
                Logger.log('No form found on the page.', undefined, 'DataLayerHandler', LogType.WARN);
                return;
            }

            const formId = (form as any).id;

            DataLayerHandler.attachFormEventListeners(form, formId);
        });

    Logger.log('DataLayerHandler initialized.', 'DataLayerHandler', LogType.INFO);
    }
}
