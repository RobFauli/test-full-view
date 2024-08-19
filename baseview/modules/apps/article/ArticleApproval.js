export class ArticleApproval {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.hasPermission = this.api.v1.user.hasPermission('admin_status');
        this.dom = {
            btnApprove: null,
            btnRevoke: null,
            timestamp: null
        };
        this.approvedData = {};
        this.getState();
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-large">Approval</h2>
                <div class="lab-formgroup-item lab-grid-large-12">
                    <p id="lbl-timestamp">--</p>
                    <input type="button" id="btn-approve" value="Approve">
                    <input type="button" id="btn-revoke" value="Revoke">
                </div>
            </div>
            <div class="lab-formgroup lab-grid" id="article-sharing-token-access">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-large">Article access link</h2>
                <div class="lab-formgroup-item lab-grid-large-12 sharing-link-container">
                    <p>Use this link to give access to the article without publishing it:</p>
                    <span id="article-sharing-link" style="line-break: anywhere;"><i class="lab-spinner"></i></span><br>
                    <input type="button" class="hidden" id="btn-copy-sharing-link" value="Copy link">
                    <span id="article-sharing-link-copied"></span>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 sharing-link-publish-first-container lab-hidden">
                    <p>Publish the article as "Hidden", to generate a link that can be accessed by others.</p>
                </div>
            </div>
        </div>`;
    }

    getArticleToken() {
        return new Promise((resolve, reject) => {
            const published_url = this.rootModel.get('fields.published_url');
            if (published_url === null) {
                this.dom.sharingLinkContainer.querySelector('.sharing-link-container').classList.add('lab-hidden');
                this.dom.sharingLinkContainer.querySelector('.sharing-link-publish-first-container').classList.remove('lab-hidden');
                resolve();
                return;
            }

            const url = `/ajax/article/create-article-token?articleId=${ this.rootModel.getId() }`;
            fetch(url, { mode: 'cors' })
                .then((response) => {
                    if (!response.ok) {
                        reject(response.statusText);
                    }
                    return response.json();
                }).then((json) => {
                    const sharing_url = `${ this.rootModel.get('fields.published_url') }?articleToken=${ json.token }`;
                    const domain = this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url');
                    this.dom.sharingLink.innerHTML = `<a href="${ domain }${ sharing_url }" target="_blank" class="sharing-link">${ domain }${ sharing_url }</a>`;
                }).catch((err) => {
                    console.warn(err);
                    reject(err);
                });
        });
    }

    onAside() {
        return {
            section: 'Advanced',
            label: 'Approval'
        };
    }

    onPaths() {}

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {}, true);

        this.dom.btnApprove = markup.querySelector('#btn-approve');
        this.dom.btnRevoke = markup.querySelector('#btn-revoke');
        this.dom.timestamp = markup.querySelector('#lbl-timestamp');
        this.dom.sharingLinkContainer = markup.querySelector('#article-sharing-token-access');
        this.dom.sharingLink = markup.querySelector('#article-sharing-link');
        if (this.api.v1.properties.get('allow_publish_hidden_with_token') === '1') {
            this.getArticleToken();
        } else {
            this.dom.sharingLinkContainer.classList.add('lab-hidden');
        }
        this.dom.btnCopyLink = markup.querySelector('#btn-copy-sharing-link');
        this.dom.btnCopyLink.addEventListener('click', (event) => {
            navigator.clipboard.writeText(this.dom.sharingLink.querySelector('a').getAttribute('href'))
                .then(() => {
                    document.getElementById('article-sharing-link-copied').innerHTML = 'Copied!';
                });
        });
        this.dom.btnApprove.disabled = this.approvedData.isApproved;
        this.dom.btnRevoke.disabled = !this.approvedData.isApproved;
        this.dom.timestamp.innerHTML = this.getTimestampLabel();
        this.dom.btnApprove.addEventListener('click', (event) => {
            this.api.v1.article.approval.approve().then(() => {
                this.getState();
            });
        }, false);
        this.dom.btnRevoke.addEventListener('click', (event) => {
            this.api.v1.article.approval.revoke().then(() => {
                this.getState();
            });
        }, false);
        if (!this.hasPermission) {
            this.dom.btnApprove.setAttribute('disabled', 'disabled');
            this.dom.btnRevoke.setAttribute('disabled', 'disabled');
        }

        return markup;
    }

    getState() {
        this.api.v1.article.approval.getData().then((data) => {
            this.approvedData = data;
            if (this.dom.btnApprove) {
                this.dom.btnApprove.disabled = this.approvedData.isApproved;
                this.dom.btnRevoke.disabled = !this.approvedData.isApproved;
                this.dom.timestamp.innerHTML = this.getTimestampLabel();
            }
        });
    }

    getTimestampLabel() {
        let permissionInfo = '';
        if (!this.hasPermission) {
            permissionInfo = 'You do not have permission to accept/revoke this article.<br><br>';
        }
        if (!this.approvedData.isApproved) {
            return `${ permissionInfo }State: Unapproved`;
        }
        const date = new Date(this.approvedData.date.timestamp * 1000);
        return `${ permissionInfo }State: Approved by ${ this.approvedData.user.name }<br>${ date.toISOString() }`;
    }

}
