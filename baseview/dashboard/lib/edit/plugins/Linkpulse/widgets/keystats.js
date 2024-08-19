
var Plugins = Plugins || {};
Plugins.LPWidgets = Plugins.LPWidgets || {};

Plugins.LPWidgets.keystats = function() {

    // Keystats needs 2 queries.
    // Display and compare data for 2 periods.
    // Note: Linkpulse API fails when using "toSite" or "toDomain", try "domain" or "site".
    this.getWidgetQueries = function(nodeData) {
        
        // Strip protocol from url if exist:
        var domainValue = '';
        if (nodeData.query.domain) {
            var domain = new URL((nodeData.query.domain.indexOf('http') == 0 ? '' : 'https://') + nodeData.query.domain).hostname.replace('www.', ''); // https://www.example.com -> example.com, example.com -> example.com.
            domainValue = '*' + domain;
        }
        var queries = [{
            type: "keystats",
            filter: {
                range: nodeData.query.range || "today",
                domain: domainValue,
                channel: nodeData.query.channel || "",
            }
        }, {
            type: "keystats",
            filter: {
                range: nodeData.query.compareRange || "yesterday",
                domain: domainValue,
                channel: nodeData.query.channel || "",
            }
        }]
        queries = queries.map(function(query) {
            query.endpoint = query.type;
            var queryArray = [];
            for (var key in query.filter) {
                queryArray.push('filter[' + key + ']=' + query.filter[key]);
            }
            query.endpoint += '?' + queryArray.join('&');
            return query;
        });
        return queries;
    }

    this.getQueries = function(nodeData) {
        return this.getWidgetQueries(nodeData);
    }

    // (int) Retun interval for new requests. Milliseconds.
    // This widget uses two requests
    this.getAutoUpdateInterval = function(nodeData) {
        var intervals = [];
        var rangeMap = {
            '1min':     60,     // 1 min
            '5min':     60,     // 1 min
            '15min':    120,    // 2 min
            'hour':     300,    // 5 min
            'today':    600,    // 10 min
        }
        if (rangeMap[nodeData.query.range]) {
            intervals.push(rangeMap[nodeData.query.range]);
        }
        if (rangeMap[nodeData.query.compareRange]) {
            intervals.push(rangeMap[nodeData.query.compareRange]);
        }
        // Return smallest member of 'intervals'
        return intervals.length ? Math.min.apply( Math, intervals ) * 1000 : null;
    }

    this.filterResponse = function(data, nodeData) {
        // field: 'clickratio', 'clicks', 'pageviews'
        var field = nodeData.chart || 'clickratio';
        var result = {
            type: data[0].type,
            field:field,
            current: {
                clickratio: data[0].result.data ? data[0].result.data.attributes[field] : 0,
                clicks: data[0].result.data ? data[0].result.data.attributes.clicks : 0,
                pageviews: data[0].result.data ? data[0].result.data.attributes.pageviews : 0,
                range: data[0].filter.range,
            },
            reference: {
                clickratio: data[1].result.data ? data[1].result.data.attributes[field] : 0,
                clicks: data[1].result.data ? data[1].result.data.attributes.clicks : 0,
                pageviews: data[1].result.data ? data[1].result.data.attributes.pageviews : 0,
                range: data[1].filter.range,
            }
        }
        var largeCr, smallCr, percentCrDiff, currentCrWin = result.current[field] > result.reference[field];
        if (currentCrWin) {
            largeCr = result.current[field];
            smallCr = result.reference[field];
        } else {
            largeCr = result.reference[field];
            smallCr = result.current[field];
        }
        percentCrDiff = (smallCr / largeCr) * 100;
        result.summary = {
            currentPercent: parseFloat((currentCrWin ? 100 : percentCrDiff).toFixed(2)),
            referencePercent: parseFloat((currentCrWin ? percentCrDiff : 100).toFixed(2)),
            diffPercent: parseFloat((100 - percentCrDiff).toFixed(2)),
            diffPercentPrefix: currentCrWin ? '+' : '-',
            status: currentCrWin ? (percentCrDiff > 5 ? "good" : "neutral") : (percentCrDiff > 5 ? "bad" : "neutral") // good, neutral, bad
        }
        return result;
    }

    // (array) Return settings used to initialize Plugins.LpChart.
    this.getChartSettings = function(data) {
        // dasharray: 2 * pi * r
        var radius = {
            outer: 90,
            inner: 82
        }
        var dashArray = {
            outer: parseFloat((radius.outer * 2 * Math.PI).toFixed(4)),
            inner: parseFloat((radius.inner * 2 * Math.PI).toFixed(4)),
        }
        return {
            type: 'keystats',
            svg: {
                width: 200,
                outerCircle: {
                    cx: 100,
                    cy: 100,
                    r: radius.outer,
                    dasharray: dashArray.outer, // 2 * pi * r
                    dashoffset: dashArray.outer - (dashArray.outer / 100) * data.summary.currentPercent,
                    winner: data.summary.currentPercent >= data.summary.referencePercent
                }, 
                innerCircle: {
                    cx: 100,
                    cy: 100,
                    r: radius.inner,
                    dasharray: dashArray.inner,
                    dashoffset: dashArray.inner - (dashArray.inner / 100) * data.summary.referencePercent,
                    winner: data.summary.currentPercent < data.summary.referencePercent
                }
            }
        }
    }

    this.didDrawNotification = function(element) {
        var animate = function(svgCircle) {
            if (!svgCircle) return;
            var strokeDashoffset = svgCircle.style.strokeDashoffset;
            var strokeDasharray = svgCircle.style.strokeDasharray;
            svgCircle.style.strokeDashoffset = svgCircle.style.strokeDasharray;
            window.setTimeout(function() {
                svgCircle.style.strokeDashoffset = strokeDashoffset;
            }, 200);
        };
        animate(element.querySelector('circle.inner'));
        animate(element.querySelector('circle.outer'));
    }

    var instance = this;

    return {
        getQueries: function(data) {
            return instance.getQueries(data);
        },
        getAutoUpdateInterval: function(nodeData) {
            return instance.getAutoUpdateInterval(nodeData);
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
