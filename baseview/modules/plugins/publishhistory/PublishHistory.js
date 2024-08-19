export class PublishHistory {

    constructor(id) {
        this.id = id;
        this.container = null;
    }

    getMarkup(data) {
        return lab_api.v1.util.dom.renderTemplate(`
            <div>
                <p>Publish-history for article #{{ id }} - Created {{ date }} <a class="labicon-startEdit lab-btn" href="/edit/article/id/{{ id }}" target="_blank" style="float: right; margin-top: -0.8em;"> Edit article</a></p>
                <table class="lab-table lab-space-above-large lab-modal-table">
                    <thead>
                        <tr class="publish-marker">
                            <th>Status</th>
                            <th>Publish date</th>
                            <th>Time</th>
                            <th>User name</th>
                            <th>User email</th>
                        </tr>
                    </thead>
                    <tbody>
                    {{ #items }}
                        <tr>
                            <td><span class="lab-label {{ #visible }}published-visible{{ /visible }}{{ ^visible }}published-hidden{{ /visible }}">{{ #visible }}Visible{{ /visible }}{{ ^visible }}Hidden{{ /visible }}</span></td>
                            <td>{{ date }}</td>
                            <td>{{ time }}</td>
                            <td>{{ user.firstname }} {{ user.lastname }}</td>
                            <td><a href="mailto:{{ user.googleid }}">{{ user.googleid }}</a></td>
                        </tr>
                    {{ /items }}
                    </tbody>
                </table>
            </div>
        `, data, true);
    }

    run(container, callback) {
        this.container = container;
        lab_api.v1.util.httpClient.get(`/ajax/node/get-node?id=${ this.id }`, { resetCache: true }).then((resp) => {

            // '[[1,1646861908,"A"],[1,1646907387,"A"],[1,1646915037,"A"]]' [[<user-id>, <timestamp>, <status>], ...]
            const historyString = lab_api.v1.util.defaults.string(lab_api.v1.util.object.get('data.fields.last_published_by', resp));
            if (!historyString) {
                Sys.logger.debug(`[PublishHistory] No history found for node #${ this.id }.`);
                return;
            }
            const history = JSON.parse(historyString).reverse();
            const userIds = [...new Set(history.map((item) => item[0]))];

            lab_api.v1.util.httpClient.get(`/ajax/user/get-users-by-ids?ids=${ userIds.join(',') }`).then((users) => {
                this.draw(resp.data, history, users);
                callback();
            }).catch((error) => {
                console.log('Error fetching users: ', error);
            });

        }).catch((error) => {
            console.log('Error fetching node: ', error);
        });

    }

    draw(data, history, users) {
        const usersObj = {};
        for (const user of users) {
            usersObj[user.userid] = user;
        }
        const items = history.map((item) => ({
            user: usersObj[item[0]],
            date: this.formatTimestamp(item[1], true, false),
            time: this.formatTimestamp(item[1], false, true),
            status: item[2],
            visible: item[2] === 'A' || item[2] === 'P'
        }));
        const markup = this.getMarkup({
            id: data.id,
            date: this.formatTimestamp(data.fields.created),
            items
        });
        this.container.appendChild(markup);
    }

    // Todo: Use a general method for this
    formatTimestamp(timestamp, displayDate = true, displayTime = true) {
        const d = new Date(timestamp * 1000);
        if (displayDate && displayTime) {
            return `${ d.toLocaleDateString() } - ${ d.toLocaleTimeString() }`;
        }
        return displayDate ? d.toLocaleDateString() : d.toLocaleTimeString();
    }

}
