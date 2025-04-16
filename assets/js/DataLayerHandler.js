export class DataLayerHandler {
    static hasErrors() {
        return document.querySelectorAll('.rsform-error').length > 0;
    }

    static pushEvent(eventData) {
        dataLayer.push(eventData);
    }

    static bindTrackEvent(selector, eventType, eventName, step, formId, getData) {
        const element = $(selector);

        if (!element.length) return;

        element.on(eventType, (event) => {
            if (
                (document.activeElement === element[0] && !DataLayerHandler.hasErrors()) ||
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
    }

    static createFormFieldEvent(field) {
        const { name, id, type, tagName, value } = field;
        const fieldName = name || id || 'unknown';
        const fieldType = type || tagName.toLowerCase();
        const isSensitive = /(email|name|phone|tel|adres|address)/i.test(fieldName);
        const fieldValue = isSensitive ? '[masked]' : value;

        return {
            event: 'formFieldChange',
            fieldName,
            fieldType,
            fieldValue,
        };
    }

    static initializeDataLayer() {
        window.dataLayer = window.dataLayer || [];
        const originalPush = window.dataLayer.push;
        const debugMode = DataLayerHandler.debug();

        window.dataLayer.push = (...args) => {
            if (debugMode) {
                args.forEach((arg) => {
                    if (DataLayerHandler.hasErrors()) {
                        console.error(
                            '%c[dataLayer] Validation errors present, check your form.',
                            'color: red; font-weight: bold;',
                        );
                    }
                    console.log('%c[dataLayer]', 'color: green; font-weight: bold;', arg);
                });
            }
            return originalPush.apply(window.dataLayer, args);
        };
    }

    static attachFormEventListeners(form, formId) {
        DataLayerHandler.bindTrackEvent(form, 'rsform-init', 'formStep', 1, formId);
        form[0].dispatchEvent(new Event('rsform-init'));
        DataLayerHandler.bindTrackEvent(
            '.rsform-button-next',
            'click',
            'formStep',
            2,
            formId,
        );
        DataLayerHandler.bindTrackEvent(
            '.rsform-submit-button',
            'click',
            'formSubmission',
            'submit',
            formId,
        );

        form.find('input, select, textarea').each(function (index, element) {
            const fieldId = $(element).attr('id');
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

        form.on('keyup', (event) => {
            const target = event.target;
            const classValue = $(target).attr('class');
            const formId = $(target).closest('form').attr('id');

            if (event.key === 'Enter') {
                let step = null;
                if ($(target).hasClass('rsform-submit-button')) {
                    step = 'submit';
                }
                if ($(target).hasClass('rsform-button-next')) {
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
    }
    static debug() {
        const stagingRegex = /^https:\/\/.*\.staging\.financiallease\.nl\/.*/;
        const isStaging = stagingRegex.test(window.location.href);
        const urlParams = new URLSearchParams(window.location.search);
        return isStaging && urlParams.get('debug') === 'datalayer';
    }

    static log(message, color = '#48dbfb', ...args) {
        if (debugMode) {
            console.log(`%c[DataLayerHandler] 📊 ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        DataLayerHandler.initializeDataLayer();

        // Track all button clicks
        $(document).on('click', 'button, a, input[type="button"], input[type="submit"]', function (event) {
            const target = event.target;
            const tagName = target.tagName.toLowerCase();
            const elementText = $(target).text().trim();
            const elementClass = $(target).attr('class');
            const elementId = $(target).attr('id');
            const elementHref = $(target).attr('href');

            const eventData = {
                event: 'interaction',
                elementType: tagName,
                elementText: elementText,
                elementClass: elementClass,
                elementId: elementId,
                elementHref: elementHref
            };

            DataLayerHandler.pushEvent(eventData);
            DataLayerHandler.log('Button clicked: ' + JSON.stringify(eventData), 'green');
        });

        $(document).ready(() => {
            const form = $('.rsform form');
            if (!form.length) return;

            const formId = form.attr('id');

            DataLayerHandler.attachFormEventListeners(form, formId);
        });
    }
}
