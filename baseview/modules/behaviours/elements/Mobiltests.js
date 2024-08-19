export default class MobilTests {

    constructor(api, params) {
        this.api = api;
        this.rootModel = api.v1.model.query.getRootModel();
    }

    // Prepare url for external data
    onViewHelper(model, view) {
        const site = this.api.v1.site.getSite();
        model.setFiltered('siteId', site.id);
        model.setFiltered('testId', model.get('fields.testId'));

        const layoutOptionsMap = {
            0: 'Score + pros/cons',
            1: 'Score + pros/cons + specs',
            2: 'Score + specs',
            3: 'Pros/cons + specs',
            4: 'Score',
            5: 'Pros/cons',
            6: 'Specs'
        };
        const layoutOption = model.get('fields.layoutOption') || '0';

        const visible = {
            score: (layoutOption === '0' || layoutOption === '1' || layoutOption === '2' || layoutOption === '4'),
            prosCons: (layoutOption === '0' || layoutOption === '1' || layoutOption === '3' || layoutOption === '5'),
            specs: (layoutOption === '1' || layoutOption === '2' || layoutOption === '3' || layoutOption === '6')
        };
        model.setFiltered('visible', visible);

        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug'));
        const layoutOptions = [];
        for (const element of Object.keys(layoutOptionsMap)) {
            layoutOptions.push({
                key: element,
                value: layoutOptionsMap[element],
                selected: element === layoutOption
            });
        }

        model.setFiltered('layoutOptions', layoutOptions);
        model.setFiltered('apiEndpoint', layoutOptionsMap[layoutOption]);
        model.setFiltered('topScore', model.get('fields.topScore') === 'on');
        model.setFiltered('recommended', model.get('fields.recommended') === 'on');
        model.setFiltered('titleWithGrade', model.get('fields.titleWithGrade') === 'on');
        model.setFiltered('titleWithFacts', model.get('fields.titleWithFacts') === 'on');

        if (this.api.v1.app.mode.isEditor()) {
            const scoreOptions = [];
            let score = model.get('fields.score') || '0';
            score = parseInt(score, 10);
            for (let i = 1; i < 11; i++) {
                scoreOptions.push({ value: i, selected: (score === i ? 'selected' : '') });
            }
            model.setFiltered('scoreOptions', scoreOptions);
        }
    }

    // External data-elements are run twice in Labrador. On second run we have external data
    onRender(model, view) {
        const externalData = view.get('external');
        if (!externalData) return;

        model.setFiltered('productName', externalData.namn ? externalData.namn : '');
        model.setFiltered('pros', externalData.plus ? externalData.plus : []);
        model.setFiltered('cons', externalData.minus ? externalData.minus : []);
        model.setFiltered('structuredData', externalData.struktureradData ? JSON.stringify(externalData.struktureradData) : '');

        const betygArray = [];

        if (externalData.betyg && externalData.betyg.length) {
            externalData.betyg.forEach(item => {
                let score = false;
                let scoreIsPercent = false;
                let percent = false;

                if (item.v) {
                    score = item.v;
                    if (parseInt(item.v, 10) < 11) { // TODO: Needs flag for percent score
                        percent = `${ item.v }0`;
                    } else {
                        percent = item.v;
                        scoreIsPercent = true;
                    }
                }

                betygArray.push({
                    key: item.n,
                    score,
                    scoreIsPercent,
                    percent
                });
            });
        }

        model.setFiltered('score', betygArray);

        // This previously overwrote the recommended and topScore filtered values that is set manually by not checking/using the model.fields value if no external data is available
        // Should work like this, but I don't know if this breaks import stuff?
        model.setFiltered('recommended', externalData.braköp === 'Ja' ? true : model.get('fields.recommended') === 'on');
        model.setFiltered('topScore', externalData.toppbetyg === 'Ja' ? true : model.get('fields.topScore') === 'on');

        model.setFiltered('specifications', externalData.spec ? externalData.spec : []);
    }

    onSettingsPanel(model) {
        this.model = model;
        return {
            onDisplay: (params) => {
                this.api.v1.apps.start('TextEdit').then((textTool) => {
                    this.setupRichTextEditing(textTool, params.markup, this.model);
                }).catch((error) => {
                    console.log(`Error loading TextEdit-app: ${error}`);
                });
            }
        };
    }

    setupRichTextEditing(textTool, markup, model) {
        for (const element of markup.querySelectorAll('div.lab-input-text')) {
            if (element && element instanceof HTMLElement) {
                const key = element.getAttribute('data-input-key') || 'no-key';
                this.setupRichTextEditingForElement(textTool, markup, element, key, model);
            }
        }
    }

    setupRichTextEditingForElement(textTool, markup, element, key, model) {
        const contentdata = {};
        lab_api.v1.util.object.set(key, model.get(key), contentdata);
        textTool.register({
            element,
            simulatedData: {
                type: 'article',
                path: '',
                contentdata
            },
            toolSettings: {
                key,
                inlineOnly: true,
                displayCharCount: false,
                displaySelectionLength: false,
                displayWordCount: false,
                selectTextOnStart: false,
                placeholder: '',
                attributes: {
                    text_size: {
                        active: false
                    }
                }
            },
            callbacks: {
                ended: (theKey, theValue) => {
                    this.model.set(theKey, theValue);
                }
            },
            menuSettings: {
                container: markup,
                items: {
                    bold: {
                        group: 'g2',
                        icon: 'labicon-text_bold',
                        callback: 'toggleAttribute',
                        key: 'font_weight',
                        attributes: {
                            class: 'font-weight-bold'
                        },
                        value: false,
                        onValue: 'font-weight-bold',
                        offValue: false,
                        bindToSelection: 'font_weight',
                        title: 'Font weight - Bold',
                        hotkeys: [{
                            key: 'B',
                            controlkeys: ['labCtrlKey'],
                            preventDefault: true,
                            overrideDisable: true
                        }]
                    },
                    italic: {
                        group: 'g2',
                        icon: 'labicon-text_italic',
                        callback: 'toggleAttribute',
                        key: 'italic',
                        attributes: {
                            class: 'italic'
                        },
                        value: false,
                        onValue: 'italic',
                        offValue: false,
                        bindToSelection: 'italic',
                        title: 'Italic',
                        hotkeys: [{
                            key: 'i',
                            controlkeys: ['labCtrlKey'],
                            preventDefault: true,
                            overrideDisable: true
                        }]
                    },
                    reset: {
                        group: 'g4',
                        icon: 'labicon-reset_style',
                        callback: 'reset',
                        title: 'Remove textformatting in selection for viewport'
                    }
                }
            }
        });
    }

}
