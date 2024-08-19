/**
 * Adapter for article_list-contentboxes for My Desk.
 *
 */

Lab.Menu.Adapter.contentbox = function(properties) {

    Lab.Menu.Adapter.default.call(this, properties);

    this.toString = function() {
        return "Lab.Menu.Adapter.contentbox";
    };

    this.contentData = null;
    this.filterQuery = "";
    this.lastFilterQuery = "";
    this.searchField = null;
    this.displayAll = false;
    this.querySettings = {
        visibility_status: {
            hidden: "visibility_status:H AND",
            visible: "visibility_status:P AND",
            published: "(visibility_status:H OR visibility_status:P) AND",
            unpublished: "NOT visibility_status:P AND",
        },
        author: {
            mine: "(has_published:me OR created_by:me) AND"
        },
        approved: "lab_approved:1 AND"
    };

    // Get data for contentboxes.
    // Pupulate som boxes of type "article_list" with query-settings.
    // All boxes may change this in the settings-panel when dragged onto the page.
    this.getData = function() {

        // Note: If you need to restrict contentboxes to user-permissions or sites you can check current user.
        // 
        // Check for specific permission:
        // (bool) Lab.appController.user.hasPermission("edit_article")
        // 
        // Check if user is part of a specific group:
        // (bool) Lab.appController.user.hasGroup("journalist")
        // 
        // Check if user has access to a specific site:
        // (bool) Lab.appController.user.hasSite("name_of_site")
        // 
        // Get a list of all permissions for user:
        // (array) Lab.appController.user.getPermissions()
        // 
        // Get a list of all sites user has access to:
        // (array) Lab.appController.user.getSites()

        var contentData = [];

        // Display non-published articles with approved-flag.
        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "Unpublished - Approved",
                title: "Unpublished - Approved",
                approved: true,
                visibilityStatusQuery: this.querySettings.visibility_status.unpublished,
                userQuery: this.querySettings.approved
            }
        });

        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "My articles - All",
                title: "My articles - All",
                userQuery: this.querySettings.author.mine
            }
        });

        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "My articles - Visible",
                title: "My articles - Visible",
                visibilityStatusQuery: this.querySettings.visibility_status.visible,
                userQuery: this.querySettings.author.mine
            }
        });

        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "My articles - Hidden",
                title: "My articles - Hidden",
                visibilityStatusQuery: this.querySettings.visibility_status.hidden,
                userQuery: this.querySettings.author.mine
            }
        });

        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "All articles - Published",
                title: "All sections - Published",
                visibilityStatusQuery: this.querySettings.visibility_status.published
            }
        });

        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "All articles - Visible",
                title: "All sections - Visible",
                visibilityStatusQuery: this.querySettings.visibility_status.visible
            }
        });

        contentData.push({
            type: "article_list",
            parentStructureType: "contentboxes",
            boxname: "article_list",
            fields: {
                boxTitle: "All articles - Hidden",
                title: "All sections - Hidden",
                visibilityStatusQuery: this.querySettings.visibility_status.hidden
            }
        });

        // Add by sections
        var sectionList = Lab.conf.get("tags.section");
        for (var i = 0; i < sectionList.length; i++) {
            contentData.push({
                type: "article_list",
                parentStructureType: "contentboxes",
                boxname: "article_list",
                fields: {
                    boxTitle: sectionList[i] + " - All",
                    title: sectionList[i] + " - All",
                    sectionQuery: "section:" + sectionList[i] + " AND"
                }
            });
            contentData.push({
                type: "article_list",
                parentStructureType: "contentboxes",
                boxname: "article_list",
                fields: {
                    boxTitle: sectionList[i] + " - Visible",
                    title: sectionList[i] + " - Published",
                    sectionQuery: "section:" + sectionList[i] + " AND",
                    visibilityStatusQuery: this.querySettings.visibility_status.visible
                }
            });
        }

        return contentData;
    };

    // Convert data to something Labrador can use to generate content.
    this.mapData = function(serverData) {
        if (!this.contentData) this.contentData = serverData;
        return serverData;
    };

    this.itemIsCreated = function(structureModel) {
        var visibility_status = structureModel.nodeModel.get('fields.visibilityStatusQuery');        
        var vs = "A";
        if (visibility_status == this.querySettings.visibility_status.hidden) vs = "H";
        if (visibility_status == this.querySettings.visibility_status.visible) vs = "P";
        if (visibility_status == this.querySettings.visibility_status.published) vs = "PH";
        if (visibility_status == this.querySettings.visibility_status.unpublished) vs = "U";
        structureModel.markup.attr("data-visibility-status", vs);
    };

    this.filterResults = function(filterQuery) {
        this.appMenu.getSubmenuByIdentifier("submenu_contentboxes").reloadWithData(
            this.filterDataByQuery(this.contentData, filterQuery)
        );
    };

    this.filterDataByQuery = function(inputData, query) {
        var result = [];
        for (var i=0; i<inputData.length; i++) {
            if (inputData[i].fields.boxTitle.toLowerCase().indexOf(query.toLowerCase()) > -1 || inputData[i].boxname.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                result.push(inputData[i]);
            }
        }
        return result;
    };

    // element is a form with image-search.
    this.preGuiEventHandler = function(element) {
        var self = this;
        this.searchField = element.find('#lab-contentbox-search-field');
        this.searchField.on("change keyup paste", function(){
            self.filterQuery = $lab.trim($lab(this).val());
            if (self.filterQuery === "") {
                self.displayAll = true; // Search in hidden boxes as well.
            }
            if (self.filterQuery !== self.lastFilterQuery) {
                self.filterResults(self.filterQuery);
                self.lastFilterQuery = self.filterQuery;
            }
        });

        // Do nothing on submit except prevent posting.
        // Input field change triggers filtering of result list.
        element.submit(function(e) {
            e.stopPropagation();
            e.preventDefault();
        });

    };

    // Notification sent to adapter after the menu has become visible.
    this.menuIsDisplayed = function(menu) {
        
        // If displayed modal: Focus search field:
        if (!menu.appMenu.createDocked) {
            this.searchField.val("").focus();
        }
    };
};
