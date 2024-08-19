const FeedFormatterRitzau = {

    // This method is specified in property "preDrawHandlers" and is run after external call is done and before markup is created.
    // Nice place to modify the extarnal data.
    filterExternalData: (viewModel) => {
        var externalData = viewModel.get("external");
        if (!externalData) return;
        if (!externalData.feed) return;
        var dateHander = new Labrador.Date.DateTime();
        for (const item of externalData.feed) {
            // Create a human readable date from the published-date.
            // Note: They use a custom date-format: 'PublishDate: "Date(1691044311087+0200)"'
            if (item.labFrontPublishedDate) {
                //const input = item.labFrontPublishedDate.split('(')[1].split(')')[0].split('+'); // [ 1691044311087, 0200 ]
                item.publishedString = dateHander.timestampToNiceDate(Math.round(item.labFrontPublishedDate));
            }
            // The subtitle sometimes includes p-tags. Remove
            item.labFrontSubtitle = (item.labFrontSubtitle || '').replace('<p>', '').replace('</p>', '').replace('<br />', '');
        }

        var model = Lab.nodeController.getModelByLabId(viewModel.getLabId());
        if (!model) return;

        // Add click-handler for import-button (.import_ntb) after box is drawn.
        // Each article in the list is not a separate model, only markup, so we'll have to use a DOM-query.
        model.addPostInitHandler('.import_ritzau', {
            trigger: ['click'],
            param: null,
            fn: function(params, element) {
                const ritzau_id = element.getAttribute("data-ritzau-id");
                const domElement = document.querySelector(`.ritzau-${ ritzau_id }`);
                if (!domElement || !ritzau_id) {
                    Sys.logger.warn('Cannot find ritzau id or dom-element. Article will not import.');
                    return;
                }
                lab_api.v1.article.ui.import('ritzau', ritzau_id) // sourceName, sourceId, importSettings
            }
        });
    }

};
