
Lab.View.Filters.content.article_list = function (viewModel) {

    // For admin-view, author:
    var userQueryValue = viewModel.get("fields.userQuery") || "";
    var userQuery = [
        {
            value: "",
            text: "Any user"
        },
        {
            value: "(has_published:me OR created_by:me) AND",
            text: "Current user"
        }
    ];
    userQuery.forEach(function(item) {
        item.selected = item.value == userQueryValue;
    });
    viewModel.setFiltered("userQuery", userQuery);

    // For admin-view, published-status
    var visibilityStatusValue = viewModel.get("fields.visibilityStatusQuery") || "";
    var visibilityStatusQuery = [
        {
            value: "",
            text: "Any status"
        },
        {
            value: "visibility_status:P AND",
            text: "Published visible"
        },
        {
            value: "visibility_status:H AND",
            text: "Published hidden"
        },
        {
            value: "(visibility_status:H OR visibility_status:P) AND",
            text: "Published visible or hidden"
        },
        {
            value: "NOT visibility_status:P AND",
            text: "Unpublished or Published hidden"
        },
        {
            value: "NOT visibility_status:H AND NOT visibility_status:P AND",
            text: "Unpublished"
        }
    ];
    visibilityStatusQuery.forEach(function(item) {
        item.selected = item.value == visibilityStatusValue;
    });
    viewModel.setFiltered("visibilityStatusQuery", visibilityStatusQuery);

    // For admin-view, section
    var sectionValue = viewModel.get("fields.sectionQuery") || "";
    var sectionList = Lab.conf.get("tags.section");
    var sectionQuery = [
        {
            value: "",
            text: "All"
        }
    ];
    for (var i = 0; i < sectionList.length; i++) {
        var value = "section:" + sectionList[i] + " AND";
        sectionQuery.push({ "value": value, "text": sectionList[i], "selected": value == sectionValue });
    }
    viewModel.setFiltered("sectionQuery", sectionQuery);

    // For admin-view: Site-list
    // Todo: parent.Lab.Cache.sites may not be available on page draw ...
    var currentSiteId = viewModel.get("fields.site_id") || 0;
    currentSiteId = parseInt(currentSiteId, 10);
    var sites = [{
        name: "Any site",
        id: 0,
        selected: false
    }];
    for (var i in parent.Lab.Cache.sites) {
        var site = parent.Lab.Cache.sites[i];
        sites.push({
            name: site.alias, value: site.id, selected: currentSiteId === site.id
        });
    }
    viewModel.setFiltered("site_id_list", sites);


    // Text-search
    var textSearch = viewModel.get("fields.textSearch");
    if (textSearch) {
        if (Lab.Util.String.isNumeric(textSearch)) { // ID-search
            viewModel.setFiltered("textSearch", "(id:(" + textSearch + ")) AND");
        } else {
            viewModel.setFiltered("textSearch", "(title:(" + textSearch + ") OR subtitle:(" + textSearch + ") OR bodytext:(" + textSearch + ")) AND");
        }
    } else {
        viewModel.setFiltered("textSearch", "");
    }

    // Only display "approved" articles. (fields.lab_approved = true)
    const approvedOptions = [{
        value: '',
        text: 'Any status'
    }, {
        value: '1',
        text: 'Only approved'
    }, {
        value: '0',
        text: 'Only unapproved'
    }];
    var approved = viewModel.get("fields.approved");
    if (approved === '1') {
        viewModel.setFiltered("approved", "lab_approved:1 AND");
        approvedOptions[1].selected = true;
    } else if (approved === '0') {
        viewModel.setFiltered("approved", "NOT lab_approved:1 AND");
        approvedOptions[2].selected = true;
    } else {
        viewModel.setFiltered("approved", "");
        approvedOptions[0].selected = true;
    }
    viewModel.setFiltered("approvedOptions", approvedOptions);

    // Tag-search
    var tagSearch = viewModel.get("fields.tagSearch");
    if (tagSearch) {
        tagSearch = tagSearch.replace(/,/g, ' ');
        viewModel.setFiltered("tagSearch", "tag:(" + tagSearch + ") AND");
    } else {
        viewModel.setFiltered("tagSearch", "");
    }

    // Author-search
    var author = viewModel.get("fields.author");
    if (author) {
        viewModel.setFiltered("author", "created_by_name:" + author + " AND");
    } else {
        viewModel.setFiltered("author", "");
    }

    // Get image-server:
    viewModel.setFiltered("image_server", Lab.conf.getConfig("image_server"));

    // Get front-server:
    viewModel.setFiltered("customer_front_url", Lab.conf.getConfig("customer_front_url"));

    // Allow copying of articles?
    viewModel.setFiltered("showCopyButton", Lab.conf.get("showDashboardCopyButton"));

    // Paging.
    // Menu sets boolean "filtered.previous_page" and "filtered.next_page" on the node (non-persistent, outside "fields")
    // Use these flags to determin paging. Reset after read.
    var page = viewModel.get("filtered.page") || 0;
    page = parseInt(page, 10);
    var limit = viewModel.get("fields.limit") || 5;
    limit = parseInt(limit, 10);

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
    viewModel.setFiltered("pageNumber", (page / limit) + 1);

    // Sorting:
    viewModel.setFiltered("sortOrder", viewModel.getStructureModel().get("sortOrder") || "desc"); // asc, desc
    viewModel.setFiltered("sortOrderBy", viewModel.getStructureModel().get("sortOrderBy") || "created"); // created, published, modified
    
};
