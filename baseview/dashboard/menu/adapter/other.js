/**
 * Adapter for misc contentboxes for My Desk.
 *
 */

Lab.Menu.Adapter.other = function(properties) {

    Lab.Menu.Adapter.default.call(this, properties);

    this.toString = function() {
        return "Lab.Menu.Adapter.other";
    };

    this.getData = function() {

        var contentData = [];

        contentData.push({
            type: "lp_keystats",
            parentStructureType: "contentboxes",
            boxname: "lp_keystats",
            fields: {
                boxTitle: "Analytics - Keystats",
                boxDescription: "Site-statistics: clickratio - pageviews - clicks",
                title: "Keystats"
            }
        });
        contentData.push({
            type: "lp_toppages",
            parentStructureType: "contentboxes",
            boxname: "lp_toppages",
            fields: {
                boxTitle: "Analytics - Toppages",
                boxDescription: "Site-statistics: Pageviews",
                title: "Toppages"
            }
        });
        contentData.push({
            type: "lp_scores",
            parentStructureType: "contentboxes",
            boxname: "lp_scores",
            fields: {
                boxTitle: "Analytics - Scores",
                boxDescription: "Site-statistics: View-time, page-scroll, clickratio",
                title: "Scores"
            }
        });
        return contentData;
    };

    // Convert data to something Labrador can use to generate content.
    this.mapData = function(serverData) {
        return serverData;
    };

};
