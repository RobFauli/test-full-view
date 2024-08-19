## Folder changing article

I this folder we have added template that overrides the default embed template in baseview
```baseview/view/page/article/default/template/embed.template.mustache```

You can either add templates that maps with directory structure in baseview
or you can use the resource map _resources_[sitename].json.

```view/page/article/default/front/default.json```
You can also add other resources. In this example we have change the publish validation
to require for more tags and sections.