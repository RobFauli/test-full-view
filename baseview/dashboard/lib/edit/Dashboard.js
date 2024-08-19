// Dashboard.js

function labradorEventsReady(dispatcher) {

}

var Dashboard = {

    contentbox: {
        linkpulse: {
            ranges: ['1min', '5min', '15min', 'hour', 'today', 'yesterday', 'week', 'lastweek', 'month', 'lastmonth'],
            scores: ['score_pageviews', 'score_viewtime', 'score_external', 'score_quickexit', 'score_elements', 'score_maxscroll', 'score_clickratio', 'score_articlescroll'],
            weights: ['score_pageviews_weight', 'score_viewtime_weight', 'score_external_weight', 'score_quickexit_weight', 'score_elements_weight', 'score_maxscroll_weight', 'score_clickratio_weight', 'score_articlescroll_weight'],
            getDomainList: function(domainValue) {
                // For admin-view, site
                var sites = Lab.conf.getSites();
                var domainList = [];
                sites.forEach(function(site) {
                    if (site.domain) {
                        var domain = new URL((site.domain.indexOf('http') == 0 ? '' : 'https://') + site.domain).hostname.replace('www.', '');
                        domainList.push({
                            value: site.domain,
                            name: domain,
                            selected: site.domain == domainValue
                        })
                    }
                });
                return domainList;
            },
            getChannelList: function(channelValue) {
                var channelTypes = ['desktop', 'tablet', 'mobile'];
                var channelList = [{
                    value: '',
                    name: 'all',
                }];
                channelTypes.forEach(function(channel) {
                    channelList.push({
                        value: channel,
                        name: channel,
                        selected: channel == channelValue
                    })
                });
                return channelList;
            },
            getRangeList: function(rangeValue) {
                var rangeList = [];
                this.ranges.forEach(function(range) {
                    rangeList.push({
                        value: range,
                        selected: range == rangeValue
                    })
                });
                return rangeList;
            },
            getScoreWeightList: function(query) {
                if (!query.field) query.field = {};
                if (!query.weight) query.weight = {};
                var scoreWeightList = [];
                for (var i = 0; i < this.scores.length; i++) {
                    scoreWeightList.push({
                        scoreKey: this.scores[i].replace('score_', ''),
                        weightKey: this.weights[i],
                        scoreValue: query.field[this.scores[i]] == 'on' ? true : false,
                        weightValue: query.weight[this.weights[i]] || '',
                        scoreField: 'fields.linkpulse_json.query.field.' + this.scores[i],
                        weightField: 'fields.linkpulse_json.query.weight.' + this.weights[i]
                    });
                }
                return scoreWeightList;
            },
            getChartList: function(chartValue) {
                var chartTypes = ['clickratio', 'pageviews', 'clicks'];
                var chartList = [];
                chartTypes.forEach(function(chart) {
                    chartList.push({
                        value: chart,
                        selected: chart == chartValue
                    })
                });
                return chartList;
            }
        }
    },

    // Search Labrador-articles.
    // Dashboard.search is set as a callback in the launchMapper for a search-button and hotkey ("S")
    // Perform search by creating a content-box of type "article_list" (as used on Dashboard).
    // Setup the box to display articles based on search-params. 
    // Let user drag and drop the result-list onto the page.
    search: function() {

        var sectionList = Lab.conf.get("tags.section");
        var sectionQuery = [
            {
                value: "",
                key: "All Sections"
            }
        ];
        for (var i = 0; i < sectionList.length; i++) {
            var value = "section:" + sectionList[i] + " AND";
            sectionQuery.push({ "value": value, "key": sectionList[i] });
        }

        var visibilityStatusQuery = [
            {
                value: "",
                key: "Any status"
            },
            {
                value: "visibility_status:P AND",
                key: "Published visible"
            },
            {
                value: "visibility_status:H AND",
                key: "Published hidden"
            },
            {
                value: "(visibility_status:H OR visibility_status:P) AND",
                key: "Published visible or hidden"
            },
            {
                value: "NOT visibility_status:P AND",
                key: "Unpublished or Published hidden"
            },
            {
                value: "NOT visibility_status:H AND NOT visibility_status:P AND",
                key: "Unpublished"
            }
        ];

        var dialog = Lab.Dialog.modal({
            title: " ",
            informalText: LabMain.appController.userEditableState ? "Tip: If you want to store the results simply drag them onto the page." : "",
            btnTitle: "Search",
            secondaryBtnTitle: " ",
            status: "article_search",
            target: $lab("iframe.labFn-viewport-frame").contents().find("#lab-modalContainer"), // $lab("#lab-modalContainer"),
            formSettings: [
                {
                    key: "query",
                    placeholder: "Search title, subtitle, bodytext or ID",
                    type: "text",
                }, {
                    type: "button",
                    title: "More options",
                    cssClass: "options_btn",
                    clickHandler: function(element, settings) {
                        dialog.toggleClass('expanded');
                    }
                }, {
                    type: "text",
                    key: "author",
                    placeholder: "Search by author",
                    cssClass: "expanded_search",
                    label: "Author"
                }, {
                    type: "select",
                    key: "section",
                    optionList: sectionQuery,
                    cssClass: "expanded_search",
                    label: "Section"
                }, {
                    type: "text",
                    key: "tag",
                    placeholder: "Search by tag",
                    cssClass: "expanded_search",
                    label: "Tag"
                }, {
                    type: "select",
                    key: "status",
                    optionList: visibilityStatusQuery,
                    cssClass: "expanded_search",
                    label: "Status"
                }
            ],
            disableKeyEvents: true,
            callback: function(resp) {
                if (!resp.data) return;
                var searchParams = {
                    query: "",
                    author: "",
                    section: "",
                    tag: "",
                    status: ""
                }
                var hasQuery = false;
                resp.data.forEach(function(r) {
                    if (r.key && r.value && typeof(searchParams[r.key] !== "undefined")) {
                        searchParams[r.key] = r.value;
                        hasQuery = true;
                    }
                });
                if (hasQuery) {
                    window.setTimeout(function() {
                        Dashboard.doSearch(searchParams);
                    }, 10);
                }
            }
        });
    },

    doSearch: function(searchParams) {
        var pageNode = LabMain.nodeController.getPageNode();
        var modelType = "article_list";
        var structureModel = LabMain.structureController.modelForType(modelType, {type: modelType, width:100, metadata: {lock: false }}, "structure", null);
        structureModel.isPseudoModel = true;
        var contentData = {
            type: modelType,
            fields: {
                limit: 20,
                textSearch: searchParams.query,
                author: searchParams.author,
                sectionQuery: searchParams.section,
                tagSearch: searchParams.tag,
                visibilityStatusQuery: searchParams.status,
                title: 'Search results',
                site_id: "",
                userQuery: ""
            },
        };
        var nodeModel = LabMain.nodeController.modelForType(contentData.type, contentData, "content", "search");
        structureModel.setNodeModel(nodeModel);
        LabMain.structureController.defaultInit(structureModel);
        
        var markup = $lab('<section style="overflow: auto; height: 100%; padding: 2em 0 0; margin-bottom: 2em; box-sizing: border-box;"></section>');
        var row = $lab('<div class="row grid search" style="max-width: 50em; margin: 0 auto 2em; "></div>');
        row.click(function(e) {
            e.stopPropagation();
        });

        markup.append(row);
        row.append(structureModel.markup);
        LabMain.Adapter.AjaxAdapterData.runQueue();

        LabMain.appController.displayModal({
            hideKeys: [27], // 13 = enter, 27 = escape
            id: 123,
            allowMenus: false,
            mainWindow: false,
            setHeight: true
        });
        LabMain.appController.modalWindow.handler.getContainer().append(markup);
    }
}
