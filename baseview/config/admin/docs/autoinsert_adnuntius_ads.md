# Adnuntius-ads

How to programatically insert Adnuntius ads on Labrador-pages using the Dachser view.

On the settings-page of your Labrador-installation you find the tool `Adnuntius ads` on the url `/settings/cp?page=adnuntius`.

This tool will present a GUI for writing config that Dachser uses to programmatically insert ads on your pages.

Note: The tool operate on live data. Any modifications will be visible on the front-servers the next time a page is rendered by Labrador.

The tool consists of three parts:
1) Site-selector
2) Definition of the ad-formats
3) Where to insert ads

## 1) Site selector
The first thing you do is to select the site you want to edit ads for.

Use the select-element on top of the page labelled "Select site". If any data or predefined config from the view exist for the selected site it will be displayed on the page.

## 2) Ad-definitions
The first part of the editor is labelled "Ad-formats". This is a list of all the available ads from Adnuntius.

Contact Adnuntius to get a list of id's and sizes. 

Each ad in the list contains the following elements:

Label                   | Required  | Description
---                     | ---       | ---
Name                    | Yes       | Name for the ad. Used internally. Don't use spaces. You use this name to specify ads to auto-insert
AU-id                   | Yes       | The ad-id. Supplied by Adnuntius
Widtht (pixels)         | Yes       | The width. Supplied by Adnuntius
Height (pixels)         | Yes       | The height. Supplied by Adnuntius
Selectable on Front     | No        | Should editors be allowed to manually insert this ad on a front-page?
Selectable on Article   | No        | Should editors be allowed to manually insert this ad on a article-page?

To add a new element, click the `Add`-button on bottom of the list. 
To delete an element click the `Delete`-button just below the element.

## 3) Where to insert ads
Now you have set up all the ads that you want available in Labrador. Next step is to help Labrador insert them automatically.

The second part of the editor is labelled "Auto-insert ads" and has sections to:
- Insert on front-pages for mobile
- Insert on front-pages for desktop
- Insert on article-pages for mobile
- Insert on article-pages for desktop

Add as many elements (ads) as you like in each section.

To add a new element click on the `Add`-button at the bottom of each section. 
To delete an element click on the `Delete`-button just below the element.

Labrador can insert the ad directly into existing content, like a row on a front-page or a specific position in the bodytext of an article,
or it can insert it in a container. A wallpaper-ad for example that should be displayed on the right or left hand side of a page needs a container to display correctly.
The view uses a container named `adZone`. Select this in the `Content-type` option below.

### When to use a adZone-container
If you want to display an ad relative to editable content (like an article-preview, a row or a position in an article's bodytext) you can skip the container.
If you want to display an ad on top, left hand side or right hand side of the page you must use a container.

### Paths, selectors and reference-types/indexes
Labrador needs to know where to insert content. You can specify a path, a selector or a reference-type and reference-index.

#### Path
A path is an address to editable content on a page. Indexes start at 0, so the first row, for example, has an index of 0.
You can use the Labrador Debugger in the editor to find the path of any content on a page.

Examples:
Path                              | Description
--                                | --
dropZone[0]/row[2]                | Third row on a front-page
dropZone[0]/row[0]/article[0]     | First article (if any) on the first row on a front-page
bodytext[0]                       | Bodytext-element on article-pages. Require `bodyTextIndex`

#### Selector
A selector is a point in the template currently only defined for article-pages:
`placeholder.adZone_1` and `placeholder.adZone_2` can be used to insert content above the main image and title on article-pages.

#### Reference-type and reference-index
On the mobile viewport rows may be irrelevant since each article in a row may display at 100% width.
Visually the third article may be displayed at the third row while it tecnically may belong to the first row.

You can specify a content-type and index to insert ads relative to. For example insert an ad after the second article.

Options for each element:
Label                   | Required  | Description
---                     | ---       | ---
Content-type            | Yes       | See description above
Ad-name                 | Yes (*)   | The name of the ad defined in step 2.
Use Path ...            | Yes (**)  | A path to where the conntent should be inserted
... or Selector         | Yes (**)  | Insert using a selector
Path reference-type     | Yes (**)  | Insert by reference to content-type
Path reference-index    | Yes (**)  | Insert at reference index
CSS                     | No        | CSS-classes
bodyTextIndex           | No        | If path is set to bodytext[0]: Specify the line to insert at
Inline style            | No        | Inline CSS-style
Hide ad in editor       | No        | If checked the add will not be displayed in the editor

Note:
`(*)` Content is only required for the content-type `adnuntiusAd`.
`(**)` A path, selector or reference-type/index is required. Choose one of the three.

For content-type `adZone` one or more children need to be specified:
Label                   | Required  | Description
---                     | ---       | ---
Content-type            | Yes       | Select `AdnuntiusAd`
CSS                     | No        | CSS-classes
Ad-name                 | Yes       | The name of the ad defined in step 2.

To add a new child click on the `Add`-button at the bottom of the children-section. 
To delete an child click on the `Delete`-button just below the child-element.

#### Options for CSS
The value of css-field is printed in the `class` attribute of the element and can be used to define a grid-size and/or a label for the ad. 

Options:
- `large-x` Grid size for desktop where `x` is a number in the range 1-12. 12 represents 100% width. `large-6` will print at 50% width.
- `small-x` Grid size for mobile where `x` is a number in the range 1-12. 12 represents 100% width. `small-6` will print at 50% width.
- `display-label` The label `ANNONSE` will be printed above the ad.

## Examples

### Insert the ad "my_ad" after the first row on a front-page:
```
- Content-type: "adnuntiusAd"
- Ad-name: "my_ad"
- Use Path ...: "dropZone[0]/row[1]"
```

### Insert the ad "my_ad" on top of a front-page:
```
- Content-type: "adZone"
- Use Path ...: "dropZone[0]"
- CSS: "adZone-top"
```
Children
```
- Content-type: "adnuntiusAd"
- Ad-name: "my_ad"
```

### Insert the ad "my_ad" on the right hand side of a front-page:
```
- Content-type: "adZone"
- Use Path ...: "dropZone[0]"
- CSS: "adZone-right"
```
Children
```
- Content-type: "adnuntiusAd"
- Ad-name: "my_ad"
```

### Insert the ad "my_ad" after the second line in the bodytext of an article:
This exampel also sets a inline-width of the element to "600px".
```
- Content-type: "adnuntiusAd"
- Ad-name: "my_ad"
- Use Path ...: "bodytext[0]"
- bodyTextIndex: 2,
- Inline style: "width: 600px"
- CSS: "floatRight display-label"
```

### Insert the ad "my_ad" after the third article on a mobile front-page
```
- Content-type: "adnuntiusAd"
- Ad-name: "my_ad"
- Path reference-type: "article"
- Path reference-index: 3
- CSS: "small-12 display-label"
```

## Debugging
To test the ads you can add `?debug=1` to the url of any page.

If your domain is `example.com` you can test the front-page on the url `https://example.com?debug=1`.
To test for mobile you can add `&lab_viewport=mobile` to the url: `https://example.com?debug=1&lab_viewport=mobile`

The view will display a label above all ads containing the ad-name and size (defined in step 2).
