/**
 * Linkpulse
 * See readme.md for documentation.
 */

var Plugins = Plugins || {};

Plugins.Linkpulse = function(params) {

    this.nodeModel = params.nodeModel;
    this.structureModel = params.structureModel;
    this.isActive = false;
    this.servicePath = params.settings.servicePath;
    this.templateRenderer = params.templateRenderer;
    this.getTemplate = params.getTemplate; // function
    this.pluginContent = null;
    this.queryField = params.settings.queryField;    
    this.widget = {
        type: null,
        handler: null
    };
    this.autoUpdateIntervalId = null;

    var instance = this;

    this.init = function(params) {

        if (!this.servicePath) {
            Sys.logger.warn('Plugins.Linkpulse: Missing param "servicePath". Cannot access the API. Exiting.');
            return;
        }

        var settings = this.getModelQueryField();
        this.widget.type = settings.type;
        if (typeof(Plugins.LPWidgets[this.widget.type]) == 'function') {
            this.widget.handler = new Plugins.LPWidgets[this.widget.type]();
        }
        if (!this.widget.handler) {
            Sys.logger.warning('Plugins.Linkpulse: Widget-handler is missing for type (' + this.widget.type + ')');
            return;
        }

        this.pluginContent = document.createElement('div');
        this.pluginContent.className = 'linkpulse-plugin';
        this.appendPluginGui();

        /**
         * Add stylesheet
         */
        params.loader.addCss('/view-resources/dashboard/lib/edit/plugins/Linkpulse/Linkpulse.css');

        /**
         * Several instances of this plugin may exist on a page.
         * Use a shared instance of Plugins.LpQuery to handle API-calls
         */
        params.loader.addJs('/view-resources/dashboard/lib/edit/plugins/Linkpulse/LpQuery.js', function(addedPath) {
            if (!Plugins.LpQueryInstance) {
                Plugins.LpQueryInstance = new Plugins.LpQuery({
                    url: '/ajax/integration/get-collection?_service=' + instance.servicePath
                });
            }
            instance.fetchData();
        });
    }

    this.fetchData = function(clearCache) {
        if (!Plugins.LpQueryInstance) return;
        var nodeData = this.getModelQueryField();
        var queries = this.getQuery(nodeData);
        this.setupAutoUpdate(nodeData);
        queries.forEach(function(query) {
            query.result = null;
            Plugins.LpQueryInstance.request(query, function(resp) {
                query.result = resp;
                // Check if all requests has returned
                if (queries.filter(function(q) {
                    return q.result ? true : false;
                }).length == queries.length) {
                    instance.responseHandler(queries);
                }
            }, clearCache);
        });
    }

    this.responseHandler = function(data) {
        var filteredWidgetData = this.widget.handler.filterResponse(data, this.getModelQueryField());
        this.draw({
            widget: filteredWidgetData,
            plugin: {
                type: data[0].type,
            },
            id: this.nodeModel.get('id'),
            chart: this.widget.handler.getChartSettings(filteredWidgetData),
            view: this.getViewHelpers(),
        });
    }

    this.setupAutoUpdate = function(nodeData) {
        // Check if widget require auto-updates
        if (typeof(this.widget.handler.getAutoUpdateInterval) == 'function') {
            var interval = this.widget.handler.getAutoUpdateInterval(nodeData);
            if (interval) {
                this.startAutoUpdate(interval);
                return;
            }
        }
        this.stopAutoUpdate();
    }

    this.startAutoUpdate = function(delay) {
        this.stopAutoUpdate();
        this.autoUpdateIntervalId = window.setInterval(function() {
            instance.fetchData(true);
        }, delay);
    }

    this.stopAutoUpdate = function() {
        if (this.autoUpdateIntervalId) {
            window.clearInterval(this.autoUpdateIntervalId);
        }
    }

    this.getViewHelpers = function() {
        return {
            numFormatter: function() {
                return function(text, render) {
                    return instance.viewHelpers.numFormatter(parseFloat(render(text)), 1);
                }
            }
        }
    }

    this.viewHelpers = {
        numFormatter(num, digits) {
            var si = [
                { value: 1E18, symbol: "E" },
                { value: 1E15, symbol: "P" },
                { value: 1E12, symbol: "T" },
                { value: 1E9,  symbol: "G" },
                { value: 1E6,  symbol: "M" },
                { value: 1E3,  symbol: "k" }
            ], rx = /\.0+$|(\.[0-9]*[1-9])0+$/, i;
            for (i = 0; i < si.length; i++) {
                if (num >= si[i].value) {
                    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
                }
            }
            return num.toFixed(digits).replace(rx, "$1");
        }
    }

    this.getQuery = function(nodeData) {
        return this.widget.handler.getQueries(nodeData);
    }

    this.getModelQueryField = function() {
        return this.nodeModel.get(this.queryField);
    }

    this.draw = function(data) {
        var template = this.getTemplate('plugin_support/Linkpulse/' + data.plugin.type);
        if (!template) {
            Sys.logger.warn('Plugins.Linkpulse: Cannot get template for type "' + data.plugin.type + '".');
            return;
        }
        this.pluginContent.innerHTML = this.templateRenderer(
            template, 
            data
        );
        this.widget.handler.didDrawNotification(this.pluginContent);
    }

    this.appendPluginGui = function() {
        if (!this.pluginContent) {
            Sys.logger.warn('Plugins.Linkpulse: Plugin is not set up properly. Cannot draw.');
            return;
        }
        var container = this.structureModel.markup.get(0).querySelector(params.settings.containerSelector);
        if (!container) {
            Sys.logger.warn('Plugins.Linkpulse: Cannot find container to draw in. Check param "containerSelector".');
            return;
        }
        container.appendChild(this.pluginContent);
    }

    this.start = function() {
        this.isActive = true;
    }

    this.stop = function() {
        this.isActive = false;
        this.stopAutoUpdate();
    }

    this.remove = function() {
        this.stop();
    }

    this.modelDidRedraw = function() {
        this.appendPluginGui();
        this.fetchData();
    }

    this.init(params);

    return {
        // Required method for Labrador-plugins:
        start: function() {
            instance.start();
        },
        // Required method for Labrador-plugins:
        stop: function() {
            instance.stop();
        },
        // Required method for Labrador-plugins:
        remove: function() {
            instance.remove();
        },
        // (bool) Required method for Labrador-plugins:
        isActive: function() {
            return instance.isActive;
        },
        // The StructureModel this instance is attached to has been redrawn
        didRedraw: function() {
            instance.modelDidRedraw();
        }
    }
}
