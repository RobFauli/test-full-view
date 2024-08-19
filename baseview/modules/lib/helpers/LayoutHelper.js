export class LayoutHelper {

    static textElements(view, isEditor) {
        const layout = {
            top: [],
            floating: [],
            bottom: [],
            positions: {
                kicker: ''
            }
        };

        if (view.get('metadata.showKicker') && (isEditor || (!!view.get('fields.kicker') || !!view.get('fields.origin_data_json.teaserKicker') || !!view.get('fields.origin_data_json.kicker')))) {
            if (view.get('metadata.floatingKicker')) {
                layout.floating.push('kicker');
                layout.positions.kicker = 'floating';
            } else if (!view.get('metadata.kickerBelowImage')) {
                layout.top.push('kicker');
                layout.positions.kicker = 'above';
            } else {
                layout.bottom.push('kicker');
                layout.positions.kicker = 'below';
            }
        }
        if (!view.get('metadata.hideTitle') && (isEditor || !!view.get('fields.title'))) {
            if (view.get('metadata.floatingTitle')) {
                layout.floating.push('title');
            } else if (view.get('metadata.titleAboveImage')) {
                layout.top.push('title');
            } else {
                layout.bottom.push('title');
            }
        }
        if (!view.get('metadata.hidesubtitle') && (isEditor || (!!view.get('fields.subtitle') || !!view.get('fields.origin_data_json.teaserSubtitle')))) {
            if (view.get('metadata.floatingSubtitle')) {
                layout.floating.push('subtitle');
            } else if (view.get('metadata.subtitleAboveImage')) {
                layout.top.push('subtitle');
            } else {
                layout.bottom.push('subtitle');
            }

        }
        return layout;
    }

}
