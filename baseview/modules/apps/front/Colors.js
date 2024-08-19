import { ColorUtils } from '../../lib/editor/ColorUtils.js';

export class Colors {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.isArticle = this.rootModel.getType() === 'page_article';
        this.enabled = true;
        this.bgColors = this.api.v1.config.get('background_colors') || [];
        this.bgColorsMarkup = this.generateColorMarkup(this.bgColors, 'pageBackgroundColor');
        this.fontColors = this.api.v1.config.get('font_colors') || [];
        this.fontColorsMarkup = this.generateColorMarkup(this.fontColors, 'pageFontColor');
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid lab-grid-gap background-color-picker">
                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">Background color</h4>
                ${ this.bgColorsMarkup }
            </div>

            <div class="lab-formgroup lab-grid lab-grid-gap custom-background-color-picker lab-valign-bottom">
                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">Custom Background color</h4>
                <p class="lab-para lab-grid-large-12 lab-grid-gap">Note: This will override the selected background color above.</p>
                ${ this.generateCustomColorMarkup() }
            </div>

            <div class="lab-formgroup lab-grid lab-grid-gap font-color-picker">
                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">Font color</h4>
                ${ this.fontColorsMarkup }
            </div>

        </div>`;
    }

    generateColorMarkup(colors, field) {
        const current = this.rootModel.get(`fields.${ field }`);
        let markup = `<div class="lab-formgroup-item lab-grid-large-4 lab-grid-gap lab-inline">
            <label for="${ field }-noColor" class="noColor">Default color</label>
            <input type="radio" value="" name="${ `fields.${ field }` }" id="${ field }-noColor" ${ current === '' && !this.rootModel.get('fields.pageBackgroundColorStyle') ? 'checked' : '' }>
        </div>`;

        colors.forEach((color) => {
            markup += `<div title="${ color }" class="lab-formgroup-item lab-grid-large-2 lab-grid-gap lab-inline page-settings-color-radio">
                <label for="${ color }" class="${ color }"></label>
                <input type="radio" value="${ color }" name="${ `fields.${ field }` }" id="${ color }" ${ color === current ? 'checked' : '' }>
            </div>`;
        });

        return markup;
    }

    generateCustomColorMarkup() {
        const current = this.rootModel.get('fields.pageBackgroundColorStyle') || '';
        const hasHeaderImage = !!lab_api.v1.model.query.getModelByPath('page_article/articleHeader/image');
        let content = `<div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap">
            <input type="text" value="${ current }" placeholder="CSS style like rgb(10, 255, 0)" name="fields.pageBackgroundColorStyle">
        </div>`;
        if (hasHeaderImage) {
            content += `<div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap"><input type="button" value="Get from header image" id="get_custom_color_button"></div>`;
        }
        if (this.isArticle && !hasHeaderImage) {
            content += `<div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap"><p class="lab-para">Tip: Add a header image and select 'Get background color from image' in the media-options button <span class="labicon-image"></span> to select a matching color.</p></div>`;
        }
        return content;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Colors'
        };
    }

    onPaths() {
        return {
            'fields.pageBackgroundColor': {
                node: 'fields.pageBackgroundColor',
                callback: (element) => {
                    // Reset custom color:
                    this.rootModel.set('fields.pageBackgroundColorStyle', '');
                    const customColorEl = this.markup.querySelector('input[name="fields.pageBackgroundColorStyle"]');
                    const customColorValue = customColorEl.value;
                    customColorEl.value = '';

                    // Update selector on body-element for all viewports in the editor
                    // to allow preview without a reload.
                    const docs = this.api.v1.viewport.getContexts();
                    const current = this.rootModel.get('fields.pageBackgroundColor');
                    const labelEl = element.parentElement.querySelector('label');
                    let isDark = false;
                    if (labelEl) {
                        const compStyles = window.getComputedStyle(labelEl);
                        const color = compStyles.getPropertyValue('background-color');
                        if (color) {
                            const rgbArray = color.match(/\d+/g).map(Number); // [234, 88, 11]
                            if (Array.isArray(rgbArray) && rgbArray.length === 3) {
                                isDark = ColorUtils.getBrightness(rgbArray) < 130;
                            }
                            this.rootModel.set('fields.pageBackgroundColorStyleDark', isDark ? '1' : '');
                        }
                    }
                    for (const doc of docs) {
                        if (current) {
                            doc.body.classList.remove(current);
                            doc.body.classList.remove('custom-background-color');
                        }
                        if (customColorValue) {
                            doc.body.style.backgroundColor = '';
                            doc.body.style.color = '';
                        }
                        if (element.value) {
                            doc.body.classList.add(element.value);
                            doc.body.classList.add('custom-background-color');
                            if (doc.body.querySelector('main > article')) {
                                doc.body.querySelector('main > article').classList.add('bg-baseview-custom');
                            }
                        } else if (doc.body.querySelector('main > article')) {
                            doc.body.querySelector('main > article').classList.remove('bg-baseview-custom');
                        }
                        if (isDark) {
                            doc.body.classList.add('dark-mode');
                        } else {
                            doc.body.classList.remove('dark-mode');
                        }
                    }
                }
            },
            'fields.pageBackgroundColorStyle': {
                node: 'fields.pageBackgroundColorStyle',
                callback: (element) => {
                    // Reset background color and select default color in UI:
                    this.rootModel.set('fields.pageBackgroundColor', '');
                    const colorEl = this.markup.querySelector('input[name="fields.pageBackgroundColor"]:checked');
                    if (colorEl) {
                        colorEl.checked = false;
                    }

                    const docs = this.api.v1.viewport.getContexts();
                    const value = element.value.trim();
                    const rgbArray = value.startsWith('rgb') ? (value.match(/\d+/g) || []).map(Number) : ColorUtils.hex2rgb(value);
                    const isDark = (Array.isArray(rgbArray) && rgbArray.length === 3) ? ColorUtils.getBrightness(rgbArray) < 130 : false;
                    this.rootModel.set('fields.pageBackgroundColorStyleDark', isDark ? '1' : '');

                    for (const doc of docs) {
                        if (value) {
                            doc.body.style.backgroundColor = value;
                            doc.body.classList.add('custom-background-color', 'bg-baseview-custom');
                            if (doc.body.querySelector('main > article')) {
                                doc.body.querySelector('main > article').classList.add('bg-baseview-custom');
                            }
                        } else {
                            doc.body.style.backgroundColor = '';
                            doc.body.classList.remove('custom-background-color', 'bg-baseview-custom');
                            if (doc.body.querySelector('main > article')) {
                                doc.body.querySelector('main > article').classList.remove('bg-baseview-custom');
                            }
                        }
                        if (isDark) {
                            doc.body.classList.add('dark-mode');
                            doc.body.style.color = value ? '#fff' : '';
                        } else {
                            doc.body.classList.remove('dark-mode');
                            doc.body.style.color = '';
                        }
                    }
                }
            },
            'fields.pageFontColor': {
                node: 'fields.pageFontColor',
                callback: (element) => {
                    // Update selector on body-element for all viewports in the editor
                    // to allow preview without a reload.
                    const docs = this.api.v1.viewport.getContexts();
                    const current = this.rootModel.get('fields.pageFontColor');
                    for (const doc of docs) {
                        if (current) {
                            doc.body.classList.remove(current, 'custom-font-color');
                            const articleSection = doc.querySelector('main > article');
                            if (articleSection) {
                                articleSection.classList.remove(current, 'custom-font-color');
                            }
                        }
                        if (element.value) {
                            doc.body.classList.add(element.value, 'custom-font-color');
                            const articleSection = doc.querySelector('main > article');
                            if (articleSection) {
                                articleSection.classList.add(element.value, 'custom-font-color');
                            }
                        }
                    }
                }
            }
        };
    }

    onMarkup() {
        this.markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                pageBackgroundColor: this.rootModel.get('fields.pageBackgroundColor'),
                pageFontColor: this.rootModel.get('fields.pageFontColor')
            }
        }, true);
        const selectCustomBackgroundColorButton = this.markup.querySelector('#get_custom_color_button');
        if (selectCustomBackgroundColorButton) {
            selectCustomBackgroundColorButton.addEventListener('click', () => {
                const fn = this.api.v1.ns.get('contextualmenu.callbacks.getImageColors');
                if (fn) {
                    const articleHeader = this.api.v1.model.query.getModelByType('articleHeader');
                    fn(articleHeader, this.api.v1.view.getView(articleHeader), undefined, undefined, (result) => {
                        this.markup.querySelector('input[name="fields.pageBackgroundColorStyle"]').value = result.color;
                        const colorEl = this.markup.querySelector('input[name="fields.pageBackgroundColor"]:checked');
                        if (colorEl) {
                            colorEl.checked = false;
                        }
                    });
                }
            });
        }
        return this.markup;
    }

}
