
/**
 * This contentbox requires the plugin Plugins.Linkpulse with the keystats-widget.
 */

Lab.View.Filters.content.lp_keystats = function (viewModel) {

    // For admin-view, range:
    viewModel.setFiltered(
        'rangeList', 
        Dashboard.contentbox.linkpulse.getRangeList(viewModel.get('fields.linkpulse_json.query.range' || 'today'))
    );

    // For admin-view, compareRange:
    viewModel.setFiltered(
        'compareRangeList', 
        Dashboard.contentbox.linkpulse.getRangeList(viewModel.get('fields.linkpulse_json.query.compareRange' || 'yesterday'))
    );

    // For admin-view, chart:
    viewModel.setFiltered(
        "chartList", 
        Dashboard.contentbox.linkpulse.getChartList(viewModel.get("fields.linkpulse_json.chart") || "clickratio")
    );

    // For admin-view, site
    viewModel.setFiltered(
        "domainList", 
        Dashboard.contentbox.linkpulse.getDomainList(viewModel.get("fields.linkpulse_json.query.domain"))
    );

    // For admin-view, channel:
    viewModel.setFiltered(
        'channelList', 
        Dashboard.contentbox.linkpulse.getChannelList(viewModel.get('fields.linkpulse_json.query.channel') || '')
    );

};
