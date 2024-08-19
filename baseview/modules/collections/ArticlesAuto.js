export default class {

    constructor(api) {
        this.api = api;
        this.rootModel = this.api.v1.model.query.getRootModel();
        this.pageAutomaticMode = [true, 'true', '1', 1].includes(this.rootModel.get('fields.automatic'));
    }

    onGetData(uiInterface, options) {
        const feeds = this.api.v1.config.get('feeds') || {};
        const imageId = 1018;
        const icon = `https://publishlab.com/pbl2.jpg?v=${ imageId }`;
        const result = Object.keys(feeds).filter((key) => (!(!this.pageAutomaticMode && feeds[key].auto_only === true))).map((key) => ({
            type: 'article',
            contentdata: {
                fields: {
                    title: `Article from feed`,
                    subtitle: `<em>${ feeds[key].display_name }</em>`,
                    feedId: key,
                    isAutomatic: true
                }
            },
            children: [{
                type: 'image',
                contentdata: {
                    fields: {
                        external_id: `lab_head_${ imageId }`,
                        imageurl: icon,
                        source: '_articlefeed'
                    }
                }
            }]
        }));

        if (this.pageAutomaticMode) {
            result.unshift({
                type: 'article',
                contentdata: {
                    fields: {
                        title: `Labrador Tag Feed`,
                        subtitle: 'Automatic article from <em>Labrador Tag Feed</em>',
                        feedId: '_tag',
                        isAutomatic: true
                    }
                },
                children: [{
                    type: 'image',
                    contentdata: {
                        fields: {
                            external_id: `lab_head_${ imageId }`,
                            imageurl: icon,
                            source: '_articlefeed'
                        }
                    }
                }]
            });
        }
        return result;
    }

    onProperties(uiInterface) {
        return {
            css: 'autoarticles'
        };
    }

}
