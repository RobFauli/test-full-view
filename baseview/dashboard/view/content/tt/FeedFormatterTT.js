const FeedFormatterTT = {

    // This method is specified in property "preDrawHandlers" and is run after external call is done and before markup is created.
    // Nice place to modify the extarnal data.
    filterExternalData: (viewModel) => {
        var externalData = viewModel.get("external");
        if (!externalData) return;
        if (!externalData.feed) return;
        var dateHandler = new Labrador.Date.DateTime();
        for (const item of externalData.feed) {
            if (item.labFrontPublishedDate) {
                item.publishedString = dateHandler.timestampToNiceDate(Math.round(item.labFrontPublishedDate));
            }
        }

        var model = Lab.nodeController.getModelByLabId(viewModel.getLabId());
        if (!model) return;

        // Add click-handler for import-button (.import_ntb) after box is drawn.
        // Each article in the list is not a separate model, only markup, so we'll have to use a DOM-query.
        model.addPostInitHandler('.import_tt', {
            trigger: ['click'],
            param: null,
            fn: function(params, element) {
                const tt_id = element.getAttribute("data-tt-id");
                const domElement = document.querySelector(`.tt-${ tt_id }`);
                if (!domElement || !tt_id) {
                    Sys.logger.warn('Cannot find tt id or dom-element. Article will not import.');
                    return;
                }
                lab_api.v1.article.ui.import('tt', tt_id) // sourceName, sourceId, importSettings
            }
        });
    }

};