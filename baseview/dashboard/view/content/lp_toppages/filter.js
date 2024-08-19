
/**
 * This contentbox requires the plugin Plugins.Linkpulse with the toppages-widget.
 */

Lab.View.Filters.content.lp_toppages = function (viewModel) {

    // For admin-view, range:
    viewModel.setFiltered(
        'rangeList', 
        Dashboard.contentbox.linkpulse.getRangeList(viewModel.get('fields.linkpulse_json.query.range' || 'today'))
    );

    // For admin-view, site
    viewModel.setFiltered(
        'domainList', 
        Dashboard.contentbox.linkpulse.getDomainList(viewModel.get('fields.linkpulse_json.query.domain'))
    );

    // For admin-view, channel:
    viewModel.setFiltered(
        'channelList', 
        Dashboard.contentbox.linkpulse.getChannelList(viewModel.get('fields.linkpulse_json.query.channel') || '')
    );

};
