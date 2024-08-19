/**
 * Group
 * Holds a prompt for one or more fields
 */

import { Field } from './Field.js';

export class Group {

    /*
    {
        "name": "title_subtitle",
        "label": "Title / subtitle",
        "prompt": "Act as a professional reporter working as online frontpage editor. Your goal is to maximize traffic to your story, without producing clickbait. Writing style: {{ style }}. Writing Tone: {{ tone }}. Return a JSON-object with text in same language as input text in this format: { \"title\": \"A highly readable title of the article optimized for teasing visitors to read the article, maximum 8 words\", \"subtitle\": \"One sentence abstract of the article, that works well with the title\" }",
        "active": true,
        "items": [{
            "path": "fields.title",
            "name": "title"
        }, {
            "path": "fields.subtitle",
            "name": "subtitle"
        }]
    }
    */

    constructor(data, getter) {
        this.name = data.name;
        this.label = data.label;
        this.prompt = data.prompt;
        this.showOnPanel = data.showOnPanel;
        this.active = data.active;
        this.fields = (data.fields || []).map((field) => new Field(field, getter(field.path)));
        this.ui = {};
    }

    setKey(key, value) {
        this[key] = value;
    }

}
