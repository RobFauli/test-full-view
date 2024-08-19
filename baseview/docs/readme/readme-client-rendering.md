# Client side rendering
Baseview includes the main rendering engine from Labrador CMS for rendering data client side.
This allows you to re-use templates, properties and JS-modules used server side when rendering content in the browser of the end user.
Suitable for rendering AB-tests, personalized content or anything else initialized from the users browser.

## Files needed at the client:
- `public/common/labrador/Core.js`
Labrador rendering engine

- `build/modules/client_modules.js`
JS-modules

- `build/modules/client_package.js`
Config, templates and properties

- `public/common/Mustache/mustache.min.js`
Mustache template renderer

## Build-systems

### JS-modules

Run Webpack using config-file `webpack.config.client.cjs` to build all JS-logic you want to include when running Labrador client side.
Baseview creates a build from the module `index_client.js`. In this file you export your modules as you du with `index_front.js` for server side rendering and `index_editor.js` for modules for the editor.

The results are stored in `build/modules/client_modules.js` and should be imported by the client as specified above.

### Config, templates and properties

Run the file `client/buildHelpers/builder.js` using Node or similar.

This file excpects the following resources:
- `./client/configPaths.json`

This file should contain an array of config-files to use in Labrador when rendering client side. Example:
```
[
    "config/version.json",
    "client/config.json",
    "config/presentation/style.json"
]
```

- `./client/resources.json`

This file is an object with resource-maps for any element-type you want to use client side.

Example:
```
{
    "content/row/_resources.json": {
        "presentation": { ... }
    },
    "content/article/_resources.json": {
        "presentation": { ... }
    },
    "content/image/_resources.json": {
        "presentation": { ... }
    }
}
```
This allows you to specify templates and properties for any content that should be available client side. You may want to use identical resources as when rendering server side or you can use seperate resources.

The results are stored in `build/modules/client_package.js` and should be imported by the client as specified above.

## Using the rendering engine

You can run a demo at any Labrador-installation using Baseview at `/labrador/demo/index.html`.
Source code available at `public/common/labrador/demo/index.html`

## Helpers
Baseview ships with some modules that makes fetching data and setting up the rendering engine simpler.
Data from Labrador Search API and Baseview JSON is mapped to internal format and passed over to the rendering engine.

Implementation example:
```
import { FrontContentRenderer } from '../labrador/source/FrontContentRenderer.js';

const settings = {
    fallbackImage: 'http://image.example.com/123456.webp?width=1000',
    sourceType: 'LabradorApi',
    selector: '#my_container',
    layout: {
        "columnCount": 3,
        "rowCount": 10,
        "maxRowSize": 3,
        "minRowSize": 1,
        "imageAspectRatio": 0.6,
        "hide_items": []
    }
};

const renderer = new FrontContentRenderer({
    url: 'https://api.example.com/article?query=test&limit=20&start=0&site_id=2',
    app: {
        device: 'mobile',
        image_server: 'http://image.example.com'
    },
    settings
});

// Fetch and render data. Insert result on page
// The resolved 'result' is an instance of `ClientData` holding data and rendered markup from Labrador.
this.FrontContentRenderer.read().then((result) => {
    const container = document.querySelector(settings.selector);
    const fragment = new DocumentFragment();
    for (const item of result.markups) {
        const div = document.createElement('div');
        div.innerHTML = item;
        fragment.appendChild(div.firstChild);
    }
    container.appendChild(fragment);
});
```