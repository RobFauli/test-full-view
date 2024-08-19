
/**
 * This contentbox requires the plugin Plugins.Linkpulse with the scores-widget.
 */

Lab.View.Filters.content.lp_scores = function (viewModel) {

    // For admin-view, range:
    viewModel.setFiltered(
        'rangeList', 
        Dashboard.contentbox.linkpulse.getRangeList(viewModel.get('fields.linkpulse_json.query.range' || 'today'))
    );

    // For admin-view, scores
    viewModel.setFiltered(
        "scoreWeightList", 
        Dashboard.contentbox.linkpulse.getScoreWeightList(viewModel.get('fields.linkpulse_json.query') || {})
    );

    // For admin-view, site
    viewModel.setFiltered(
        "domainList", 
        Dashboard.contentbox.linkpulse.getDomainList(viewModel.get("fields.linkpulse_json.query.domain"))
    );
};
