# Custom Starter View
This view require multiview (`baseview` or similar).
https://github.com/publishlab/baseview

## Summary
This example repo is a starting point for customers wanting to create a custom view for Labrador CMS. Labrador CMS will not run with the custom view alone, it needs to be used as part of a `multiview` on top of `baseview`.

The repo adds site-specific config, templates, properties, js-code and styling to `baseview`.
Any resource needed by any customer maintained by Labrador CMS should be added to this repo.

## Multiview
This view adds to and override components in Baseview.
To run several views in Labrador CMS you need the file `view-config.json` defining name of views to use.
This file should be placed outside this view.

Exampel of file structure:
```
- view-resources
    - baseview
    - custom-starter-view
    - view-config.json
```

Exampel of `view-config.json`:
```
{
    "repos": ["baseview", "custom-starter-view"]
}
```

The order of the `repos` array define priorities when merging files and order of javascript modules.

For more info, see url `/support/docs/#view/overview.md` on a Labrador installation.

## Sites and files
Separate sites belonging to the same customer should keep separate files in the view.
It should be possible to remove files for one site without affecting other sites.
- Name your custom view, here written as `<custom-view>` 
- Name a site without any link to another site separatly. Use `sitename`.
- Keep separate stylesheets
- Keep separate folders and files throughout the view
- Public resources referenced in templates, config or stylesheets should use path with repository-name:
`view-resources/<custom-view>/public/...` or `view-resources/baseview/public/...`

## Styling
The view do not contain general styling, only styles for included sites and custom elements.
General styling from `baseview` is required.

Each site define a Sass-file in `view/css_scss/site/<sitename>.scss`. This includes variables for grid, colors etc.
See `view/css_scss/site/demosite.scss` for reference.

Check `package.json` for build/watch-scripts.
Example:
`npm run watch:sass` 
This command will watch all Sass-files and trigger build of compiled css-files and maps.

#### Fonts from the view
Customers that manually includes fonts and font-styles in CSS should disable the default config:
```
"style_definitions": {
    "fontface": [],
    "rules": []
}
```

The SCSS-mixin `font-face` should be used to generate `@font-face`-declarations.
Exampel for the font-family `Example` located in the folder `public/<sitename>/fonts/example`:
```
@import "../components/fonttools";
$fontPath: '/view-resources/<custom-view>/public/<sitename>/fonts';

@include font-face("Example", '#{$fontPath}/example/example-light', 200, normal, eot woff woff2 ttf svg);
@include font-face("Example", '#{$fontPath}/example/example-normal', 500, normal, eot woff woff2 ttf svg);
@include font-face("Example", '#{$fontPath}/example/example-bold', 600, normal, eot woff woff2 ttf svg);
@include font-face("Example", '#{$fontPath}/example/example-black', 800, normal, eot woff woff2 ttf svg);
```

Arguments to the `font-face` mixin, separated by comma:
- Name of font (`font-family: Example, sans-serif`)
- Path to font-file, minus extension
- Weight
- Style (normal, italic, ...)
- File-formats

If font-files for italic style is available it can be used like this:
```
@include font-face("Example", '#{$fontPath}/example/example-light', 200, italic, eot woff woff2 ttf svg);
```

If only woff2-format is available it can be used like this:
```
@include font-face("Example", '#{$fontPath}/example/example-light', 200, normal, woff2);
```

The admin-tool `FontEditor` lets customers select font-families to use on their installation.
This tool operates on `style_definitions.fontface`.

The admin-tool `FontStyleEditor` lets customer create CSS for any number of selector and apply the selected font-families, weights and styles.
This tool operates on `style_definitions.rules`.

Both tools are configured in the file `/config/admin/config.json` in baseview.

## Config
Every site needs a config-file.
Add a config-file for site `sitename` in the file `config/presentation/site/<sitename>.json`.

For sub-sites, use the key `lab_fallback_site` with the site-alias of the parent site as value.

Resources affected by `lab_fallback_site` is:
- config
- css-files for front (defined in `config/presentation/site_styles.json`)
- js-files for front (defined in `config/presentation/site_scripts.json`)
- partials rendered with `view.renderPartial`

If a sub-site defines all of these resources itself `lab_fallback_site` can be skipped.

### Fallback config
Objects are merged, any other data-types are replaced (including arrays)

### Fallback scripts
If a sub-site skips defining `site_scripts` any js-file(s) used by the parent will also be used by the sub-site.
If the sub-site needs any special scripts all files must be included in `site_scripts` for the sub-site.

### Fallback styles
If a sub-site skips defining `site_styles` any css-file(s) used by the parent will also be used by the sub-site.
If the sub-site needs any special styling all files must be included in `site_styles` for the sub-site.

### Fallback partials
If a sub-site is missing a partial in the partial-folder `view/partial/site/<site-name>` Labrador will search in the partial-folder og the parent-site.
To override a partial for a sub-site, add a identical named template in the partial-folder of the sub-site

### Examples
The subsite `sub_sitename` should use resources from its parent site `sitename`.

#### Inherit all config
File: `config/presentation/site/<sub_sitename>.json`
```
{
    "lab_fallback_site": "sitename",
}
```

#### Override background-colors
File: `config/presentation/site/<sub_sitename>.json`
```
{
    "lab_fallback_site": "sitename",
    "background_colors": [
        "bg-primary-light",
        "bg-primary",
        "bg-primary-dark",
        ...
    ]
}
```

#### Inherit all css-files
Skip defining files in `config/presentation/site_styles.json` for the sub-site.

#### Use one or more unique css-files for the sub-site
Define all files to be used with subsite `sub_sitename`, including the ones defined by parent `sitename`.  
File: `config/presentation/site_styles.json`
```
{
    "site_styles": {
        "sitename": [
            "file_1.css",
            "file_2.css"
        ],
        "sub_sitename": [
            "file_1.css",
            "file_2.css",
            "file_3.css"
        ]
    }
}
```

#### Inherit all js-files
Skip defining files in `config/presentation/site_scripts.json` for the sub-site.

#### Use one or more unique js-files for the sub-site
Define all files to be used with subsite `sub_sitename`, including the ones defined by parent site `sitename`.  
File: `config/presentation/site_scripts.json`
```
{
    "site_scripts": {
        "sitename": [
            {
                "url": "file_1.js",
                "requireDom": true
            },
            {
                "url": "file_2.js",
                "requireDom": false
            }
        ],
        "sub_sitename": [
            {
                "url": "file_1.js",
                "requireDom": true
            },
            {
                "url": "file_2.js",
                "requireDom": false
            },
            {
                "url": "file_3.js",
                "requireDom": false
            }
        ]
    }
}
```

#### Partials
If the site `sub_sitename` renders a template using the partial
`{{ #view.renderPartial }}page_header{{ /view.renderPartial }}`
Labrador will first look for the file  
`view/partial/site/<sub_sitename>/page_header.template.mustache`.
If none is found Labrador will look for  
`view/partial/site/sitename/page_header.template.mustache`.

## Default files to include for new site `sitename`

Path                                                        | Description
---                                                         | ---
config/presentation/site/sitename.json | General config
config/presentation/site_scripts.json[site_scripts]         | Add optional javascripts for front: `"sitename": [{ "url": "/view-resources/<custom-view>/public/<sitename>/example.js", "requireDom": true }, { ... }]`
config/presentation/site_styles.json[site_styles]           | Add optional stylesheet(s) for front: `"sitename": ["/view-resources/view/css/site/<sitename>.css", "..."]`
public/`<sitename>`/                                          | Logos, fonts, favicons and other resources for front
view/css_scss/site/`<sitename>`.scss                          | Sass-file for site. Contains all sass-variables and definitions for site.
view/partial/site/`<sitename>`/                               | Directory for partials like page-header and footer

## Override resource-maps
Use with care. Normally it should not be nessesary to override resources for content.
Try to avoid it by making the contentbox or page more flexible using config instead.

Path                                                        | Description
---                                                         | ---
config/presentation/site_config.json[sites] | Add `sitename: { "resource_map": "resource_map_sitename" }`
