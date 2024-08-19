## Adding feature flags

Feature flags can be added in a group or standalone. With groups you have the possibility to enable/disable a set of features by enabling or disabling the group itself. The group itself consists of two fields:

Fields           | Description
---              | ---
`Enable`         | Enable or disable all flags in the group
`Name`           | The name of the group (optional)

Feature flags consists of three fields:

Fields           | Description
---              | ---
`Enable`         | Enable or disable the feature flag.
`Feature`        | Predefined feature
`Page id`        | Page id, or node id, to better target where to enable the feature

## Adding features

When adding feature flags you can select features from a predefined list of features. These are defined in `config/admin/featureFlags.json` and can look like this:

```json
{
    "featureFlags": {
        "flags": [
            {
                "key": "feature 1"
            },
            {
                "key": "feature 2"
            }
        ]
    }
}
```

## Using feature flags

The feature flags can be accessed and used through the lab_api with an optional node id. You can check if flag is enabled or access the feature flag directly, without inherited values:

`lab_api.v1.util.featureFlags.enabled('feature 1'); // Check if feature is enabled`
`lab_api.v1.util.featureFlags.enabled('feature 1', '123456'); // Check if feature is enabled for node 123456`
`lab_api.v1.util.featureFlags.enabled('feature 1', '123456'); // Access feature flag for node 123456 directly`