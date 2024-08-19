
Lab.View.Filters.content.tt = function (viewModel) {

    // Paging.
    // Menu sets boolean "filtered.previous_page" and "filtered.next_page" on the node (non-persistent, outside "fields")
    // Use these flags to determin paging. Reset after read.
    var page = viewModel.get("filtered.page") || 0;
    page = parseInt(page, 10);
    var limit = viewModel.get("fields.limit") || 5;
    limit = parseInt(limit, 10);

    // For admin-view and box-title: Site-list
    var currentSiteId = viewModel.get("fields.site_id") || 0;

    currentSiteId = parseInt(currentSiteId, 10);
    var sites = [];

    var currentSiteAlias = '';
    var siteArr = Lab.conf.getSites();
    for (var i in siteArr) {
        var site = siteArr[i];
        if(currentSiteId === site.id){
            currentSiteAlias = site.alias;
        }
        if(site.is_default){
            var defaultSite = site;
        }
        sites.push({
            name: site.alias, value: site.id, selected: currentSiteId === site.id
        });
    }

    if(currentSiteAlias == ''){
        currentSiteAlias = defaultSite.alias;
    }
    viewModel.setFiltered("site_id_list", sites);
    viewModel.setFiltered('site_alias', currentSiteAlias);

    var previous_page = viewModel.get("filtered.previous_page");
    viewModel.setFiltered("previous_page", false);

    var next_page = viewModel.get("filtered.next_page");
    viewModel.setFiltered("next_page", false);

    if (previous_page) {
        page -= limit;
    }

    if (next_page) {
        page += limit;
    }

    if (page < 0) page = 0;

    viewModel.setFiltered("page", page);
    viewModel.setFiltered("limit", limit);
    viewModel.setFiltered("siteId", currentSiteId);
    viewModel.setFiltered("pageNumber", (page / limit) + 1);
    
};