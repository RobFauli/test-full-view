import { FrontContentRenderer } from '../../public/common/labrador/source/FrontContentRenderer.js';

export class FrontContentSupport {

    constructor(api, { confPath } = {}, menuItem = null) {
        if (!menuItem || !menuItem.getModel) {
            Sys.logger.warn('[FrontContentSupport] Missing required input "menuItem". Cannot run.');
            return;
        }
        this.api = api;

        // this.renderer = new FrontContentRenderer({
        //     api: lab_api,
        //     settings: {
        //         layout: {}
        //     }
        // });
        const model = menuItem.getModel();
        const sourcesConfig = model.get('filtered.sourcesConfig') || [];
        const configPath = confPath || 'contentbox_settings.frontContent';
        const config = lab_api.v1.config.get(configPath) || {};
        this.run(model, sourcesConfig, configPath, config);
    }

    run(model, sourcesConfig, configPath, config) {

        const tagsOptions = lab_api.v1.config.get(`${ configPath }.tagsOptions`) || { displayTagsString: true, displayTagsGroups: false };
        const sourceOptions = lab_api.v1.config.get('labclient') || {};
        const source = model.get('fields.source'); // identifier
        const organizer = model.get('fields.organizer');
        const postprocessor = model.get('fields.postprocessor');
        const layoutOptions = {
            columnCount: parseFloat(model.get('fields.layout_columnCount') || 3),
            rowCount: parseFloat(model.get('fields.layout_rowCount') || 10),
            maxRowSize: parseFloat(model.get('fields.layout_maxRowSize') || 3),
            minRowSize: parseFloat(model.get('fields.layout_minRowSize') || 1),
            imageAspectRatio: parseFloat(model.get('fields.layout_imageAspectRatio') || 0.45),
            gridsize: parseFloat(model.get('fields.layout_gridsize') || 12),
            articleCount: model.get('fields.articleCount') || 24
        };
        const options = {
            sources: sourcesConfig,
            organizers: sourceOptions.organizers || [],
            postprocessors: sourceOptions.postprocessors || []
        };
        const settings = {
            sources: options.sources.map((item) => ({ name: item.name, value: item.identifier, selected: item.identifier === source })),
            organizers: options.organizers.map((item) => ({ name: item.name, value: item.type, selected: item.type === organizer })),
            postprocessors: options.postprocessors.map((item) => ({ name: item.name, value: item.type, selected: item.type === postprocessor })),
            displayOverrideUrlByTagsCookie: !!config.overrideUrlByTagsCookie
        };
        settings.sources.unshift({ name: 'No source selected' });
        settings.organizers.unshift({ name: 'No organizer seelcted' });
        settings.postprocessors.unshift({ name: 'No autolayout selected' });

        if (tagsOptions.displayTagsGroups) {
            tagsOptions.tagGroups = model.get('filtered.tagGroupsObject');
            tagsOptions.tagsGroupsDefaultVisible = model.get('filtered.tagsGroupsDefaultVisible');
        }

        const hide = {
            image: !!model.get('fields.hide_image'),
            title: !!model.get('fields.hide_title'),
            subtitle: !!model.get('fields.hide_subtitle'),
            kicker: !!model.get('fields.hide_kicker')
        };
        const templateData = {
            section: {
                source: {
                    options: settings.sources,
                    hide,
                    filterExisting: !!model.get('fields.filterExisting'),
                    displaySites: config.displaySites
                },
                organizer: {
                    options: settings.organizers
                },
                postprocessor: {
                    options: settings.postprocessors
                },
                layout: layoutOptions
            },
            cookie: {
                displayOverrideUrlByTagsCookie: config.overrideUrlByTagsCookie,
                options: model.get('filtered.coockieOptions')
            },
            tags: model.get('filtered.tagOptions'), // { allow: true, tags: ['tag1', 'tag2'], tags_string: 'tag1, tag2' },
            tagsOptions,
            typography: {
                size_active: !!model.get('fields.size_active'),
                size_title: model.get('fields.size_title') || 34,
                size_subtitle: model.get('fields.size_subtitle') || 16,
                size_kicker: model.get('fields.size_kicker') || 16,
                hide_title: hide.title,
                hide_subtitle: hide.subtitle,
                hide_kicker: hide.kicker,
                hide_image: hide.image,
                alignImage: model.get('fields.alignImage'),
                alignImage_left: model.get('fields.alignImage') === 'left',
                alignImage_none: !model.get('fields.alignImage'),
                alignImage_right: model.get('fields.alignImage') === 'right',
                imageWidth: model.get('fields.imageWidth') || 100
            }
        };

        const markup = this.api.v1.util.dom.renderView('content/frontContent/template/admin', templateData);
        const asideMarkup = this.api.v1.util.dom.renderView('content/frontContent/template/adminAside', {});

        const save = (theModel, element) => {
            theModel.set(
                element.getAttribute('name'),
                this.api.v1.util.dom.getFormElementValue(element) || false
            );
        };

        const placeholders = [];
        if (config.displaySites) {
            let siteId = model.get('fields.siteId');
            if (siteId) {
                siteId = parseInt(siteId, 10);
            }
            const siteSelector = lab_api.v1.ui.element.getSiteSelector({
                value: siteId || '',
                attributes: [
                    {
                        name: 'id',
                        value: 'ii5_1'
                    }
                ]
            });
            siteSelector.setAttribute('name', 'fields.siteId');
            placeholders.push({
                selector: '#frontContent-site',
                element: siteSelector
            });
        }

        const dialog = this.api.v1.ui.modal.dialog({
            container: {
                width: 860,
                nostyle: false
            },
            content: {
                header: `Settings - ${ model.getType() }`,
                markup
            },
            aside: {
                expandable: true,
                closed: false,
                position: 'left',
                header: 'Options',
                content: asideMarkup,
                noPadding: true,
                width: '215px'
            },
            footer: {
                buttons: [
                    {
                        type: 'submit',
                        highlight: true,
                        value: 'OK'
                    }
                ],
                informalText: '(<span style="color:red; font-weight: bold;">*</span>) indicates a required field'
            },
            eventHandlers: [{
                selector: '#cancelBtn',
                event: 'click',
                callback: (modal, event) => {
                    modal.close();
                }
            }, {
                selector: 'input, select',
                event: 'change',
                callback: (modal, event) => {
                    // Store value immediately:
                    save(model, event.currentTarget);
                }
            }],
            placeholders,
            callbacks: {
                end: (theModal) => {
                    // model.redraw();
                },
                didDisplay: (theModal) => {
                    const valueElements = [
                        theModal.markup.querySelector('[name="fields.source"]'),
                        theModal.markup.querySelector('[name="fields.organizer"]'),
                        theModal.markup.querySelector('[name="fields.postprocessor"]')
                    ];
                    const optionsElements = theModal.markup.querySelectorAll(`[data-sources]`);
                    const updateOptionsVisibility = () => {
                        for (const optionsElement of optionsElements) {
                            optionsElement.classList.add('lab-hidden');
                        }
                        for (const element of valueElements) {
                            const sourceName = element.getAttribute('name');
                            for (const optionsElement of optionsElements) {
                                const sourceValue = optionsElement.getAttribute('data-sources');
                                const sourceTypes = sourcesConfig.filter((feed) => feed.type === sourceValue).map((feed) => feed.identifier);
                                if (element.value && (sourceValue.includes(element.value) || (sourceTypes.includes(element.value)))) {
                                    optionsElement.classList.remove('lab-hidden');
                                }
                                if (!element.value && sourceValue.includes(`no-${ sourceName }`)) {
                                    optionsElement.classList.remove('lab-hidden');
                                }
                            }
                        }
                    };
                    for (const element of valueElements) {
                        element.addEventListener('change', updateOptionsVisibility, false);
                    }
                    updateOptionsVisibility();

                    const enblList = {};
                    const triggerChanged = (path) => {
                        const elements = enblList[path];
                        if (!elements) {
                            return;
                        }
                        const isChecked = elements.trigger.checked;
                        for (const target of elements.targets) {
                            if (isChecked) {
                                target.removeAttribute('disabled');
                            } else {
                                target.setAttribute('disabled', '');
                            }
                        }
                    };

                    // const targetChanged = (key, value) => {
                    //     console.log('tagteChanged: ', key, value);
                    //     // setPreviewData([{ key, value }]);
                    // };

                    const enabledTriggerElements = theModal.markup.querySelectorAll('[data-enabled-trigger]');
                    for (const el of enabledTriggerElements) {
                        const path = el.getAttribute('data-enabled-trigger');
                        if (path) {
                            const targets = theModal.markup.querySelectorAll(`[data-enabled-path="${ path }"]`);
                            enblList[path] = {
                                trigger: el,
                                targets: [...targets]
                            };
                        }
                    }
                    for (const [path, elements] of Object.entries(enblList)) {
                        elements.trigger.addEventListener('change', (event) => {
                            triggerChanged(path);
                        }, false);
                        triggerChanged(path);

                        // for (const target of elements.targets) {
                        //     target.addEventListener('change', (event) => {
                        //         const styleField = target.getAttribute('data-style-field');
                        //         targetChanged(styleField, target.value);
                        //     }, false);
                        // }
                    }

                    // const previewTriggers = theModal.markup.querySelectorAll('[data-preview-check]');
                    // for (const el of previewTriggers) {
                    //     el.addEventListener('change', (event) => {
                    //         const styleField = event.target.getAttribute('data-preview-check');
                    //         targetChanged(styleField, event.target.checked);
                    //     }, false);
                    // }
                }
            }
        });

        // const previewStyle = 'font-family: Helvetica !important; margin: 0 0 0.5rem !important; padding: 0 !important';
        // const preview = {
        //     size: {
        //         title: templateData.typography.size_title,
        //         subtitle: templateData.typography.size_subtitle,
        //         kicker: templateData.typography.size_kicker,
        //         hide_title: templateData.typography.hide_title,
        //         hide_subtitle: templateData.typography.hide_subtitle,
        //         hide_kicker: templateData.typography.hide_kicker,
        //         hide_image: templateData.typography.hide_image,
        //         alignImage: templateData.typography.alignImage,
        //         imageAspectRatio: layoutOptions.imageAspectRatio,
        //         imagePreviewWidth: 100,
        //         imagePreviewHeight: 100 * layoutOptions.imageAspectRatio
        //     },
        //     container: dialog.markup.querySelector('#typography-preview'),
        //     engine: new window.LabClient({
        //         renderOptions: {
        //             selector: '#typography-preview',
        //             renderer: Mustache.render,
        //             createElements: true,
        //             documentContext: parent.document,
        //             contentReplacement: 'append'
        //         },
        //         resources: {
        //             templates: {
        //                 row: '<div class="lab-grid">{{{ children.all }}}</div>',
        //                 article: `
        //                     <article class="column {{ size.current.cssString }}">
        //                         <div class="content" style="box-shadow: 0 1px 12px -4px grey; padding: 0.8rem 1rem;">
        //                             {{ ^get.current.fields.hide_kicker }}<p class="kicker {{ #view.getStyle }}text_size fields.kicker{{ /view.getStyle }}" style="${ previewStyle }">{{{ get.current.fields.kicker }}}</p>{{ /get.current.fields.hide_kicker }}
        //                             {{ ^get.current.fields.hide_image }}<span style="float: right; background-color: #9d9d9d; width:{{ get.current.fields.imagePreviewWidth }}px; height:{{ get.current.fields.imagePreviewHeight }}px; color: #fff;font-size: 2em;text-align: center;padding-top: 0.5em;"></span>{{ /get.current.fields.hide_image }}
        //                             {{ ^get.current.fields.hide_title }}<h2 class="headline {{ #view.getStyle }}text_size fields.title{{ /view.getStyle }}" style="${ previewStyle }">{{{ get.current.fields.title }}}</h2>{{ /get.current.fields.hide_title }}
        //                             {{ ^get.current.fields.hide_subtitle }}<p class="subtitle {{ #view.getStyle }}text_size fields.subtitle{{ /view.getStyle }}" style="${ previewStyle }">{{{ get.current.fields.subtitle }}}</p>{{ /get.current.fields.hide_subtitle }}
        //                         </div>
        //                     </article>`
        //             }
        //         },
        //         config: {
        //             debug: true,
        //             grid: {
        //                 size: 12,
        //                 prefix: {
        //                     desktop: 'lab-grid-large-',
        //                     mobile: 'lab-grid-small-'
        //                 }
        //             },
        //             style: {
        //                 definitions: [
        //                     {
        //                         name: 'text_size',
        //                         requirePath: true,
        //                         sources: [
        //                             {
        //                                 paths: [
        //                                     {
        //                                         path: '_style_size',
        //                                         prefix: 't'
        //                                     }
        //                                 ],
        //                                 template: '{{ #items }}{{ prefix }}{{ value }} {{ /items }}'
        //                             }
        //                         ]
        //                     }
        //                 ]
        //             }
        //         }
        //     })
        // };

        // const setPreviewData = (items) => {
        //     let hasChange = false;
        //     for (const item of items) {
        //         if (preview.size[item.key] !== item.value) {
        //             preview.size[item.key] = item.value;
        //             if (item.key === 'imageAspectRatio') {
        //                 preview.size.imagePreviewHeight = 100 * item.value;
        //             }
        //             hasChange = true;
        //         }
        //     }
        //     if (hasChange) {
        //         runPreview();
        //     }
        // };

        // const runPreview = () => {
        //     const columns = 1;
        //     const width = 100 / columns;
        //     const article = {
        //         type: 'article',
        //         contentdata: {
        //             fields: {
        //                 title: 'Title preview ...',
        //                 subtitle: 'Subtitle preview ...',
        //                 kicker: 'Kicker preview ...',
        //                 title_style_size: preview.size.title,
        //                 subtitle_style_size: preview.size.subtitle,
        //                 kicker_style_size: preview.size.kicker,
        //                 hide_subtitle: preview.size.hide_subtitle,
        //                 hide_kicker: preview.size.hide_kicker,
        //                 hide_title: preview.size.hide_title,
        //                 hide_image: preview.size.hide_image,
        //                 alignImage: preview.size.alignImage,
        //                 imageWidth: preview.size.imageWidth,
        //                 imageAspectRatio: preview.size.imageAspectRatio,
        //                 imagePreviewWidth: preview.size.imagePreviewWidth,
        //                 imagePreviewHeight: preview.size.imagePreviewHeight
        //             }
        //         },
        //         width
        //     };
        //     const data = [{
        //         type: 'row',
        //         children: new Array(columns).fill(article)
        //     }];
        //     preview.container.innerHTML = '';
        //     preview.engine.setData(data);
        //     preview.engine.draw();
        // };

        // runPreview();
    }

}
