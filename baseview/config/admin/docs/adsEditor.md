# Ads editor

On the settings-page of your Labrador-installation you find the tool `Ads` on the url `/settings/cp?page=ads`.

This tool will present a GUI for creating ad units and placing them in predefined placements on a frontpage or article on desktop and mobile.

Note: The tool operate on live data. Any modifications will be visible on the front-servers the next time a page is rendered by Labrador. Be aware that cache may delay the update.

The tool consists of four parts:
1) Site-selector
2) Settings
3) Definition of ad units
4) Placing ad units in predefined placements

## 1) Site selector
The first thing you do is to select the site you want to edit ads for.

Use the select-element on top of the page labelled "Select site". If any data from the view exist for the selected site it will be displayed on the page.

## 2) Settings

In the settings section you can find some general settings to your ads setup. These settings vary dependant on your ads provider.


#### Adnuntius settings: ####

Setting                 | Description
---                     | ---
Label                   | The label shown if "show label" is selected on the ad placement
Use bidding             | Enable bidding. This option requires configuration to your adnuntius setup, <br /> ads.txt file to be added by publish lab and prebid config data added to your <br /> ad units. More information about bidding can be provided by adnuntius.
Lazy load ads           | Enable lazy loading of the ad assets. Only available without bidding.


#### Google ads settings: ####

Setting                 | Description
---                     | ---
Anchored unit - enabled | Enable anchored ad unit
Anchored unit - code    | Your ad manager network code for the anchored unit
Anchored unit - type    | Position of the anchored unit, top or bottom
DFP Id                  | Your ad manager network code
Enable debug mode       | Enabled debugging provided by google ad manager
Lazy load ads           | Enables lazy loading of ad assets
Use bidding             | Enabled bidding. This option requires additiona configuration <br /> to you ad manager setup and by publish lab 

## 3) Ad units
When entering the tool the ad units tab will be selected and you will see all ad units for the selected site if any exists.

To add a new element, click the `Add`-button on bottom of the list. 
To delete an element click the `Delete`-button just below the element.

#### Adnuntius ad unit fields: ####

Label                   | Required  | Description
---                     | ---       | ---
Name                    | Yes       | Name for the ad unit. Don't use spaces.
AU-id                   | Yes       | The ad-id. Supplied by Adnuntius
Width (pixels)          | Yes       | The width. Supplied by Adnuntius
Height (pixels)         | Yes       | The height. Supplied by Adnuntius
Selectable on Front     | No        | Should editors be allowed to manually insert this <br />ad on a front-page?
Selectable on Article   | No        | Should editors be allowed to manually insert this <br />ad on a article-page?
Prebid config           | No        | If bidding is enabled, prebid config data has to be <br /> added to the ad unit. 

#### Google ad unit fields: ####

Label                   | Required  | Description
---                     | ---       | ---
Name                    | Yes       | Name for the ad unit. Don't use spaces.
Code                    | Yes       | The ad unit code supplied by google.
Add sizes as bulk:      | No        | Add sizes as bulk operation instead of manually one <br /> by one
Width/Height            | Yes       | Accepted ad sizes
Selectable on Front     | No        | Should editors be allowed to manually insert this <br />ad on a front-page?
Selectable on Article   | No        | Should editors be allowed to manually insert this <br />ad on a article-page?


TIP: The ad unit name will show in the ad unit dropdown when selecting what ad unit to place in what placement. To use a combination of device, page type (front/article) and placement location in the name is recommended. Example: Desktop_front_topbanner

## 4) Placements
Finally you need to place the ad units in the correct place. Each combination of device and page type has predefined placements that are available in the placement dropdown.

Each placement in the list contains the following elements:

Label                   | Required  | Description
---                     | ---       | ---
Placement               | Yes       | Predefined placement for the combination of <br /> page type and device
Index                   | No        | Sort order (skyscrapers) or index (row, <br />bodytext section, above bodytext heading) for <br /> placement
Ad unit                 | Yes       | What ad unit, created in step 2, to place on <br />the selected placement
Show label              | No        | Show/hide label
Hide placement in editor| No        | Show/hide the placement when editing a <br />frontpage or article
Make placement sticky   | No        | Option for skyscrapers to make the placement, <br />if the last one, sticky when scrolling

To add a new element click on the `Add`-button at the bottom of each section. 
To delete an element click on the `Delete`-button just below the element.

## Debugging
To test the ads you can add `?debug=1` to the url of any page.

If your domain is `example.com` you can test the front-page on the url `https://example.com?debug=1`.
To test for mobile you can add `&lab_viewport=mobile` to the url: `https://example.com?debug=1&lab_viewport=mobile`

The view will display a label above all ads containing the ad unit-name and size (defined in step 2).
