// Filter articles based on tags
export class Tags {

    constructor({ tagGroups = [] } = {}) {
        // Array of arrays with tags. [[tag1, tag2], [tag3, tag4]]
        // Use OR inside each tag group and AND between them
        // Example above will return articles with tag (tag1 OR tag2) AND (tag3 OR tag4)
        this.tagGroups = Array.isArray(tagGroups) ? tagGroups : [];
    }

    // (ClientData)
    // Input: array of articles
    // Output: array of articles
    map(clientData) {
        const data = clientData.getData();
        if (!Array.isArray(data) || !this.tagGroups.length) {
            return clientData;
        }
        clientData.setData(data.filter((article) => {
            for (const group of this.tagGroups) {
                if (!this.tagGroupMatch(group, article)) {
                    return false;
                }
            }
            return true;
        }));
        return clientData;
    }

    tagGroupMatch(tagGroup, data) {
        if (!tagGroup.length) {
            return true;
        }
        for (const tag of tagGroup) {
            if (data.contentdata.tags.includes(tag)) {
                return true;
            }
        }
        return false;
    }

}
