
var Plugins = Plugins || {};
Plugins.LPWidgets = Plugins.LPWidgets || {};

Plugins.LPWidgets.toppages = function() {

    // Keystats needs 2 queries.
    // Display and compare data for 2 periods.
    this.getWidgetQueries = function(nodeData) {
        // Strip protocol from url if exist:
        var domainValue = '';
        if (nodeData.query.domain) {
            var domain = new URL((nodeData.query.domain.indexOf('http') == 0 ? '' : 'https://') + nodeData.query.domain).hostname.replace('www.', ''); // https://www.example.com -> example.com, example.com -> example.com.
            domainValue = '*' + domain;
        }
        var queries = [{
            type: "toppages",
            filter: {
                range: nodeData.query.range || "today",
                channel: nodeData.query.channel || "",
                domain: domainValue,
                // url: 'www-default.localhost/docs'
            }
        }]
        queries = queries.map(function(query) {
            query.endpoint = query.type;
            var queryArray = [];
            for (var key in query.filter) {
                queryArray.push('filter[' + key + ']=' + query.filter[key]);
            }
            query.endpoint += '?' + queryArray.join('&');
            if (nodeData.query.limit) {
                query.endpoint += '&page[limit]=' + nodeData.query.limit;
            }
            return query;
        });
        return queries;
    }

    this.getQueries = function(nodeData) {
        return this.getWidgetQueries(nodeData);
    }

    this.filterResponse = function(data, nodeData) {
        return data[0].result.data;
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
