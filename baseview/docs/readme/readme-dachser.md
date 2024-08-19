# Dachser
View-resources for multiple sites

## Version-string
Update version in file `/config/version.json`

The CMS reads `view_version` and `view_name`. Dachser also uses `view_version_number` and stores this number on all page-nodes edited (at `fields.view_version_number`) unless it already exist. This will let us know at what version of the view any page is created.

## Site-organization

### Site-config
Config-files: `/config/presentation/site/<sitename>.json`  
Config-name: `site_config_<sitename>`  
CSS-file(s): `/config/presentation/site_styles.json`

### Site-naming
Name of site must match `site.alias` defined in the CMS. Do not use any whitespace, special characters or uppercase letters.

Subdomains for a site should use a prefix identifying it to the main site.
Example: The site `forskning` uses two subdomains: `blogg` and `stilling`. Name them something like `fo_blogg` and `fo_stilling` to avoid confusion with other subdomains.

### Data
Page-filters run the method `ViewSupport.presentation.setDefaultPageData` making general data available to the page-templates.

Site-specific methods can be defined in js-files in `/lib/presentation/site/<sitename>/`.

Event-listeners can be registered per site in method `ViewSupport.site.<sitename>.presentation.registerLabradorEvents`. This method can listen for Labrador-events and handle them as needed. (Insert ads or other content programmatically using DynamicDataController for example.)

Page-filters also run `ViewSupport.presentation.applyFilterMethods` that calls site-specific methods defined in config `applyToPageFilter` in the file `/config/presentation/site/<sitename>.json`.

## Styles
Each site can store SCSS-file(s) in the folder `/view/css_scss/site/` that should compile to CSS-file(s) in `/view/css/site/`. These files should be referenced in `site_styles.json` to automatically be added to page-templates.

## Color and naming policy
- Define main colors:
  primary, secondary, tertiary, quaternary, quinary, senary, septenary, octonary, nonary ...
- Define a normal, light and dark version of each main color:
  primary, primary-light, primary-dark, etc.
- Let all sites use the same names (at least primary, secondary and tertiary)
  Allows for templates to hard-code class-names for color.

## Resources and templates
Specify resource-maps per site in `sites` in the file `/config/presentation/config.json`. Use these to specify resources that diverge from the default.

### Organization
Store all site-specific resources in a `site`-folder. A frontpage-template for site `example` should be stored in `/view/page/article/default/site/example/<template_name>.template.mustache`, a property-file for byline should be stored in `/view/structure/byline/site/example/<filename>.json` etc.

### Contentbox-settings
Site-config may contain the object `contentbox_settings` used to add settings per contentbox. Each key is the name of a contentbox. This allows us to remove site-specifics from the box itself. The box needs to handle missing config. Read config using `Lab.conf.get('contentbox_settings.<boxname>')`. This object is a candidate for editing using the new key/value store.

### Analytics
Each site can specify provider-specific config in config `analytics.<provider>`.
Default config is stored in the file `/config/presentation/analytics.json`, site-overrides are stored in site-config.
Example:
```json
"analytics": {
    "google": {
        "tracking_id": "UA-xxx-1"
    },
    "kilkaya": [
        {
            "id": "xxx"
        },
        {
            "id": "yyy"
        }
    ]
}
```
Note: `kilkaya` (array) holds a list of one ore more account-ids.
This allows for several kilkaya-accounts to run simultaneously.

#### Common Kilkaya-accounts:
Several customers use an account provided by Fagpressen.
Id: 60ae49163984713a036f5c02
Url: //cl.k5a.io/60ae49163984713a036f5c02.js

The ViewSupport supply site-specific providers for templates. These must include each provider where applicable.

### Google Site Search
Implementation for sites (file `/config/presentation/site/<sitename>.json`):
```json
{
    "site_config_<sitename>": {
        "contentbox_settings": {
            "googleCSE": {
                "cse_id": "<search-engine-id>"
            }
         }
    }
}
```

### Dynamically inserted content
Customer-specific code can use a common method to insert data onto the page: `ViewSupport.presentation.dynamic.insertContent`. 
The first argument is an array of content to insert, the second if a flag for debug.
Example:
```json
[
    {
        "type": "adZone",
        "path": "dropZone[0]",
        "metadata": {
            "css": "adZone-right"
        },
        "dynamicDataSettings": {
            "hideInEditMode": true
        },
        "children": [
            {
                "type": "emediateAd",
                "content_data": {
                    "fields": {
                        "format": "rightmargin_c1"
                    }
                }
            },
            ...
        ]
    }
]
```
`path` or `selector` can be used. If `selector` is used a matching dom-element must be present in template. The example above is used to insert ads on page.

On mobile rows may be irrelevant. If customer want to insert something after the fourth article this can be done by replacing `path` or `selector` with `pathHelper` (object):
```json
[
    {
        "type": "adnuntiusAd",
        "pathHelper": {
            "type": "article",
            "index": 2
        },
        "content_data": {
            "fields": {
                "format": "mobile_board_2_netboard"
            }
        },
        "dynamicDataSettings": {
            "hideInEditMode": true
        }
    },
    ...
]
```
The above exampel will insert a box of type `adnuntiusAd` after the second article on the page.

### Ads
Some sites use Emediate Ads / Adnuntius-ads. Setup is as folows:
- Define ad-formats in config `contentbox_settings.emediateAd` / `contentbox_settings.adnuntiusAd`
- Define ads to insert in config `insertDynamic` for site  
- Register a listener for event `lab-presentation-will-accept-dynamic_data` in `ViewSupport.site.<sitename>.presentation.registerLabradorEvents`, read config for page-type and device and insert as described above.
- To display ads outside regular content the contentbox `adZone` can be used. Supported selectors:
    - adZone-top
    - adZone-right
    - adZone-left

The partial `partial/ads/adzones` should be included on article-pages for all sites to include placeholders for ad-zones.
See method `registerLabradorEvents` in the file `/lib/presentation/site/journalisten/ViewSupport.js` for example of implementation.

### Bylines
Bylines can be dragged and dropped into the bodytext. The template used in bodytext allows background-color. The filter checks for any configured default background-color.  
Add default background-color in config `contentbox_settings.byline.default_color`.

### Zoomable images in bodytext
Editors can use a menu-item in the menu for images added to the bodytext to activate image-zoom. This lets end-user click the image to display a large version of it.  
A small magnifying glass is displayed on the top right hand of the image.
The menu-item sets metadata `zoomable` on the image-structure. Properties for the image make sure that it is only set for current viewport ("noFallback": true):
```json
{
    "viewport_data": {
        "metadata": {
            "zoomable": {
                "noFallback": true
            }
        }
    }
}
```
This makes sure that activating the feature for desktop do not activate it for mobile where zooming makes less sense.

### Date-format for articles
Config `contentbox_settings.articleMeta.date` is read by the filter `Lab.View.Filters.content.articleMeta` (lab4: Behaviour ArticleMeta.js).
The filter prepares the published/modified dates printed in the articleMeta content and keeps default config for the date-formatting.
Use config to override defaults. The formatting is done by `Labrador.Date.DateTime` (lab4: DateTimeHelper.js).
(Note Lab4: DateTimeHelper.js documents how to structure the template string for the desired output.)

Avoid using dateFormat, as it has a bug where it repeats certain words.

Example:
```
"contentbox_settings": {
    "articleMeta": {
        "date": {
            "template": "{{dddd}} {{DD}}. {{MMMM}} {{YYYY}} - {{HH}}:{{mm}}"
        }
    }
}
```

### Tags
Path to tag-page is set in server-config. Replicate in view to set correct url for content that links to tag-pages, for example `articleFooter`.

Specify in site-config: 
```json
{
    "tagPagePath": "/emne/"
}
```
Default value is `/tag/` if nothing is specified.

### Embeddable content
Dachser supports embedding of articles and parts of front-pages.

Example of embedding teaser for article `123456` from site `example.com`:

`<div class="labrador-cms-embed" data-lab-content="teaser" data-lab-id="123456" data-lab-site="example.com"><script async defer src="https://example.com/embed.js"></script></div>`

Example of embedding full article (editorial content) `123456` from site `example.com`:

`<div class="labrador-cms-embed" data-lab-content="full" data-lab-id="123456" data-lab-site="example.com"><script async defer src="https://example.com/embed.js"></script></div>`

Exampel of embedding the first row at frontpage `abc` from site `example.com`:

`<div class="labrador-cms-embed" data-lab-name="abc" data-lab-path="dropZone[0]/row[0]" data-lab-site="example.com"><script async defer src="https://example.com/embed.js"></script></div>`

Exampel of embedding structure with id `cdbcdd28-52c3-4c33-c54a-cb54e0480d6f` at frontpage `abc` from site `example.com`:

`<div class="labrador-cms-embed" data-lab-name="abc" data-lab-guid="cdbcdd28-52c3-4c33-c54a-cb54e0480d6f" data-lab-site="example.com"><script async defer src="https://example.com/embed.js"></script></div>`

The above example is useful for frontpages where content may change position. Using the id of for example a row will return the row regardless of where it is placed in the dropzone.

The embed-script will use the data-attributes of the div-element to generate an url to use in an iframe loading the content.
The url for the article: 
`https://example.com/a/123456?lab_viewport=embed&lab_content=full`

Front-page:
`https://example.com/abc?lab_viewport=embed&lab_path=dropZone[0]/row[0]`
`https://example.com/abc?lab_viewport=embed&lab_guid=cdbcdd28-52c3-4c33-c54a-cb54e0480d6f`

So the pages will draw using the viewport `embed`.
Add the viewport to config `viewports` in the file `config/presentation/config.json`:
```
"embed": {
    "deviceWidth": 640,
    "padding": 0,
    "noFallback": false,
    "noEdit" : true
}
```

Use resource-maps for front-page and article-page to specify a template to use for the viewport.
If a path is used the page-template must include the selector `contentFromPath`:
`{{{ placeholder.contentFromPath }}}`

Default config
```
"embeddable": {
    "active": false,
    "sitelink": {
        "prefix": "Les mer på",
        "postfix": ""
    }
}
```
`embeddable.active` is default set to false, disabling the feature.

Viewsupport reads the config and sets the filtered object `embeddable`. This is used to add resources as needed.

To display an embed-button:
1) Add this to the template where the button should display:
```
{{ #filtered.embeddable.display }}
<div class="column large-6 small-6 embed">
    {{> partial/embedThis}}
</div>
{{ /filtered.embeddable.display }}
```
2) Set config `embeddable.active` to `true` for the site.

3) Include the script to display embed-gui in `site_scripts.json`:
```
{
    "url": "/view-resources/baseview/public/common/embedThis.js",
    "requireDom": true
}
```

### Fragments
The view can display a subset of a page using the get-param `lab_path` or `lab_guid`.
This is used when embedding parts of a front-page.

| Argument      | Example                               | Description
| --            | --                                    | --
| lab_path      | dropZone[0]/row[1]                    | Get second row of drop-zone
| lab_guid      | cdbcdd28-52c3-4c33-c54a-cb54e0480d6f  | Get content by structure-id

ViewSupport will use the Labrador-event `lab-presentation-will-initialize-structure-data` and only use the data matching the path or guid.

The argument `lab_selector` can be used to add a selector to the data. Default value is `contentFromPath`. 
The selector is used in the template to specify where the content should draw.

#### Example
Url: `/some_page/?lab_path=dropZone[0]/row[1]/article&selector=my_selector`
Url: `/some_page/?lab_guid=cdbcdd28-52c3-4c33-c54a-cb54e0480d6f&selector=my_selector`

Template:
```
<html>
    <head />
    <body>
        ...
        {{{ placeholder.my_selector }}}
    </body>
</html>
```

On front-pages the selector fro the drop-zone in page-templates is `lab-dz-1`.

This url will use existing page-tamplate but restrict content by path:  
`/some_page/?lab_path=dropZone[0]/row[2]/factbox&selector=lab-dz-1`


### Fonts
Style-definitions is set in `style_definitions` in config and/or `configObject`.
The `style_definitions.fontface`-array lists selected Google Fonts to include per site and must be matched with CSS. CSS is defined in `style_definitions.rules`.
The CSS is printed in a `style`-element in the page-header and the font CSS-files are printed in a `link`-element.
Note: `familyKey` is the `family`-name stripped of white-space and used in text editors and css-selectors to set font-family.
ViewSupport creates css for each family using prefix `font-`. Example: `.font-AsapCondensed { font-family: "Asap Condensed" !important; }`

Config example:
```
"style_definitions": {
    "fontface": [{
        "family": "Merriweather",
        "familyKey": "Merriweather",
        "link": "https://fonts.googleapis.com/css?family=Merriweather:regular,italic,700,700italic",
        "variants": [
            "regular",
            "italic",
            "700",
            "700italic"
        ]
    }],
    "rules": [
        {
            "selector": "body",
            "declarations": [
                {
                    "key": "font-family",
                    "value": "'Merriweather', 'Helvetica', sans-serif"
                }, {
                    "key": "font-weight",
                    "value": "normal"
                }, {
                    "key": "font-style",
                    "value": "normal"
                }
            ]
        }
    ]
}
```
This is the default config for fonts. Custom settings will override this.

Customers that manually includes fonts and font-styles in CSS should disable the default config:
```
"style_definitions": {
    "fontface": [],
    "rules": []
}
```

The admin-tool `FontEditor` lets customers select font-families to use on their installation.
This tool operates on `style_definitions.fontface`.

The admin-tool `FontStyleEditor` lets customer create CSS for any number of selector and apply the selected font-families, weights and styles.
This tool operates on `style_definitions.rules`.

Both tools are configured in the file `/config/admin/config.json`.

## Add a new site - Checklist
These settings assume the name of the new site is "example_site".
- Add the site in the admin-page /settings/sites
- Specify name of resource map for site in `sites.example_site` in the file `/config/presentation/config.json`.
- Add site-settings in `site_config_example_site` in the file `/config/presentation/site/example_site.json`:
    - `tags.section` (optional) defines sections for site. If not specified default set is used.
    - `favicons` (optional) defines favicon for site. Is handled by page-filter + template
    - `font_colors` (optional) defines a list of colors users can choose from when editing content.
    - `background_colors` (optional) defines a list of colors users can choose from when editing content.
    - `skipDefaultFont` (optional) If set to `true` the default font is not used. View must supply own fonts.
    - `style_definitions` (optional) Define font-css and custom css-rules for site. To disable default font set: `{ "fontface":[], "rules":[]}`
    - `contact.email` (optional) `tips_box` and more uses these to print contact-information.
    - `applyToPageFilter` (optional) namespaced methods to run in page-filter.
    - `contentbox_settings` (optional) Settings for content-boxes.
    - `comments_provider` (optional) Settings for comments (facebook, disqus, ...)
- Add CSS-file(s) in `site_styles.example_site` in the file `/config/presentation/site_styles.json`. These file(s) will be added to page-header and to main window in edit-mode.
- Define JS-code in `ViewSupport.site.example_site` in the file `/lib/presentation/site/example_site/ViewSupport.js` if needed.
- Use the resource-maps to assign nessesary templates and properties for the site.
- If "example_site" should use another site as fallback, follow these steps to inherit config, resource_map and/or styling:
    - Config:       Add "lab_fallback_site": "{parent_site}" in the new site config.
    - Resource map: Add new entry in config/presentation/config.json but with "resource_map": "resource_map_{parent_site}".
    - Styling:      Copy the entry from "{parent_site}" in site_styles.json and rename to "{example_site}"
- Remember to add `{{ > partial/ads/adzones }}` above `{{{ placeholder.lab-dz-pre-header }}}` in the article template.
- Add mailmojo template and logo _(.png)_ through `[site_name].json` and the respectable `resource_map`.

