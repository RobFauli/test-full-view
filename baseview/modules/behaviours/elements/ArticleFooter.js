export default class ArticleFooter {

    constructor(api) {
        this.api = api;
        this.ignoredTags = this.api.v1.config.get('page_settings.article.ignoredTags') || [];
        this.ignoredTagPrefix = this.api.v1.config.get('page_settings.article.ignoredTagPrefix') || [];
        this.adminIgnoredTags = !this.api.v1.config.get('showHiddenTagsOnArticle') ? (this.api.v1.config.get('tagsToHide') || '').split(',').map((tag) => tag.trim()) : [];
    }

    onRender(model, view) {
        const allIgnoredTags = [...new Set([...this.ignoredTags, ...this.adminIgnoredTags])];

        const tags = (this.api.v1.model.query.getRootModel().get('tags') || []).filter((tag) => !allIgnoredTags.includes(tag)).filter((tag) => {
            for (const prefix of this.ignoredTagPrefix) {
                if (tag.startsWith(prefix)) {
                    return false;
                }
            }
            return true;
        });
        model.setFiltered('tags', tags);
        model.setFiltered('tagPagePath', this.api.v1.config.get('tagPagePath') || '/tag/');
    }

}
