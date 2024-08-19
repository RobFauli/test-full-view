/**
 * Shared adapter functionality..
 *
 * ...
 * 
 */


Lab.Menu.Adapter.default = function(properties) {

    // console.log("Lab.Menu.Adapter.default: %o", properties);

    this.toString = function() {
        return "Lab.Menu.Adapter.default";
    };

    this.properties = properties;
    this.appMenu = properties.appMenu;

    this.getTemplate = function(template) {
        return typeof(Lab.templates[template]) === "undefined" ? (typeof(Lab.cmsTemplates[template]) === "undefined" ? null : Lab.cmsTemplates[template]) : Lab.templates[template];
    };

    /**
     * Methods available for subclasses to override
     */

    this.setupEventHandlers = function(menu, markup) {};
    
    this.resolveBaseUrl = function(key) {};

    this.preGuiEventHandler = function(element) {};
    this.postGuiEventHandler = function(element) {};

    // An item is created. In this methos it is possible to modify markup or event-handling.
    this.itemIsCreated = function(structureModel) {};

    // All items are now created as children of supplied structureModel.
    this.itemsAreCreated = function(structureModel) {};

    // Notification sent to adapter after the menu has become visible.
    this.menuIsDisplayed = function(menu) {};
    
    this.menuIsHidden = function(menu) {};

    this.getPreGuiData = function() { return null; };
    this.getPostGuiData = function() { return null; };

    this.reset = function() {};

    // this.menuIsCreated = function(structureModel) {};

    /**
     * Methods required by subclasses 
     */

    // Set pager params so that next call to getUrl() will return correct url
    this.nextPage = function() {
        Sys.logger.error("The adapter '" + this + "' is missing method nextPage.");
    };
    
    // Set pager params so that next call to getUrl() will return correct url
    this.previousPage = function() {
        Sys.logger.error("The adapter '" + this + "' is missing method previousPage.");
    };

    // Return url to be used to get data.
    this.getUrl = function() {
        Sys.logger.error("The adapter '" + this + "' is missing method getUrl.");
    };

    // Convert data to something Labrador can use to generate content.
    this.mapData = function(serverData) {
        Sys.logger.error("The adapter '" + this + "' is missing method mapData.");
    };

};

