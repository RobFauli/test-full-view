
var Plugins = Plugins || {};

// Helper for API-requests
// Instance of this class can be used by multiple instances of the plugin Linkpulse to share identical API-calls.
Plugins.LpQuery = function(params) {

    this.url = params.url;
    this.method = params.method || 'GET';
    this.requestCache = {};
    this.openRequests = {};

    this.request = function(requestData, callback, forceReload) {

        if (typeof(callback) !== 'function') {
            Sys.logger.warning('Plugins.LpQuery: No valid callback-method supplied. Request cancelled.');
            return;
        }

        // Lab.Util.Ajax modifies the request data by adding attributes.
        // Remove them before creating hash.
        delete requestData.lab_request_id;
        delete requestData.lockId;

        // Create a hash of the query. Use this to identify it.
        var hash = this.hash(requestData);

        if (forceReload) {
            // Remove cache.
            delete this.requestCache[hash];
        }

        // Check if valid cached result for this request exist:
        if (this.requestCache[hash]) {
            callback(this.requestCache[hash]);
            return;
        }

        var doRequest = false;
        if (!this.openRequests[hash]) {
            this.openRequests[hash] = [];
            doRequest = true;
        }

        // Add callback to this open request.
        this.openRequests[hash].push(callback);

        if (!doRequest) return;

        /**
         * To debug:
         * requestData.debug = true;
         */

        Sys.logger.debug('Plugins.LpQuery: Request, url: ' + this.url + ' method: ' + this.method);
        
        Lab.Util.Ajax.ajax(
            this.method, 
            this.url, 
            requestData,
            function (resp) {
                
                var jsonResp;
                try {
                    jsonResp = JSON.parse(resp);
                }
                catch (e) {
                    Sys.logger.warning('Plugins.LpQuery: Cannot parse response: ' + resp);
                    jsonResp = null;
                }

                // Run all waiting callbacks:
                instance.openRequests[hash].forEach(function(callbackMethod) {
                    callbackMethod(jsonResp);
                });
                
                // Reset queue
                delete instance.openRequests[hash];
                
                // Store result
                instance.requestCache[hash] = jsonResp;
            }
        );
    }

    this.hash = function(data) {
        return Lab.Util.String.hashed(JSON.stringify(data));
    }

    var instance = this;

    return {
        request: function(requestData, callback, forceReload) {
            return instance.request(requestData, callback, forceReload);
        },

        // Debug:
        hash: function(objectData) {
            return instance.hash(objectData);
        }
    }
};
