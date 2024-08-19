/**
 * Adapter for sharing (dashboard-page).
 * 
 */

Lab.Menu.Adapter.sharing = function(properties) {

    Lab.Menu.Adapter.default.call(this, properties);

    this.toString = function() {
        return "Lab.Menu.Adapter.sharing";
    };

    this.menu = null;
    this.formElement = null;
    // this.users = null; // (array) List of users with access to current sharing-settings.
    
    // Store all changes locally. On save: Add to page-node (fields.lab_dashboard_settings_json).
    // Note: To remove elements from an array Labrador needs to know that the object should not be merged.
    // To do this: Add setting: "useReplaceForObjects": ["lab_dashboard_settings_json"] to the page in edit-mode.
    this.sharingSettings = {
        sites: [],
        // permissions: [],
        groups: [],
        is_shared: false
    };

    // Prepare data for the template
    this.getData = function(useCachedData) {
        if (!useCachedData) {
            var pageNode = Lab.nodeController.getPageNode();
            this.sharingSettings = pageNode.get("fields.lab_dashboard_settings_json") || this.sharingSettings;
        }
        var sites = [];
        for (var i in parent.Lab.Cache.sites) {
            var site = parent.Lab.Cache.sites[i];
            sites.push({
                name: site.alias, value: site.id, selected: Lab.Util.Array.inArray(this.sharingSettings.sites, site.id.toString())
            });
        }
        return {
            settings: this.sharingSettings,
            sites: sites,
        };
    };
 
    this.setupEventHandlers = function(menu, markup) {
        this.menu = menu;
        this.formElement = markup.find("form");
        var self = this;
        var pageNode = Lab.nodeController.getPageNode();

        // Add handle for form-submit:
        this.formElement.submit(function(e) {
            
            // Don't submit the form.
            e.preventDefault();

            // Note: To remove elements from an array Labrador needs to know that the object should not be merged.
            // To do this: Add setting: "useReplaceForObjects": ["lab_dashboard_settings_json"] to the page in edit-mode.
            pageNode.set("fields.lab_dashboard_settings_json", self.sharingSettings);
            Lab.appController.save();
            self.menu.appMenu.hide();
        });

        // When input-data change: Set new value on this.sharingSettings.
        // Path is set in name-attribute of input-element.
        this.formElement.find("input").on("change", function(e) {
            var isChecked = $lab(this).is(':checked');
            var value = $lab(this).val();
            var field = $lab(this).attr('name');
            var fieldList = field.split(".");
            if (fieldList.length == 1) {
                Lab.Util.Object.set(field, isChecked, self.sharingSettings);
            } else if (fieldList.length == 2) {
                if (isChecked && !Lab.Util.Array.inArray(self.sharingSettings[fieldList[0]], value)) {
                    self.sharingSettings[fieldList[0]].push(value);
                } else {
                    self.sharingSettings[fieldList[0]] = Lab.Util.Array.removeFromArray(self.sharingSettings[fieldList[0]], value);
                }
            }
            self.menu.reloadWithData(self.getData(true));
        });

        // this.formElement.find("#add-permission-btn").click(function(e) {
        //     Lab.Dialog.modal({
        //         title: "Add Permission",
        //         formSettings: [{
        //             type: "text",
        //             key: "permission",
        //             value: "",
        //             placeholder: "Add new Permission",
        //         }],
        //         message: "Tip: Available permissions are listed on the admin-page.",
        //         callback: function(resp) {
        //             var value = resp.data[0].value || "";
        //             value = value.trim();
        //             if (value) {
        //                 if (!Lab.Util.Array.inArray(self.sharingSettings.permissions, value)) {
        //                     if (!Lab.appController.user.hasPermission(value)) {
        //                         Lab.Dialog.modal({
        //                             title: "Missing Permission",
        //                             message: "You do not have the permission '" + value + "' and will no longer have access to editing this page. ",
        //                             btnTitle: "Cancel",
        //                             secondaryBtnTitle: "Set anyway",
        //                             secondaryBtnCallback: function() {
        //                                 self.sharingSettings.permissions.push(value);
        //                                 self.menu.reloadWithData(self.getData(true));                                        
        //                             }
        //                         })
        //                         return;
        //                     }
        //                     self.sharingSettings.permissions.push(value);
        //                     self.menu.reloadWithData(self.getData(true));
        //                 }
        //             }
        //         }
        //     })
        // });

        this.formElement.find(".labFn-form-reset").click(function(e) {
            // markup.find("form")[0].reset();
            menu.appMenu.hide();
            // self.menu.reloadWithData(self.getData(false));
            // menu.getData(); // Get current data from the node and redraw.
        });

        this.formElement.find("#add-group-btn").click(function(e) {
            Lab.Dialog.modal({
                title: "Add Group",
                formSettings: [{
                    type: "text",
                    key: "group",
                    value: "",
                    placeholder: "Add new Group",
                }],
                message: "Tip: Available groups are listed on the admin-page.",
                callback: function(resp) {
                    var value = resp.data[0].value || "";
                    value = value.trim();
                    if (value) {
                        if (!Lab.Util.Array.inArray(self.sharingSettings.groups, value)) {
                            self.sharingSettings.groups.push(value);
                            self.menu.reloadWithData(self.getData(true));
                        }
                    }
                }
            })
        });
    };
};
