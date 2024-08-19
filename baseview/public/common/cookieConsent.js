/**
 * CookieConsent - Handle cookieconsent data
 * (c) Publish Lab AS 2022
 */

if (!window.Dac) window.Dac = {}
var Dac = window.Dac;
Dac.CookieConsent = class {

    constructor(debug, cookieName = 'CookieConsent') {
        this.debug = debug || false;
        this.cookieName = cookieName;
    }

    log(msg) {
        if (!this.debug) { return; }
        console.log('Cookie consent handler:', msg);
    }

    get(key) {
        this.cookie = this.cookie || this.getCookie();
        if (!this.cookie)
            return false;
        return this.cookie.indexOf(`${key}:true`) > -1;
    }

    getCookie() {
        const cookie = this.getCookieValue(this.cookieName);
        if (!cookie) {
            this.log('No Cookie consent cookie found: "' + this.cookieName + '"');
            return false;
        }
        return decodeURIComponent(cookie).split(',');
    }

    getCookieValue(a) {
        var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
        return b ? b.pop() : '';
    }

    renderMarkup(requiredCookieConsent, markup, message) {
        if (this.get(requiredCookieConsent)) {
            const fragment = document.createRange().createContextualFragment(markup.trim());
            document.currentScript.parentElement.appendChild(fragment);
            this.log('Sufficient cookie consent found, rendering content.');
        } else {
            var parent = document.currentScript.parentElement;
            parent.classList.add('dac-insufficientCookieConsent');
            parent.innerHTML = `<p>${message}</p>`;
            this.log('Insufficient cookie consent found, rendering message.');
        }
    }
}