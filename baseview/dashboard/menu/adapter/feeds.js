/**
 * Adapter for feeds for My Desk. (NTB etc)
 *
 */

Lab.Menu.Adapter.feeds = function(properties) {

    Lab.Menu.Adapter.default.call(this, properties);

    this.toString = function() {
        return "Lab.Menu.Adapter.feeds";
    };

    this.getData = function() {

        var contentData = [];

        contentData.push({
            type: "feed_list",
            parentStructureType: "contentboxes",
            boxname: "feed_list",
            fields: {
                boxTitle: "NTB News",
                boxDescription: "Articles from NTB News",
                title: "Articles from NTB",
                source: "ntb",
                page: 0
            }
        });

        contentData.push({
            type: "ritzau",
            parentStructureType: "contentboxes",
            boxname: "ritzau",
            fields: {
                boxTitle: "Ritzau",
                boxDescription: "Articles from Ritzau Bureau",
                title: "Articles from Ritzau",
                source: "ritzau",
                page: 0
            }
        });

        contentData.push({
            type: "tt",
            parentStructureType: "contentboxes",
            boxname: "tt",
            fields: {
                boxTitle: "TT",
                boxDescription: "Articles from TT",
                title: "Articles from TT",
                source: "tt",
                page: 0
            }
        });

        return contentData;
    };

    // Convert data to something Labrador can use to generate content.
    this.mapData = function(serverData) {
        return serverData;
    };
};
