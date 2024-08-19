

var ArticleFormatter = {

    // This method is specified in property "preDrawHandlers" and is run after external call is done and before markup is created.
    // Nice place to modify the external data.
    filterExternalData: function(viewModel) {
        var externalData = viewModel.get("external");
        if (!externalData) return;
        if (!externalData.result) return;
        if (!externalData.result.length) {
            // Use "external.nohits" in template to display a message to user.
            externalData.nohits = true;
            return;
        }
        var dateHander = new Labrador.Date.DateTime();
        var now = new Date().getTime();
        for (var i = 0; i < externalData.result.length; i++) {
            // Create a human readable date from the created-date:
            if (externalData.result[i].created) { // "2016-06-10T14:41:12+02:00"
                var date = new Date(externalData.result[i].created);
                var timestamp = dateHander.toTimestamp(date);
                if (timestamp) externalData.result[i].createdString = dateHander.timestampToNiceDate(timestamp);
            }
            // Create a human readable date from the published-date:
            if (externalData.result[i].published) { // "2016-06-10T14:41:12+02:00"
                var date = new Date(externalData.result[i].published);
                var timestamp = dateHander.toTimestamp(date);
                if (timestamp) {
                    // Check if published ahead:
                    if (now < (timestamp*1000)) {
                        externalData.result[i].publishedAheadString = dateHander.formattedDate(date, "Y.m.d H:i");
                    } else {
                        externalData.result[i].publishedString = dateHander.timestampToNiceDate(timestamp);
                    }
                }
            }
            // Create an array of tags:
            var tagsList = [];
            externalData.result[i].tags.split(",").forEach(function(tag) {
                tagsList.push(tag.trim());
            });
            externalData.result[i].tagsList = tagsList;
            // Set publishhidden to boolean value:
            if (!externalData.result[i].publishhidden || externalData.result[i].publishhidden == "0") {
                externalData.result[i].publishhidden = false;
            } else {
                externalData.result[i].publishhidden = true;
            }
        }
    }
};
