export class ExportMailmojo {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = this.api.v1.user.hasPermission('admin_mailmojo');
        this.newsletterListUrl = '/ajax/integration-services/proxy/newsletter/mailmojo/api-proxy/?embedUserData&resourcePath=/lists';
        this.segmentListUrl = '/ajax/integration-services/proxy/newsletter/mailmojo/api-proxy/?embedUserData&resourcePath=/lists/';
        this.template = `
            <div class="lab-modal-form lab-grid lab-hidden">
                <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none lab-bordered">
                    <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-medium lab-space-above-none">Send this frontpage as a newsletter</h2>
                    <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-inline">
                        <a href="" class="lab-btn" target="_blank" id="mailmojo-login">Log in</a>
                    </div>
                    <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-inline">
                        <input type="button" value="Refresh newsletter list" id="mailmojo-refresh">
                        <input type="button" value="Logout from Mailmojo" id="mailmojo-logout" style="margin-left:1em">
                    </div>
                    <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-hidden" data-require-logn="1">
                        <label for="lab-newsletter-select">Newsletter</label>
                        <div data-placeholder="lab-newsletter-select">
                            -- <!-- Element replaced by onMarkup -->
                        </div>
                    </div>
                    <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-hidden" data-require-logn="1">
                        <label for="lab-segment-select">Segment</label>
                        <div data-placeholder="lab-segment-select">
                            <select></select> <!-- Element replaced by onMarkup -->
                        </div>
                    </div>
                </div>
                
                <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none lab-space-below-none lab-hidden" data-require-logn="1">
                    <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                        <label for="lab-newsletter-subject">Newsletter subject</label>
                        <input type="text" id="lab-newsletter-subject" value="" placeholder="Email subject ...">
                    </div>
                    <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                        <label for="lab-newsletter-datetime">Published date and time</label>
                        <input type="datetime-local" id="lab-newsletter-datetime" value="">
                    </div>
                </div>
                
                <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none lab-hidden" data-require-logn="1">
                    <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-align-right">
                        <p id="lab-newsletter-info" class="lab-align-left">&nbsp;</p>
                        <a href="" target="_blank" class="lab-btn" id="lab-newsletter-preview-btn">Preview newsletter</a>
                        <input class="lab-btn" type="button" value="Send newsletter" id="lab-sendnewsletter-btn">
                    </div>
                </div>
            </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Export',
            label: 'Mailmojo newsletter'
        };
    }

    onPaths() {}

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                name: this.rootModel.get('fields.name')
            }
        }, true);

        const refreshBtn = markup.querySelector('#mailmojo-refresh');
        refreshBtn.addEventListener('click', (event) => {
            this.getNewsletterList(this.newsletterListUrl, markup);
        }, false);

        const logoutBtn = markup.querySelector('#mailmojo-logout');
        logoutBtn.addEventListener('click', (event) => {
            this.logout(markup);
        }, false);

        const sendBtn = markup.querySelector('#lab-sendnewsletter-btn');
        sendBtn.addEventListener('click', (event) => {

            event.preventDefault();
            const elements = {
                segmentIds: markup.querySelector('#lab-segment-select'),
                newsletterId: markup.querySelector('#lab-newsletter-select'),
                subject: markup.querySelector('#lab-newsletter-subject'),
                sendTime: markup.querySelector('#lab-newsletter-datetime')
            };
            if (!elements.segmentIds) { return; }

            const { frontpageurl } = this.api.v1.pages.front.getData();

            const subject = elements.subject.value.trim();
            const newsletterId = elements.newsletterId.value;
            const segmentIds = this.getMultiValue(elements.segmentIds);
            const sendTime = elements.sendTime.value;

            if (!subject) { elements.subject.parentElement.classList.add('lab-validation-error'); return; }
            elements.subject.parentElement.classList.remove('lab-validation-error');
            if (!sendTime) { elements.sendTime.parentElement.classList.add('lab-validation-error'); return; }
            elements.sendTime.parentElement.classList.remove('lab-validation-error');
            if (!newsletterId) { elements.newsletterId.parentElement.classList.add('lab-validation-error'); return; }
            elements.newsletterId.parentElement.classList.remove('lab-validation-error');
            if (!segmentIds) { elements.segmentIds.parentElement.classList.add('lab-validation-error'); return; }
            elements.segmentIds.parentElement.classList.remove('lab-validation-error');

            // toISOString: 2019-11-25T12:28 (GMT+0100) -> 2019-11-25T11:28:00.000Z
            const sendTimeIso = new Date(sendTime).toISOString();
            const timestamp = new Date().getTime();
            const html_url = `${ frontpageurl }?lab_viewport=mailmojo&v=${ timestamp }`;

            const createObj = {
                subject,
                html_url,
                list_id: newsletterId
            };

            // segments or all?
            if (segmentIds.indexOf('all') === -1) {
                createObj.segment_ids = segmentIds;
            }

            const sendObj = {
                send_date: sendTimeIso
            };

            markup.querySelector('#lab-newsletter-info').innerHTML = 'Sending newsletter ...';
            const url = '/ajax/integration-services/proxy/newsletter/mailmojo/create-send-newsletter/?embedUserData';

            sendBtn.setAttribute('disabled', 'disabled');
            this.api.v1.util.httpClient.request(
                url,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        create: createObj,
                        send: sendObj
                    })
                }
            ).then((resp) => {
                if (resp && resp.errors) {
                    markup.querySelector('#lab-newsletter-info').innerHTML = '<span style="color: red;">Something went wrong, check console.</span>';
                    console.log(resp);
                    return;
                }
                markup.querySelector('#lab-newsletter-info').innerHTML = 'Newsletter sent!';
            }).catch((resp) => {
                markup.querySelector('#lab-newsletter-info').innerHTML = '<span style="color: red;">Something went wrong, check console.</span>';
                console.log(resp);
            });
        }, false);

        return markup;
    }

    displayLogin(url, markup) {
        const loginBtn = markup.querySelector('#mailmojo-login');
        loginBtn.setAttribute('href', url);
        loginBtn.parentElement.classList.remove('lab-hidden');
        for (const el of markup.querySelectorAll('[data-require-logn="1"]')) {
            el.classList.add('lab-hidden');
        }
    }

    displayForm(markup) {
        const loginBtn = markup.querySelector('#mailmojo-login');
        loginBtn.parentElement.classList.add('lab-hidden');
        for (const el of markup.querySelectorAll('[data-require-logn="1"]')) {
            el.classList.remove('lab-hidden');
        }
    }

    onDisplayed(markup) {
        this.getNewsletterList(this.newsletterListUrl, markup);
        const previewLinkEl = markup.querySelector('#lab-newsletter-preview-btn');
        const { frontpageurl } = this.api.v1.pages.front.getData();
        previewLinkEl.setAttribute('href', `${ frontpageurl }?lab_viewport=mailmojo`);
    }

    logout(markup) {
        this.api.v1.util.httpClient.get('/ajax/integration-services/proxy/newsletter/mailmojo/delete-user-tokens/', { resetCache: true, type: 'text' }).then(() => {
            this.getNewsletterList(this.newsletterListUrl, markup);
        }).catch((error) => {
            console.log('error: ', error);
        });
    }

    getNewsletterList(url, markup) {
        this.api.v1.util.httpClient.get(url, { resetCache: true }).then((resp) => {
            if (Array.isArray(resp)) {
                this.createNewsletterList(resp, markup);
                return;
            }
            if (resp.authorize_uri) {
                this.displayLogin(resp.authorize_uri, markup);
            }
        }).catch((error) => {
            console.log('error: ', error);
        });
    }

    createNewsletterList(newsletters, markup) {
        const sorted = newsletters.sort((a, b) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            // eslint-disable-next-line no-nested-ternary
            return (aName > bName) ? 1 : ((bName > aName) ? -1 : 0);
        });

        this.displayForm(markup);

        const selectPlaceholder = markup.querySelector('[data-placeholder="lab-newsletter-select"]') || markup.querySelector('#lab-newsletter-select');
        const selectElement = this.api.v1.ui.element.getSelectElement({
            value: '',
            options: sorted.map((item) => ({ value: item.id, label: item.name })),
            attributes: [{
                name: 'id', value: 'lab-newsletter-select'
            }]
        });
        selectElement.addEventListener('change', (event) => {
            const { value } = event.target;
            this.getSegmentList(value, markup);
        }, false);
        selectPlaceholder.parentNode.replaceChild(selectElement, selectPlaceholder);
        if (selectElement.options.length && selectElement.options[0].value) {
            this.getSegmentList(selectElement.options[0].value, markup);
        }
    }

    getSegmentList(newsletterId, markup) {
        this.api.v1.util.httpClient.get(this.segmentListUrl + newsletterId, { resetCache: true }).then((resp) => {
            if (Array.isArray(resp.segments)) {
                this.createSegmentList(resp.segments, markup);
                return;
            }
            if (resp.authorize_uri) {
                this.displayLogin(resp.authorize_uri, markup);
            }
        }).catch((error) => {
            console.log('error: ', error);
        });
    }

    createSegmentList(segments, markup) {

        const selectElement = this.api.v1.ui.element.getSelectElement({
            value: 'all',
            options: [{ value: 'all', label: 'Entire list' }].concat(segments.map((item) => ({ value: item.id, label: item.name }))),
            attributes: [{
                name: 'id', value: 'lab-segment-select'
            }, {
                name: 'multiple'
            }, {
                name: 'style', value: 'height: auto;'
            }]
        });
        selectElement.setAttribute('multiple', 'multiple');
        const current = markup.querySelector('[data-placeholder="lab-segment-select"]') || markup.querySelector('#lab-segment-select');
        current.parentNode.replaceChild(selectElement, current);
    }

    openAuthentication(url) {
        this.api.v1.app.gotoUrl(url, true);
    }

    // (array)
    getMultiValue(selectElement) {
        return [...selectElement.options].filter((option) => option.selected).map((option) => option.value);
    }

}
