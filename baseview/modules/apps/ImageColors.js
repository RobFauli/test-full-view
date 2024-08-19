import ColorThief from '../../lib/editor/color-thief.mjs';
import { ColorUtils } from '../lib/editor/ColorUtils.js';

export class ImageColors {

    constructor(api, options = {
        image: null,
        targetModel: null,
        path: null,
        pathDark: null,
        resetPath: null,
        callback: null
    }) {
        this.api = api;
        if (options.image && options.targetModel && options.path) {
            this.image = options.image;
            this.targetModel = options.targetModel;
            this.path = options.path;
            this.pathDark = options.pathDark;
            this.resetPath = options.resetPath;
            this.callback = options.callback;
            this.getColors();
        } else {
            Sys.logger.warn('ImageColors: Missing one or more required options (image, targetModel, path).');
        }
    }

    // Get colors via ColorThief:
    getColors() {
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.style = 'width: 100%; object-fit: contain; display: block;';
        this.api.v1.ui.modal.dialog({
            content: {
                markup: `<div class="imageColors">
                    <div class="imageColorsImage"></div>
                    <h5 class="lab-title">Click on a palette to set custom background color</h5>
                    <div class="imageColorsPalettes" style="display: flex; flex-wrap: nowrap; justify-content: space-between; height: 80px; background-color: #e6e6e6; padding: 15px; border-radius: 10px;"><div style="flex: 1; text-align: center; padding-top: 10px;">Loading palettes ...</div></div>
                </div>`
            },
            footer: {
                buttons: [{
                    value: 'Use color picker',
                    id: 'select_color_button',
                    highlight: false
                }, {
                    value: 'Remove custom color',
                    id: 'remove_color_button',
                    highlight: false
                }]
            },
            eventHandlers: [{
                selector: '#select_color_button',
                event: 'click',
                callback: (modal, event) => {
                    const eyeDropper = new window.EyeDropper();
                    eyeDropper.open().then((result) => {
                        this.setColor(ColorUtils.hex2rgb(result.sRGBHex));
                    }).catch(() => {
                        // User cancelled by clicking Escape-key etc.
                    });
                }
            }, {
                selector: '#remove_color_button',
                event: 'click',
                callback: (modal, event) => {
                    this.resetColor();
                    modal.close();
                }
            }],
            callbacks: {
                didDisplay: (modal) => {
                    const container = modal.markup.querySelector('.imageColorsImage');
                    container.classList.add('lab-busy');
                    img.addEventListener('load', () => {
                        const mainColor = colorThief.getColor(img);
                        const palette = colorThief.getPalette(img, 8);
                        const palettesContainer = modal.markup.querySelector('.imageColorsPalettes');
                        palettesContainer.innerHTML = '';
                        for (const color of [mainColor, ...palette]) {
                            const div = document.createElement('div');
                            div.style.backgroundColor = `rgb(${ color[0] }, ${ color[1] }, ${ color[2] })`;
                            div.style.width = '50px';
                            div.style.cursor = 'pointer';
                            div.style.borderRadius = '6px';
                            div.style.border = '1px solid #000';
                            div.setAttribute('title', `rgb(${ color[0] }, ${ color[1] }, ${ color[2] })`);
                            palettesContainer.appendChild(div);
                            div.addEventListener('click', () => {
                                this.setColor(color);
                                modal.close();
                            });
                        }
                        container.classList.remove('lab-busy');
                    });
                    img.src = this.image.currentSrc || this.image.src;
                    const args = this.api.v1.util.request.parseQueryString(img.src);
                    if (args.width && args.height) {
                        const ratio = args.height / args.width;
                        container.style.minHeight = `${ container.clientWidth * ratio }px`;
                    }
                    container.appendChild(img);
                },
                submit: (formValues, theModal) => {
                    console.log('Submit:', formValues);
                }
            }
        });
    }

    setColor(rgbArray) {
        if (this.pathDark) {
            this.targetModel.set(this.pathDark, ColorUtils.getBrightness(rgbArray) < 130 ? '1' : '');
        }
        this.targetModel.set(this.path, `rgb(${ rgbArray[0] }, ${ rgbArray[1] }, ${ rgbArray[2] })`);
        this.colorsUpdated();
    }

    resetColor() {
        if (this.pathDark) {
            this.targetModel.set(this.pathDark, '');
        }
        this.targetModel.set(this.path, '');
        this.colorsUpdated();
    }

    colorsUpdated() {
        if (this.resetPath) {
            const current = this.targetModel.get(this.resetPath);
            this.targetModel.set(this.resetPath, '');
            if (current) {
                for (const view of this.api.v1.view.getViews(this.targetModel)) {
                    view.getMarkup().classList.remove(current);
                }
            }
        }
        const value = this.targetModel.get(this.path);
        const isDark = this.pathDark ? !!this.targetModel.get(this.pathDark) : false;
        for (const view of this.api.v1.view.getViews(this.targetModel)) {
            const body = view.getMarkup();
            if (value) {
                body.style.backgroundColor = value;
                body.classList.add('custom-background-color', 'bg-baseview-custom');
                body.querySelector('main > article').classList.add('bg-baseview-custom');
            } else {
                body.style.backgroundColor = '';
                body.classList.remove('custom-background-color', 'bg-baseview-custom');
                body.querySelector('main > article').classList.remove('bg-baseview-custom');
            }
            if (isDark && value) {
                body.style.color = '#fff';
            } else {
                body.style.color = '';
            }
        }
        if (this.callback) {
            this.callback({
                color: value,
                isDark
            });
        }
    }

}
