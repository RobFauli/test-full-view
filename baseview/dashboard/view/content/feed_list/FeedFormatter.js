

var FeedFormatter = {

    // This method is specified in property "preDrawHandlers" and is run after external call is done and before markup is created.
    // Nice place to modify the extarnal data.
    filterExternalData: function(viewModel) {
        var externalData = viewModel.get("external");
        if (!externalData) return;
        if (!externalData.data) return;
        var dateHander = new Labrador.Date.DateTime();
        for (var i = 0; i < externalData.data.length; i++) {
            // Create a human readable date from the created-date:
            if (externalData.data[i].time) { // "2016-06-10T14:41:12+02:00"
                var date = new Date(externalData.data[i].time);
                var timestamp = dateHander.toTimestamp(date);
                if (timestamp) externalData.data[i].timeString = dateHander.timestampToNiceDate(timestamp);
            }
        }

        var model = Lab.nodeController.getModelByLabId(viewModel.getLabId());
        if (!model) return;

        // Add click-handler for import-button (.import_ntb) after box is drawn.
        // Each article in the list is not a separate model, only markup, so we'll have to use a DOM-query.
        model.addPostInitHandler('.import_ntb', {
            trigger: ['click'],
            param: null,
            fn: function(params, element) {

                // Define strings to strip from imported NTB-feed.
                // If NTB modifies the return format, update these settings to reflect changes.
                var importSettings = {
                    strip: [
                        ' class="lead" lede="true"', // <p class="txt-ind" lede="true">xxx</p> => <p>xxx</p>
                        ' class="txt-ind"',          // <p class="txt-ind">xxx</p> => <p>xxx</p>
                        ' class="txt"',              // <p class="txt">xxx</p> => <p>xxx</p>
                        ' class="hl2"'               // <div class="hl2">xxx</div> => <div>xxx</div>
                    ]
                };

                var ntb_id = element.getAttribute("data-ntb-id");
                parent.Lab.windowController.importFeedArticle(null, null, "ntb", ntb_id, importSettings);
                // lab_api.v1.article.ui.import("ntb", ntb_id, importSettings);
            }
        });

    }
};
