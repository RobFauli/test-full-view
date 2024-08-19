# Define tools in Labrador settings-pages

This document describes options for Labrador settings-pages `/settings`.

You can let editors override or add to config defined in the view of your installation using tools supplied by Publish Lab.

You define admin-tools for all sites in the file `config/admin/config.json` or site-specific in `config/admin/site/<sitename>/config.json`.
Objects defined in the `pages`-key will be displayed in the menu on the left hand side of the settings-page.

### Structure of each element inside `pages` 
`menuItem` (object) defines the icon in the page-menu on the left hand side of the page.
- `menuItem.title` (string) Title-attribute
- `menuItem.cssClass` (string) CSS-class for the element. Used to display an icon

`editor` (object) defines how to edit data
- `editor.type` Namespaced path to Labrador tool

`data` (object) defines input for the tool. Depends on the tool.

`view` (object) defines resources
- `view.cssFiles` (array) List of css-files to include
- `view.jsFiles` (array) List of javascript-files to include
- `view.title` (string) Text displayed on top of page
- `view.cssClass` (string) CSS-classes to add to page

## Add an external page
You can embed an external url in the settings-page using the tool `LabUtils.Tools.ViewEditor.External`. The embedded page will not interact with Labrador in any way.

### Config-example:
```
{
    "pages": {
        "pl_front": {
            "menuItem": {
                "title": "External page"
            },
            "editor": {
                "type": "LabUtils.Tools.ViewEditor.External"
            },
            "data": {
                "url": "https://labradorcms.com/"
            },
            "view": {
                "title": "External page ...",
                "cssFiles": ["/css/cms/tools/ViewEditor.css"],
                "jsFiles": ["/js/cms/LabUtils/Tools/ViewEditor/External.js"]
            }
        }
    }
}
```

The url of the external page is set in `data.url`.

## Set data for the view to read

From the settings-pages you can store data in `viewConfig`. This data will be available for the view using `Lab.conf.get` in both the editor and front.
If you set data on a path that exists in the view the content will be merged by the following order:
1) viewConfig for site
2) global viewConfig
3) config for site
4) global config

Many sites define the menu displayed in the header of all pages in config like this:
```
{
    "site_config_<sitename>": {
        "topmenu": [
            {
                "title": "News",
                "url": "/News"
            },
            {
                "title": "Sport",
                "url": "/sport"
            },
            {
                "title": "Culture",
                "url": "/Culture"
            }
        ],
        ...
    }
}
```

Using the tool `LabUtils.Tools.ViewEditor.ConfigObjectEditor` you can let editors or journalists edit this themselves.
The tool will let user add, delete and reorder items in an array. The result is available at `Lab.conf.get('topmenu')`.

```
{
    "pages": {
        "topmenu": {
            "menuItem": {
                "title": "Top-menu",
                "cssClass": "lab-icon-unorderedList"
            },
            "editor": {
                "type": "LabUtils.Tools.ViewEditor.ConfigObjectEditor"
            },
            "data": {
                "configObjectName": "viewConfig",
                "path": "config.customer.topmenu",
                "allowSites": true,
                "addable": true,
                "editRaw": true,
                "deletable": false,
                "sortable": true,
                "items": [{
                    "deletable": true,
                    "items": {
                        "title": {
                            "contentType": "text",
                            "defaultValue": "",
                            "label": "Title",
                            "placeholder": "The visible text of the menu-element",
                            "validator": "Lab.Util.String.hasLength"
                        },
                        "url": {
                            "contentType": "text",
                            "defaultValue": "",
                            "label": "url",
                            "placeholder": "//yoursite.com/path/to/page or /path/to/page ...",
                            "validator": "Lab.Util.String.hasLength"
                        },
                        "section": {
                            "contentType": "text",
                            "defaultValue": "",
                            "label": "section",
                            "placeholder": "If the url points to a section-page add it here ..."
                        },
                        "selector": {
                            "contentType": "text",
                            "defaultValue": "",
                            "label": "selector",
                            "placeholder": "Css-classes for the menu-element"
                        }        
                    }
                }]
            },
            "view": {
                "title": "Top-menu",
                "cssFiles": ["/css/cms/tools/ViewEditor.css"],
                "jsFiles": [
                    "/js/cms/LabUtils/Tools/ViewEditor/Store.js",
                    "/js/cms/LabUtils/Tools/ViewEditor/ConfigObjectEditor.js"
                ],
                "cssClass": "common_editor view_editor"
            }
        }
    }
}
```

The following `contentType`-values are supported:
- text
- number
- password
- date
- datetime
- datetime-local
- month
- week
- email
- search
- tel
- time
- url
- checkbox
- textarea
- select
- radio

## Options

The following demonstrates how to set deep paths and use different content-types. Try it yourself to get familiar with it.

```
{
    "pages": {
        "examplepage": {
            "menuItem": {
                "title": "Deep object test",
                "cssClass": "lab-icon-stats"
            },
            "editor": {
                "type": "LabUtils.Tools.ViewEditor.ConfigObjectEditor"
            },
            "data": {
                "configObjectName": "viewConfig",
                "path": "config.customer.example",
                "allowSites": true,
                "addable": false,
                "editRaw": true,
                "label": "Examples for objects, arrays, strings and numbers",
                "description": "This page displays available data- and input-formats. Data is stored on the path 'config.customer.example' and is available using `Lab.conf.get(<path>)`. The value of the string-exampel below is available at `Lab.conf.get('example.string_example')`. If you store data using a site (use select-element on top of page) the site-value will merge/override default value or value from config in the view.",
                "items": {
                    "string_example": {
                        "contentType": "text",
                        "defaultValue": "",
                        "label": "String example",
                        "placeholder": "Placeholder for string_example",
                        "validator": "Lab.Util.String.hasLength"
                    },
                    "object_example": {
                        "addable": false,
                        "label": "Object setting key/value pairs",
                        "description": "Data is set using multiple input-elements like, text-input, number-input, checkboxes, radio-buttons, select-elements and textarea. Each element may define a default value, placeholder, validation and more.",
                        "items": {
                            "number": {
                                "contentType": "number",
                                "defaultValue": "",
                                "label": "A number",
                                "placeholder": "Type a number in range [1000-9999]",
                                "attributes": {
                                    "min": 1000,
                                    "max": 9999
                                }
                            },
                            "select_example": {
                                "contentType": "select",
                                "label": "Select an option",
                                "defaultValue": "option_b",
                                "validator": "Lab.Util.String.hasLength",
                                "options": [
                                    {
                                        "value": "",
                                        "label": "No value"
                                    },
                                    {
                                        "value": "option_a",
                                        "label": "Option A"
                                    },
                                    {
                                        "value": "option_b",
                                        "label": "Option B"
                                    },
                                    {
                                        "value": "option_c",
                                        "label": "Option C"
                                    }
                                ]
                            },
                            "textarea_example": {
                                "contentType": "textarea",
                                "label": "A textarea",
                                "placeholder": "Type long text here ...",
                                "validator": "Lab.Util.String.hasLength",
                                "attributes": {
                                    "class": "my_css_class"
                                }
                            },
                            "radio_example": {
                                "contentType": "radio",
                                "label": "Select radio-button",
                                "defaultValue": "option_b",
                                "validator": "Lab.Util.String.hasLength",
                                "options": [
                                    {
                                        "value": "option_a",
                                        "label": "Option A"
                                    },
                                    {
                                        "value": "option_b",
                                        "label": "Option B"
                                    },
                                    {
                                        "value": "option_c",
                                        "label": "Option C"
                                    }
                                ]
                            },
                            "booleanString_example": {
                                "contentType": "checkbox",
                                "label": "Boolean type string",
                                "onValue": "yes",
                                "offValue": "no"
                            },
                            "boolean_example": {
                                "contentType": "checkbox",
                                "label": "Boolean type"
                            }
                        }
                    },
                    "array_of_strings_test": {
                        "addable": true,
                        "deletable": false,
                        "sortable": true,
                        "label": "Array of objects",
                        "description": "This array is addable, deletable and sortable. Click the plus-icon to add two new empty elements. Click the minus-button to delete. Drag and drop to reorder.",
                        "items": [{
                            "deletable": true,
                            "items": {
                                "string_1": {
                                    "contentType": "text",
                                    "defaultValue": "",
                                    "label": "A string",
                                    "placeholder": "Type string here ...",
                                    "validator": "Lab.Util.String.hasLength"
                                },
                                "string_2": {
                                    "contentType": "url",
                                    "defaultValue": "",
                                    "label": "A url",
                                    "placeholder": "Type url here ...",
                                    "validator": "Lab.Util.UrlValidator.validateUrl"
                                },
                                "number_2": {
                                    "contentType": "number",
                                    "defaultValue": "",
                                    "label": "A number",
                                    "placeholder": "Range: [100-200]",
                                    "attributes": {
                                        "min": 100,
                                        "max": 200
                                    }
                                }       
                            }
                        }]
                    },
                    "array_of_arrays_test": {
                        "addable": true,
                        "sortable": true,
                        "label": "Array of arrays using two schemas to input numbers",
                        "description": "This array is addable, deletable and sortable. Click the plus-icon to add two new empty elements. Click the minus-button to delete. Drag and drop to reorder.",
                        "items": [
                            {
                                "deletable": true,
                                "addable": false,
                                "items": [
                                    {
                                        "contentType": "number",
                                        "label": "Label for number #1",
                                        "placeholder": "Number #1"
                                    },
                                    {
                                        "contentType": "number",
                                        "label": "Label for number #2",
                                        "placeholder": "Number #2"
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            "view": {
                "title": "Example-page",
                "cssFiles": ["/css/cms/tools/ViewEditor.css"],
                "jsFiles": [
                    "/js/cms/LabUtils/Tools/ViewEditor/Store.js",
                    "/js/cms/LabUtils/Tools/ViewEditor/ConfigObjectEditor.js"
                ],
                "cssClass": "common_editor view_editor"
            }
        }
    }
}
```

## Let editors modify colors

Use the tool `ColorEditor` to allow editors to add, remove and modify colors used on the installations.
The defined colors are used to set text-colors and background-colors . Background-colors are also used for border-colors.

### Config-example
File `config/admin/config.json`

```
{
    "pages": {
        "colors": {
            "menuItem": {
                "title": "Colors",
                "cssClass": "lab-icon-color_bucket"
            },
            "data": {},
            "stylesheets": [
                "/view-resources/view/css/colors.css"
            ],
            "editor": {
                "type": "LabUtils.Tools.ViewEditor.ColorEditor"
            },
            "view": {
                "title": "Colors",
                "cssFiles": ["/css/cms/tools/ColorEditor.css"],
                "jsFiles": [
                    "/lib-js/Lab/Util/Store.js",
                    "/js/cms/LabUtils/Tools/ViewEditor/Main.js",
                    "/js/cms/LabUtils/Tools/ViewEditor/Store.js",
                    "/js/cms/LabUtils/Tools/ViewEditor/ColorEditor.js",
                    "/js/cms/LabUtils/Tools/Util/CssGenerator.js",
                    "/js/cms/LabUtils/Tools/Util/ColorEdit.js",
                    "/js/cms/LabUtils/Tools/Util/ColorConversion.js",
                    "/js/cms/LabUtils/Tools/Util/ColorPalette.js"
                ],
                "cssClass": "color_editor"
            },
            "css": {
                "brightnessLimit": {
                    "threshold": 130
                },
                "items": {
                    "background-color": {
                        "mediaQueries": [{
                            "prefix": "",
                            "attributes": null,
                            "applyBrightnessLimit": true
                        },{
                            "prefix": "color_mobile_",
                            "attributes": "(max-width: 1023px)"
                        }]
                    },
                    "border-color": {
                        "mediaQueries": [{
                            "prefix": "border-",
                            "attributes": null,
                            "importantFlag": true
                        },{
                            "prefix": "mobile_border-",
                            "attributes": "(max-width: 1023px)",
                            "importantFlag": true
                        }]
                    },
                    "color": {
                        "mediaQueries": [{
                            "prefix": "",
                            "attributes": null
                        },{
                            "prefix": "color_mobile_",
                            "attributes": "(max-width: 1023px)"
                        }]
                    }
                }
            },
            "permission": "admin_contentboxes"
        }
    }
}
```

The tool prepares compiled CSS from the defined colors. This is available for the view to include in a page-template at `Lab.conf.get('css_build')`.

The config `css` defines how Labrador will create the CSS:

- `brightnessLimit.threshold` defines a value from 0 to 255 where text-color will be set to white. Used to add light text-color for dark background-colors.

- `items` defines attributes to create CSS for. Currently supported: 'background-color', 'border-color' and 'color'. 

Each object contains a `mediaQueries`-array where each member have the following options:
- `attributes` (string) Media-query attributes like "(max-width: 1023px)" to target tablets.
- `prefix` (string) A string prepended to the css-declaration. A color may be defined as 'primary', use 'prefix: 'mobile-' to produse a declaration like 'mobile-primary'.
- `applyBrightnessLimit` (bool) Set "color: white" if the color is below threshold defined in `brightnessLimit.threshold`.
- `importantFlag` (fool) Append "!important" to the declaration.
