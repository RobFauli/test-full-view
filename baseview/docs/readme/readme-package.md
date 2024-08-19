# package.json

The `package.json`-file defines a build-system for the Sass-files througout the view.
If you maintain your own stylesheets please ignore the file and all Scss-files.

Note: The Scss-files will be maintained by Publish Lab.

If you want to use the build-system for a site you can add a Scss-file for the site in the directory `view/css_scss/site` and run `npm run dachser`. Any modifications to site-files will trigger a build of css-files for each site. The resulting file(s) will be stored in `view/css/site`.
