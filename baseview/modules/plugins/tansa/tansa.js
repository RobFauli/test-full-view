export const tansa = {

    // settings: {
    //     baseUrl: 'https://kommune.tansa.com/tansaclient/',   // Settes i admin
    //     licenseKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  // Settes i admin
    //     userId: '<user-email>',
    //     clientExtenstionJs: 'tansa4ClientExtensionSimple.js',
    //     parentAppId: 'ed527f00-6109-11ed-b10c-5974977ab271', // Labrador CMS
    //     parentAppVersion: '',
    //     requireProofingAttribute: 'true'                     // Kjører kun kontroll på dom-elementer med 'tansa-proofing="true"'
    // }
    load: (targets, settings, rect) => {
        // Required by Tansa to position the menu:
        const btn = document.querySelector('#tansa-menu-section') || lab_api.v1.util.dom.renderTemplate(`<div id="tansa-menu-section">
            <input id="content_tansaButton" type="button" value="Display Tansa-menu">
        </div>`, {}, true);
        btn.setAttribute('style', `position:fixed; top: ${ rect.top - 20 }px; left: ${ rect.left }px; height:0;`);
        document.body.appendChild(btn);
        for (const item of targets) {
            const domElement = tansa.getDomElement(item);
            if (domElement) {
                domElement.setAttribute('tansa-proofing', 'true');
            }
        }
        document.defaultView.tansa4ClientExtensionPlugin = {
            replaceText: (tansaReplaceTextFunRef, index, startPos, endPos, replacement, occurrenceNo, textToReplace) => {
                tansaReplaceTextFunRef();
                document.defaultView.tansa.hasModifications = true;
            }
        };
        const tansaLoaderScript = document.getElementById('tansaLoaderScript');
        if (!tansaLoaderScript) {
            document.defaultView.tansa = {
                settings
            };
            document.defaultView.beforeProofing = () => {
                document.defaultView.tansa.hasModifications = false;
            };
            document.defaultView.afterProofing = (cancelled) => {
                if (document.defaultView.tansa.hasModifications) {
                    document.defaultView.tansa.hasModifications = false;
                    tansa.save(targets);
                }
            };
            const script = document.createElement('script');
            script.src = `${ settings.baseUrl }initTansaLoader.js?${ new Date().getTime() }`;
            document.querySelector('head').appendChild(script);
        } else if (document.defaultView.tansa4ClientExtension && typeof document.defaultView.tansa4ClientExtension.initMenu === 'function') {
            document.defaultView.tansa4ClientExtension.initMenu();
        } else {
            console.warn('[Tansa] Error: tansa4ClientExtension missing/incomplete.');
        }
    },

    getDomElement(item) {
        const view = lab_api.v1.view.getView(item.model);
        const markup = view.getMarkup();
        return item.selector ? markup.querySelector(item.selector) : markup;
    },

    save: (targets) => {
        for (const item of targets) {
            const domElement = tansa.getDomElement(item);
            item.value = domElement.innerHTML;
        }
        for (const item of targets) {
            tansa.saveTarget(item);
        }
        lab_api.v1.app.save();
    },

    saveTarget: (item) => {
        if (item.path && item.selector) {
            const view = lab_api.v1.view.getView(item.model);
            view.set(item.path, item.value, true);
        } else {
            setTimeout(() => {
                const domElement = tansa.getDomElement(item);
                domElement.innerHTML = item.value;
                domElement.dispatchEvent(new Event('click'));
                setTimeout(() => {
                    domElement.dispatchEvent(new Event('blur'));
                }, 50);
            }, 200);
        }
    }

};
