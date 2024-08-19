# Set data when content is added to a page in the editor

Using the structure-property `childAddedHandlers` the Baseview can read config and use it to modify data for content dropped onto a page in the editor.
This allows you to automatically set metadata and node-data for new content.

Ulike [autodata](readme-autodata.md) this functionality is only run in the editor.

### Usecase: Scrollbox
The scrollbox lets editors add a collection of article-teasers. The examples below shows how to automatically set metadata and node-data for added article-teasers and images resulting in a consistent design for the teasers.

File `view/structure/scrollbox/edit_properties.json`:
```
{
    "childAddedHandlers": {
        "articleSettings": "ViewSupport.edit.updateConfiguredDataForAddedChild"
    }
}
```

The settings above will trigger the method `ViewSupport.edit.updateConfiguredDataForAddedChild` every time content is added to a `scrollbox`.

The method reads config `contentbox_settings.scrollbox.dataForAddedChild.<added-content-type>`.

The config may look like this (`config/presentation/config.json`):
```
{
    "contentbox_settings": {
        "scrollbox": {
            "dataForAddedChild": {
                "article": {
                    "metadata": {
                        "floatingTitle": true,
                        "floatingSubtitle": true,
                        "floatingKicker": true,
                        "hidesubtitle": true,
                        "floatingTextSubset": true,
                        "floatingTextStyle": "bg-white"
                    },
                    "contentdata": {
                        "fields.displayByline": false
                    },
                    "children": {
                        "image": {
                            "contentdata": {
                                "fields.whRatio": "1.0",
                                "fields.bbRatio": "0.4",
                                "fields.viewports_json.mobile.fields.whRatio": "0.6"
                            }
                        }
                    }
                }
            },
            ...
        },
        ...
    },
    ...
}
```

The above config will set data for `article`-boxes added to the `scrollbox`. If the article contains an image it will also set aspect-ratio and width.
All of the modified data is editable in the editor, but this functionality automates it.

Define `childAddedHandlers`-properties for any othe content-type where you will use this functionality and add config for it.