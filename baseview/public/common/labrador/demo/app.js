/**
 * Example of implementation of Labrador rendering engine
 * Step 2, 3 and 4 may be repeated to re-use engine with new data.
 */

import * as modules from '../../build/baseview_dependencie_modules.js';

console.log('modules: ', modules);

/**
 * Debug: Timing
 */
const startTime = new Date().getTime();

/**
 * Step 1:
 * Set up an instance of Labrador rendering engine
 */
const renderer = new modules.Renderer({
    site: {
        alias: 'my_site',
        display_name: 'My Site',
        id: 1,
        domain: 'lbrdr.com'
    },
    app: {
        image_server: 'https://image.lbrdr.com',
        device: 'desktop'
    }
});

/**
 * Debug: Timing
 */
const initTime = new Date().getTime();

/**
 * Step 2:
 * Define data to render
 * Internal format
 */
const data = [{
    type: 'row',
    children: [{
        type: 'article',
        width: 66.66,
        contentdata: {
            fields: {
                published_url: {
                    value: '/example_url/1'
                },
                title: {
                    value: 'Here is a title for article #1'
                },
                subtitle: {
                    value: 'This article is behind a paywall'
                },
                paywall: {
                    value: '1'
                }
            }
        },
        children: [{
            type: 'image',
            contentdata: {
                instance_of: 148210,
                fields: {
                    whRatio: {
                        value: 0.61
                    }
                }
            }
        }]
    }, {
        type: 'columns',
        width: 33.33,
        children: [{
            type: 'row',
            children: [{
                type: 'article',
                contentdata: {
                    fields: {
                        published_url: {
                            value: '/example_url/2'
                        },
                        title: {
                            value: 'Colored background, hidden subtitle'
                        },
                        subtitle: {
                            value: 'I will not display ...'
                        }
                    }
                },
                metadata: {
                    background_color: {
                        value: 'bg-red'
                    },
                    hidesubtitle: {
                        vp: {
                            desktop: true
                        }
                    }
                },
                children: [{
                    type: 'image',
                    contentdata: {
                        instance_of: 148210
                    }
                }]
            }, {
                type: 'article',
                contentdata: {
                    fields: {
                        published_url: {
                            value: '/example_url/3'
                        },
                        title: {
                            value: 'Styled text',
                            attributes: {
                                text_color: {
                                    vp: {
                                        desktop: 'red'
                                    }
                                },
                                text_size: {
                                    vp: {
                                        desktop: 42
                                    }
                                }
                            }
                        },
                        subtitle: {
                            value: 'Image with filters applied',
                            attributes: {
                                text_size: {
                                    vp: {
                                        desktop: 20
                                    }
                                },
                                font_weight: {
                                    vp: {
                                        desktop: 'font-weight-black'
                                    }
                                }
                            }
                        }
                    }
                },
                children: [{
                    type: 'image',
                    contentdata: {
                        instance_of: 148210
                    },
                    metadata: {
                        filter_saturate_active: { value: true },
                        filter_saturate_value: { value: '1.55' },
                        filter_brightness_active: { value: true },
                        filter_brightness_value: { value: '1.1' },
                        filter_contrast_active: { value: true },
                        filter_contrast_value: { value: '1.3' }
                    }
                }]
            }]
        }]
    }]
}];

/**
 * Step 3:
 * Pass over data to the rendering engine
 */
renderer.setData(data);

/**
 * Debug: Timing
 */
const setDataTime = new Date().getTime();

/**
 * Step 4:
 * Render data, generate HTML
 */
const markup = await renderer.render();

/**
 * Debug: Timing
 */
const endTime = new Date().getTime();

/**
 * Insert generated HTML on page
 */
document.querySelector('#container').innerHTML = markup;

/**
 * Debug: Display timing
 */
document.querySelector('#initTime').innerHTML = initTime - startTime;
document.querySelector('#setDataTime').innerHTML = setDataTime - initTime;
document.querySelector('#endTime').innerHTML = endTime - setDataTime;
document.querySelector('#totalTime').innerHTML = endTime - startTime;
