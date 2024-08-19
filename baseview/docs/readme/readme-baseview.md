# Dachser baseview

This view is merged with your view and act as a default view. You may override any file with your own version.

The view is able to hold configuration and resources for multiple sites.

## Architeture
Overview of the files in the view

- `config/` Config for the view
    - `presentation/` Config for edit-mode
    - `edit/` Config for edit-mode. Overrides config from presentation-mode
    - `admin/` Config for admin-pages
    - `version.json` Versioning-information for the view. Displayed in the editor and in the log in presentation-mode.
- `dashboard/` View for Labrador Dashboard
- `lib/` Supporting Javascript-files
    - `presentation/` Scripts run in presentation-mode
    - `edit/` Scripts run in edit-mode
- `menu/` Application-menus for the editor
- `public/` Public files
- `view/` Resources for pages, contentboxes and containers
    - `content/` All contentboxes containing node-data
    - `content_settings/` Common property-files
    - `css/` Stylesheets
    - `menu` Templates for the application-menus defined in `/menu`.
    - `menu_settings/` Properties for tool-menus and contentbox-menus
    - `page/` Resources for pages
    - `partial/` Common templates included on pages or content-boxes
    - `plugin_support/` Templates used by plugins
    - `structure/` Properties and templates for content-boxes and containers
    - `structure_settings/` Common property-files


## Config
When Labrador reads config it will check the path `site_config_<site_name>` and merge with config stored in `config/presentation/config.json` and `config/edit/config.json`.

This means that you can add a config-file for each site. These are stored in `config/presentation/site/`. For a site named `my_site` you can add the file `config/presentation/site/my_site.json`:
```
{
    "site_config_my_site": {
        ...
    }
}

```

Throughout the view folders named `site` exist. These can hold resources for a specific site. Name each file or folder by site-name.

## Add the site `my_site` to the view

### 1. Specify name of resource-map for the site
This is done in the file `config/presentation/config.json`. This will make Labrador read resources for this site if they are specified:
```
{
    "sites": {
        "default": {
            "resource_map": "resource_map"
        },
        "my_site": {
            "resource_map": "resource_map_my_site"
        }
    }
}
```

### 2. Add config for the site
Add the file `config/presentation/site/my_site.json`. This file will override default config.
This example will override background-colors used in the editor:
```
{
    "background_colors": ["bg-red-light", "bg-red", "bg-red-dark", "bg-green-light", "bg-green", "bg-green-dark", "bg-blue-light", "bg-blue", "bg-blue-dark", "bg-black", "bg-white"]
}
```

### 3. Override resources for the site
If you need a separate template or property-files for the site you add a resource-map specifying the resource. This example will use a site-specific template for article-pages.
File: `view/page/article/default/resource_map_my_site.json`:
```
{
    "presentation": {
        "stage": {
            "lab-default": {
                "template": {
                    "default": "page/article/default/site/my_site/default"
                }
            }
        }
    }
}
```
Add your template to the file `page/article/default/site/my_site/default.template.mustache`.
Do the same for any other resource needed. 

### 4. Specify js-files to include
Use file `site_scripts.json` to set up files required on front.
The files will also be included in the editor. 
```
{
    "site_scripts": {
        "my_site": [
            {
                "url": "https://example.com/file.js",
                "requireDom": false,
                "skipEditor": true,
                "placeholderKey": "key-to-placeholder-in-template",
                "attributes": [
                    {
                        "key": "data-token",
                        "value": "my-token"
                    }
                ],
                "attributeKeys": [
                    "async"
                ],
                "inherit": true
            }
        ]
    }
}
```

Key             | Type      | required  | description
--              | --        | --        | --
url             | string    | yes       | The url to the file. For local files use `/view-resources/public/...`
requireDom      | boolean   | no        | If true the script-tag is added at the bottom of the page, if not in the head-element
placeholderKey  | string    | no        | If the script has to be inserted somewhere other than the default placements, this key can be used. A matching placeholder has to be added in a template. See details below.
pageType        | string    | no        | Only add path for specified page-type ('article' or 'front'). Default: All page-types.
attributes      | array     | no        | List of key/value-pairs: `<key>="<value>"`
attributeKeys   | array     | no        | List of keys: `<key>`
inherit         | boolean   | no        | Whether inheriting sites should inherit this script. Defaults to true.
skipEditor      | boolean   | no        | Should this script only load on front? If set to false or omitted the script is loaded in both the editor and front. Defaults to false.

The above exampel will generate a script-element like this:
```
<script src="https://example.com/file.js" data-token="my-token" async></script>
```

If the placeholderKey is used, the placeholder to be inserted in the template should look like this:
```
{{ #filtered.siteScriptList }}
    {{ #placeholderKey.adnuntius-prebid }}{{ > partial/elements/script }}{{ /placeholderKey.adnuntius-prebid }}
{{ /filtered.siteScriptList }}
```

## Display read-progress on articles
Baseview may display a horizontal line on top of article-pages indicating the length of articles relative to scroll-position.
This feature is only available on front, not in the editor.

To enamle the functionality, do the following.

- Add config:
```
{
    "displayReadProgress": {
        "active": true,
        "minElementCount": 25
    }
}
```
This config tells Baseview to allow usage of read-progress. The property `minElementCount` defines minimum number of elements present before the functionality will be applied. (Not much use for this on short articles).

- Add a dom-element to display the progress:
```
<html>
    ...
    <body>
        <article>
            ...
            {{ #filtered.readProgress.active }}
                {{> partial/readProgress }}
            {{ /filtered.readProgress.active }}
            ...
        </article>
        ...
    </body>
</html>
```
The template `partial/readProgress` contains a single element that will display 100% width when user has seen the whole article. Default styling is found in the file `baseview/view/css_scss/components/_readProgress.scss`.

ViewSupport will set `filtered.readProgress.active` to boolean `true` if the template should use it.

- Use `dachserData` to set input to the js-class displaying the progress.

In the article-template, add the following script:
```
{{ #filtered.readProgress.active }}
<script>
(function () {
    window.dachserData.push('readprogress', {
        selector: '.read-progress',
        targetSelectors: ['.articleHeader', '.bodytext'],
        minElementCount: '{{ filtered.readProgress.minElementCount }}',
        debug: {{ #filtered.isDebug }}true{{ /filtered.isDebug }}{{ ^filtered.isDebug }}false{{ /filtered.isDebug }}
    });
}());
</script>
{{ /filtered.readProgress.active }}
```

The `targetSelectors`-array let you specify parent-elements of all elements that should be used to measure reading progress. The example above will use main image, title, subtitle, meta (bylines etc) and all lines in the bodytext.

- Turn read-progress on in article-settings.

If you use a separate article prototype for long-reads you can enable it here. Or you can enable/disable it on any article you choose.

If you add `?debug=1` to the url on front the console will display debug-info for the functionality.

## Display a disclaimer for old articles
The config `page_settings.article.ageWarnings` (object) is read by Baseview and used to display a disclaimer for end-user.
The path can be defined by admin-tool `ageWarning`.

Example:
```
{
    "page_settings": {
        "article": {
            "ageWarnings": {
                "one_year": {
                    "years": 1,
                    "label": "This article is more than one year old and may contain outdated information.",
                    "css": "old_article"
                },
                "ten_years": {
                    "years": 10,
                    "label": "This article is more than ten years old and may contain outdated information.",
                    "css": "veeeery_old_article"
                }
            }
        }
    }
}
```
Property `css` is optional.

## Favicons

Sizes: 32, 96, 120, 180 + svg  
Naming: `favicon-{ width }x{ height }.png`  

Site-config:
```
{
    "faviconList": [
        {
            "iconPath": "/view-resources/public/<site_alias>/favicon.svg",
            "iconType": "image/svg+xml"
        },
        {
            "iconPath": "/view-resources/public/<site_alias>/favicon-32x32.png",
            "iconSize": {
                "width": 32,
                "height": 32
            }
        },
        {
            "iconPath": "/view-resources/public/<site_alias>/favicon-96x96.png",
            "iconSize": {
                "width": 96,
                "height": 96
            }
        },
        {
            "iconPath": "/view-resources/public/<site_alias>/favicon-120x120.png",
            "iconRel": "apple-touch-icon",
            "iconSize": {
                "width": 120,
                "height": 120
            }
        },
        {
            "iconPath": "/view-resources/public/<site_alias>/favicon-180x180.png",
            "iconRel": "apple-touch-icon",
            "iconSize": {
                "width": 180,
                "height": 180
            }
        }
    ]
}
```

Markup from template `view/partial/faviconList.template.mustache`:
```
<link type="image/svg+xml" rel="icon" href="/view-resources/public/<site_alias>/favicon.svg"/>
<link type="image/png" rel="icon" sizes="32x32" href="/view-resources/public/<site_alias>/favicon-32x32.png"/>
<link type="image/png" rel="icon" sizes="96x96" href="/view-resources/public/<site_alias>/favicon-96x96.png"/>
<link type="image/png" rel="apple-touch-icon" sizes="120x120" href="/view-resources/public/<site_alias>/favicon-120x120.png"/>
<link type="image/png" rel="apple-touch-icon" sizes="180x180" href="/view-resources/public/<site_alias>/favicon-180x180.png"/>
```

## Custom metatags
Add config `customMetatags` (array) to let Baseview print any meta-tag in the header of the page.

Each element in the `customMetatags`-array is an object with key-value pairs. The key is the name of an attribute of the meta-tag and the value is the value.

Example:
```
{
    "customMetatags": [
        {
            "name": "description",
            "content": "description of this page ..."
        },
        {
            "http-equiv": "Content-Type",
            "content": "text/html; charset=utf-8"
        }
    ]
}
```
The config above will result in the following meta-tags:
```
<meta name="description" content="description of this page ..." >
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
```

An admin-tool is also available for setting config `customMetatagsKeyVal`.
The tool is available at url `/settings/cp?page=metatags`
ViewSupports handles both formats.

## Page-element configuration
You can create configured `Page-elements` by defining them in your config.


### **Configuration**
The following configuration will define a simple `page_header` Page-element.
```json
{
    "pageElements": {
        "page_header": {
            "settings": {
                "tag": "header"
            },
            "children": [
                {
                    "type": "structures/section",
                    "settings": {
                        "classes": [ "mainline" ]
                    },
                    "children": [
                        {
                            "type": "structures/row",
                            "settings": {
                                "classes": [ "grid-align-center" ]
                            },
                            "children": [
                                {
                                    "type": "ui/logo"
                                },
                                {
                                    "type": "ui/menu",
                                    "settings": {
                                        "type": "mainMenu"
                                    }
                                },
                                {
                                    "type": "ui/search"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
}
```
<br />

### **API**
Key|Value|Description
---|-----|-----------
**type**|`string`|A path to the widget view. Widgets are available in `view-resources/view/partial/widgets`.
**settings**|`object`|Contains settings to be exposed to the widget. The key for each property in the settings will be a reference for the view, and the value can be a string or array.
**children**|`Array<Widget>`|An array of Widgets. Each widget follows the API structure defined in this table recursively.
<br />
### **Styling**
Configured Page-elements will automatically add the class `pageElement` to the root DOM Node. This ensures that no other styling will be overritten by the Page-element styles.  
The following example adds a simple style to the page_header Page-element defined over.
```scss
header.pageHeader {
    .mainline {
        height: 70px;
        background-color: #222222;
    }
    ...
}
```

### **Scroll events**

Scroll events can be added to the page header settings. This will create an intersection observer that can set classes or styling on any given element inside the page header. 

Example of scrollevent configurations:
```json
"page_header": {
	"settings": {
		"scrollEvents": [
			{
				"offset": 100,
				"styles": [
					{
						"selector": ".mainline .row",
						"style": "padding: 4px 0;"
					},
					{
						"selector": ".logo img",
						"style": "width: 90px;"
					}
				]
			}
		]
	}
}
```
Result: After 100px the header and logo will change size.

```json
"page_header": {
	"settings": {
		"scrollEvents": [
			{
				"offset": 24
				"classes": [
					{
						"selector": ".to-be-fixed",
						"class": "grid-fixed"
					}
				]
			}
		]
	}
}
```
Result: After 24 px the element with class to-be-fixed will be fixed, typically mainline should be fixed after scrolling past the topline.