export class ParallaxSupport {

    constructor(api, menuItem) {
        this.api = api;
        this.model = menuItem.getModel();
        this.view = menuItem.getView();
        this.data = {
            ...{
                brightness: {},
                sepia: {},
                blur: {},
                opacity: {},
                rotate: {},
                scale: {},
                horizontalAlign: {}
            },
            ...this.view.get('metadata.parallax') || {}
        };
        this.run();
    }

    run() {
        const preferAsideOpen = true;
        const templateData = this.getTemplateData();
        const eventHandlers = [];
        const updateLabel = (element, theModal) => {
            const id = element.getAttribute('id');
            const labelEl = theModal.markup.querySelector(`label[for="${ id }"]`);
            if (labelEl) {
                labelEl.setAttribute('data-lab-label-value', element.value);
            }
        };
        for (const item of templateData.ranges) {
            for (const key of Object.keys(item.ranges)) {
                eventHandlers.push({
                    selector: `[name="${ item.name }.${ key }"]`, // parallax.opacity.startValue
                    event: 'input',
                    callback: (theModal, event) => {
                        updateLabel(event.currentTarget, theModal);
                        const el = theModal.markup.querySelector(`[name="${ item.name }.active"]`);
                        if (el) {
                            const needSave = !el.checked;
                            if (needSave) {
                                el.checked = true;
                                this.save(el);
                            }
                        }
                    }
                });
            }
            eventHandlers.push({
                selector: `[name="${ item.name }.startScrollPosition"]`,
                event: 'change',
                callback: (theModal, event) => {
                    const minElement = event.currentTarget;
                    const maxElement = theModal.markup.querySelector(`[name="${ item.name }.endScrollPosition"]`);
                    if (parseInt(minElement.value, 10) > parseInt(maxElement.value, 10)) {
                        minElement.value = maxElement.value;
                        updateLabel(event.currentTarget, theModal);
                    }
                }
            });
            eventHandlers.push({
                selector: `[name="${ item.name }.endScrollPosition"]`,
                event: 'change',
                callback: (theModal, event) => {
                    const minElement = theModal.markup.querySelector(`[name="${ item.name }.startScrollPosition"]`);
                    const maxElement = event.currentTarget;
                    if (parseInt(maxElement.value, 10) < parseInt(minElement.value, 10)) {
                        maxElement.value = minElement.value;
                        updateLabel(event.currentTarget, theModal);
                    }
                }
            });

        }

        const markup = lab_api.v1.util.dom.renderView('content/parallax/template/parallaxSupport', templateData);
        const asideData = {
            content: [{
                title: 'General',
                items: [{
                    key: 'geometry',
                    label: 'Geometry',
                    css: 'lab-selected'
                }]
            }, {
                title: 'Transitions',
                items: [{
                    key: 'parallax.scale',
                    label: 'Scale'
                }, {
                    key: 'parallax.rotate',
                    label: 'Rotate'
                }, {
                    key: 'parallax.opacity',
                    label: 'Opacity'
                }
                ]
            }, {
                title: 'Filters',
                items: [{
                    key: 'parallax.blur',
                    label: 'Blur'
                }, {
                    key: 'parallax.sepia',
                    label: 'Sepia'
                }, {
                    key: 'parallax.brightness',
                    label: 'Brightness'
                }]
            }]
        };

        const asideMarkup = lab_api.v1.util.dom.renderView('content/parallax/template/parallaxSupportAside', asideData);

        lab_api.v1.ui.modal.dialog({
            container: {
                width: 860,
                nostyle: false
            },
            content: {
                header: 'Parallax settings',
                markup
            },
            aside: {
                expandable: true,
                closed: !preferAsideOpen,
                position: 'left',
                header: 'Options',
                content: asideMarkup,
                noPadding: true,
                width: '215px'
            },
            eventHandlers: eventHandlers.concat([{
                selector: 'input, select',
                event: 'change',
                callback: (modal, event) => {
                    // Store value immediately:
                    this.save(event.currentTarget);
                }
            }])
        });

    }

    save(element) {
        const path = element.getAttribute('name');
        const value = lab_api.v1.util.dom.getFormElementValue(element);
        if (path.startsWith('width.')) {
            this.model.setWidth(parseInt(value, 10), { viewport: path.split('.')[1], save: true });
            return;
        }
        if (this.model.getType() === 'image' && path === 'fullwidth') {
            this.view.set('fields.width', value ? 1800 : null);
        }
        lab_api.v1.util.object.set(path, value, this.data);
        this.view.set(
            'metadata.parallax',
            { ...this.data }
        );
    }

    getTemplateData() {
        return {
            booleans: [{
                title: 'Geometry',
                name: 'geometry',
                hidden: false,
                items: [{
                    name: 'sticky',
                    isCheckbox: true,
                    title: 'Sticky',
                    active: !!this.data.sticky,
                    grid: 'lab-grid-large-2'
                }, {
                    name: 'fullwidth',
                    isCheckbox: true,
                    title: 'Full width',
                    active: !!this.data.fullwidth,
                    grid: 'lab-grid-large-10'
                }, {
                    name: 'height',
                    isSelect: true,
                    title: 'Height',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: '50% of viewport',
                        value: '50',
                        selected: this.data.height === '50'
                    }, {
                        title: '100% of viewport (default)',
                        value: '',
                        selected: !this.data.height
                    }, {
                        title: '150% of viewport',
                        value: '150',
                        selected: this.data.height === '150'
                    }, {
                        title: '200% of viewport',
                        value: '200',
                        selected: this.data.height === '200'
                    }, {
                        title: 'Auto (height of content)',
                        value: 'auto',
                        selected: this.data.height === 'auto'
                    }]
                }, {
                    name: 'spaceBelow',
                    isSelect: true,
                    title: 'Space below',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: 'None (default)',
                        value: '',
                        selected: !this.data.spaceBelow
                    }, {
                        title: '50% of viewport',
                        value: '50',
                        selected: this.data.spaceBelow === '50'
                    }, {
                        title: '100% of viewport',
                        value: '100',
                        selected: this.data.spaceBelow === '100'
                    }]
                }, {
                    name: 'width.desktop',
                    isSelect: true,
                    title: 'Width - Desktop',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: '100% (default)',
                        value: '100',
                        selected: this.model.get('width', 'desktop') === 100
                    }, {
                        title: '50%',
                        value: '50',
                        selected: this.model.get('width', 'desktop') === 50
                    }, {
                        title: '33.33%',
                        value: '33.33',
                        selected: this.model.get('width', 'desktop') === 33.33
                    }]
                }, {
                    name: 'width.mobile',
                    isSelect: true,
                    title: 'Width - Mobile',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: '100% (default)',
                        value: '100',
                        selected: this.model.get('width', 'mobile') === 100
                    }, {
                        title: '50%',
                        value: '50',
                        selected: this.model.get('width', 'mobile') === 50
                    }]
                }, {
                    name: 'horizontalAlign.desktop',
                    isSelect: true,
                    title: 'Horizontal positioning - Desktop',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: 'Left (default)',
                        value: '',
                        selected: !this.data.horizontalAlign.desktop
                    }, {
                        title: 'Centered',
                        value: 'center',
                        selected: this.data.horizontalAlign.desktop === 'center'
                    }, {
                        title: 'Right',
                        value: 'right',
                        selected: this.data.horizontalAlign.desktop === 'right'
                    }]
                }, {
                    name: 'horizontalAlign.mobile',
                    isSelect: true,
                    title: 'Horizontal positioning - Mobile',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: 'Left (default)',
                        value: '',
                        selected: !this.data.horizontalAlign.mobile
                    }, {
                        title: 'Centered',
                        value: 'center',
                        selected: this.data.horizontalAlign.mobile === 'center'
                    }, {
                        title: 'Right',
                        value: 'right',
                        selected: this.data.horizontalAlign.mobile === 'right'
                    }]
                }, {
                    name: 'verticalPosition',
                    isSelect: true,
                    title: 'Vertical positioning',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: 'Auto (default)',
                        value: 'auto',
                        selected: this.data.verticalPosition === 'auto' || !this.data.verticalPosition
                    }, {
                        title: 'Move up 50%',
                        value: 'up50',
                        selected: this.data.verticalPosition === 'up50'
                    }, {
                        title: 'Move up 100%',
                        value: 'up100',
                        selected: this.data.verticalPosition === 'up100'
                    }, {
                        title: 'Move down 50%',
                        value: 'down50',
                        selected: this.data.verticalPosition === 'down50'
                    }, {
                        title: 'Move down 100%',
                        value: 'down100',
                        selected: this.data.verticalPosition === 'down100'
                    }]
                }, {
                    name: 'verticalAlign',
                    isSelect: true,
                    title: 'Vertical alignment',
                    isBlock: true,
                    grid: 'lab-grid-large-6',
                    options: [{
                        title: 'Top (default)',
                        value: 'top',
                        selected: this.data.verticalAlign === 'top' || !this.data.verticalAlign
                    }, {
                        title: 'Centered',
                        value: 'center',
                        selected: this.data.verticalAlign === 'center'
                    }, {
                        title: 'Bottom',
                        value: 'bottom',
                        selected: this.data.verticalAlign === 'bottom'
                    }]
                }]
            }],
            ranges: [
                {
                    name: 'scale',
                    attributeName: 'parallax.scale',
                    title: 'Scale content',
                    hidden: true,
                    min: 0,
                    max: 100,
                    active: !!this.data.scale.active,
                    startValue: this.data.scale.startValue || 0,
                    endValue: this.data.scale.endValue || 100,
                    startScrollPosition: this.data.scale.startScrollPosition || 0,
                    endScrollPosition: this.data.scale.endScrollPosition || 100,
                    labels: {
                        active: 'Active',
                        startValue: 'Start size',
                        endValue: 'End size',
                        startScrollPosition: 'Start scroll position',
                        endScrollPosition: 'End scroll position'
                    },
                    ranges: {
                        startValue: [0, 200],
                        endValue: [0, 200],
                        startScrollPosition: [0, 100],
                        endScrollPosition: [0, 100]
                    }
                },
                {
                    name: 'rotate',
                    attributeName: 'parallax.rotate',
                    title: 'rotate content',
                    hidden: true,
                    min: 0,
                    max: 100,
                    active: !!this.data.rotate.active,
                    startValue: this.data.rotate.startValue || 0,
                    endValue: this.data.rotate.endValue || 360,
                    startScrollPosition: this.data.rotate.startScrollPosition || 0,
                    endScrollPosition: this.data.rotate.endScrollPosition || 100,
                    labels: {
                        active: 'Active',
                        startValue: 'Start angle',
                        endValue: 'End angle',
                        startScrollPosition: 'Start scroll position',
                        endScrollPosition: 'End scroll position'
                    },
                    ranges: {
                        startValue: [0, 360],
                        endValue: [0, 360],
                        startScrollPosition: [0, 100],
                        endScrollPosition: [0, 100]
                    }
                },
                {
                    name: 'opacity',
                    attributeName: 'parallax.opacity',
                    title: 'Opacity',
                    hidden: true,
                    min: 0,
                    max: 100,
                    active: !!this.data.opacity.active,
                    startValue: this.data.opacity.startValue || 0,
                    endValue: this.data.opacity.endValue || 100,
                    startScrollPosition: this.data.opacity.startScrollPosition || 0,
                    endScrollPosition: this.data.opacity.endScrollPosition || 100,
                    labels: {
                        active: 'Active',
                        startValue: 'Start opacity',
                        endValue: 'End opacity',
                        startScrollPosition: 'Start scroll position',
                        endScrollPosition: 'End scroll position'
                    },
                    ranges: {
                        startValue: [0, 100],
                        endValue: [0, 100],
                        startScrollPosition: [0, 100],
                        endScrollPosition: [0, 100]
                    }
                },
                {
                    name: 'blur',
                    attributeName: 'parallax.blur',
                    title: 'Blur',
                    hidden: true,
                    min: 0,
                    max: 100,
                    active: !!this.data.blur.active,
                    startValue: this.data.blur.startValue || 0,
                    endValue: this.data.blur.endValue || 100,
                    startScrollPosition: this.data.blur.startScrollPosition || 0,
                    endScrollPosition: this.data.blur.endScrollPosition || 100,
                    labels: {
                        active: 'Active',
                        startValue: 'Start blur',
                        endValue: 'End blur',
                        startScrollPosition: 'Start scroll position',
                        endScrollPosition: 'End scroll position'
                    },
                    ranges: {
                        startValue: [0, 100],
                        endValue: [0, 100],
                        startScrollPosition: [0, 100],
                        endScrollPosition: [0, 100]
                    }
                },
                {
                    name: 'sepia',
                    attributeName: 'parallax.sepia',
                    title: 'Sepia',
                    hidden: true,
                    min: 0,
                    max: 100,
                    active: !!this.data.sepia.active,
                    startValue: this.data.sepia.startValue || 0,
                    endValue: this.data.sepia.endValue || 100,
                    startScrollPosition: this.data.sepia.startScrollPosition || 0,
                    endScrollPosition: this.data.sepia.endScrollPosition || 100,
                    labels: {
                        active: 'Active',
                        startValue: 'Start sepia',
                        endValue: 'End sepia',
                        startScrollPosition: 'Start scroll position',
                        endScrollPosition: 'End scroll position'
                    },
                    ranges: {
                        startValue: [0, 100],
                        endValue: [0, 100],
                        startScrollPosition: [0, 100],
                        endScrollPosition: [0, 100]
                    }
                },
                {
                    name: 'brightness',
                    attributeName: 'parallax.brightness',
                    title: 'Brightness',
                    hidden: true,
                    min: 0,
                    max: 100,
                    active: !!this.data.brightness.active,
                    startValue: this.data.brightness.startValue || 100,
                    endValue: this.data.brightness.endValue || 0,
                    startScrollPosition: this.data.brightness.startScrollPosition || 0,
                    endScrollPosition: this.data.brightness.endScrollPosition || 100,
                    labels: {
                        active: 'Active',
                        startValue: 'Start brightness',
                        endValue: 'End brightness',
                        startScrollPosition: 'Start scroll position',
                        endScrollPosition: 'End scroll position'
                    },
                    ranges: {
                        startValue: [0, 100],
                        endValue: [0, 100],
                        startScrollPosition: [0, 100],
                        endScrollPosition: [0, 100]
                    }
                }
            ]
        };
    }

}
