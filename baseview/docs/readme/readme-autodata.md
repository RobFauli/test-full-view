# Autodata
Define node-data based on config

The goal of this functionality is to remove site-specific code from filters.
In a multi-site installation filters tend to contain lots of if's and else's to set data for a specific site.
Using Autodata some of this code may be moved to config defined per site.

Autodata is run on front and in the editor.
All activity by the autodata-functionality is logged for debugging.

## Config
Config is defined in an object at `autodata.contenttype.<content-type>`. This lets you define data to set based on content-type.
The content-type for page-nodes are prefixed with `page/`. Example: `page/article` or `page/front`.

```
{
    "autodata": {
        "contenttype": {
            "factbox": {
                "definition_1": [ ... ],
                "definition_2": [ ... ]
            }
        }
    }
}
```

Config is defined in an object ("factbox") to make it easier for sub-sites to inherit and override config from a parent-site.
The array at key 'definition_1' above may be overridden by a sub-site.
A parent site may define 'definition_1' and 'definition_2' and a subsite may inherit both and override 'definition_2' for example.

The definition-array contain any number of settings with conditions (optional) and data:
```
[
    {
        "conditions": {
            "rules": [],
            "require": "all"
        },
        "data": []
    }
]
```

### conditions.rules
Key             | Type      | Description
---             | ---       | ---
target        | (string)  | One of 'current', 'root', 'config' or 'cmsConfig'
key           | (string)  | Path to read data from
value         | (string / object) | The value to compare with. May be an object: { target: 'root', key: 'fields.title' }
compare       | (string / object) | How to compare the values. May be an object: { type: 'like', failIf: 'some value' }

### Supported compare-types: 
- `is`
- `isNot`
- `like`
- `notLike`
- `includes`
- `startsWith`
- `endsWith`
- `truthy`
- `falsy`


### Each path to read may be read from:
- current node-model (`current`)
- page-model (`root`)
- cms-config (`cmsConfig`)
- customer-config (`config`)


### data
Key             | Type      | Description
---             | ---       | ---
key           | (string)  | Path to set data for on current model
value         | (string / object) | The value to set. May be an object to read from: { target: 'root', key: 'fields.title' }

Note: When run in the editor all data set on `fields` will be persistently stored if the content-box is saved.
To avoid storing any data persistently you can set a filtered value: `{ "key": "filtered.my_key" }`.
This value is accessible by the filter and template and is non-persistent.

## Examples:

### Set som data:
```
{
    "definition_1": [{
        "data": [
            {
                "key": "filtered.my_title",
                "value": "Auto-title ..."
            }
        ]
    }]
}
```

### Set some data using a value from a getter
```
{
    "definition_2": [{
        "data": [
            {
                "key": "fields.date",
                "value": {
                    "target": "root",
                    "key": "fields.date_created"
                }
            }
        ]
    }]
}
```
The example above sets value of `fields.date` on current contentbox to the date the current page-node was created.

### Set data if all conditions are met
```
{
    "definition_3": [{
        "conditions": {
            "rules": [
                {
                    "target": "current",
                    "key": "fields.title",
                    "value": "abc",
                    "compare": "includes"
                },
                {
                    "target": "config",
                    "key": "site.alias",
                    "value": "journalisten",
                    "compare": "is"
                },
                {
                    "target": "root",
                    "key": "fields.name",
                    "value": "lab3-page-1",
                    "compare": "is"
                }
            ],
            "require": "all"
        },
        "data": [
            {
                "key": "filtered.autotitle",
                "value": "Auto-tittel ..."
            },
            {
                "key": "filtered.autotitle2",
                "value": "Auto-tittel 2 ..."
            }
        ]
    }]
}
```
The 'require'-key can be an integer specifying the number of validated rules required to set data. Default: 'all'.

### Let a rule read data from somewhere else:
```
{
    "definition_4": [{
        "conditions": {
            "rules": [
                {
                    "target": "current",
                    "key": "fields.title",
                    "value": {
                        "target": "root",
                        "key": "fields.subtitle"
                    },
                    "compare": {
                        "type": "startsWith",
                        "failIf": null
                    }
                }
            ]
        },
        "data": [
            {
                "key": "filtered.autotitle",
                "value": "Auto-tittel ..."
            }
        ]
    }]
}
```
Here the rule compares value of 'current.fields.title' with 'root.fields.subtitle'.
Compare-type is set to 'startsWith'. So the rule will be accepted and data set if the title of current content-box starts with the subtitle of the page.

