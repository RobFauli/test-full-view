
var Plugins = Plugins || {};
Plugins.LPWidgets = Plugins.LPWidgets || {};

Plugins.LPWidgets.scores = function() {

    this.getWidgetQueries = function(nodeData) {

        // Strip protocol from url if exist:
        var domainValue = '';
        if (nodeData.query.domain) {
            var domain = new URL((nodeData.query.domain.indexOf('http') == 0 ? '' : 'https://') + nodeData.query.domain).hostname.replace('www.', ''); // https://www.example.com -> example.com, example.com -> example.com.
            domainValue = '*' + domain;
        }

        var queries = [{
            type: "scores",
            filter: {
                range: nodeData.query.range || "today",
                domain: domainValue,
                // url: 'www-default.localhost/docs'
            },
            field: nodeData.query.field,
        }];
        for (var key in nodeData.query.weight) {
            queries[0].filter[key] = nodeData.query.weight[key];
        }

        queries = queries.map(function(query) {
            query.endpoint = query.type;
            var queryArray = [];
            for (var key in query.filter) {
                if (query.filter[key]) {
                    queryArray.push('filter[' + key + ']=' + query.filter[key]);
                }
            }
            for (var key in query.field) {
                if (query.field[key] == 'on') {
                    queryArray.push('field[' + key + ']=' + query.field[key]);
                }
            }
            delete query.filter;
            delete query.field;
            query.endpoint += '?' + queryArray.join('&');
            return query;
        });
        return queries;
    }

    this.getQueries = function(nodeData) {
        return this.getWidgetQueries(nodeData);
    }

    this.filterResponse = function(data, nodeData) {
        var result = [];
        var resultData = data[0].result.data || [];
        // Hm. If only one result, data is an object not an array ...
        if (resultData.attributes) resultData = [resultData];
        var headers = [];
        resultData.forEach(function(res) {
            var item = {};
            item.url = res.attributes.url;
            item.clickratio = res.attributes.clickratio;
            item.clicks = res.attributes.clicks;
            item.score_total = res.attributes.score_total;
            item.scores = [];
            for (var key in nodeData.query.field) {
                if (nodeData.query.field[key] !== 'on') continue;
                item.scores.push({
                    key: key,
                    value: res.attributes[key] == null ? '--' : res.attributes[key]
                })
            }
            result.push(item);
        })
        var headerFormatter = this.headerFormatter;
        for (var key in nodeData.query.field) {
            if (nodeData.query.field[key] !== 'on') continue;
            headers.push(
                headerFormatter(key)
            );
        }
        return {
            headers: headers,
            data: result
        }
    }

    this.headerFormatter = function(key){
        var short = '--';
        var long = '--';
        switch (key) {
            case "score_pageviews":
                long = "pageviews";
                short = "PV";
                break;
            case "score_viewtime":
                long = "viewtime";
                short = "VT";
                break;
            case "score_external":
                long = "external";
                short = "EX";
                break;
            case "score_quickexit":
                long = "quickexit";
                short = "QU";
                break;
            case "score_elements":
                long = "elements";
                short = "EL";
                break;
            case "score_maxscroll":
                long = "maxscroll";
                short = "MS";
                break;
            case "score_clickratio":
                long = "clickratio";
                short = "CR";
                break;
            case "score_articlescroll":
                long = "articlescroll";
                short = "AS";
                break;
            default:
                break;
        }
        return {
            short: short,
            long: long
        }
    }

    // (array) Return settings used to initialize Plugins.LpChart.
    this.getChartSettings = function(data) {
        return null;
    }

    this.didDrawNotification = function(element) {
        return null;
    }

    var instance = this;

    return {
        getQueries: function(data) {
            return instance.getQueries(data);
        },
        filterResponse: function(data, nodeData) {
            return instance.filterResponse(data, nodeData);
        },
        getChartSettings: function(data) {
            return instance.getChartSettings(data);
        },
        didDrawNotification: function(element) {
            return instance.didDrawNotification(element);
        },
    }
};
