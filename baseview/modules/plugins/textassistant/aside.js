export default `<div>
    {{ #content }}
    <div class="lab-aside-settings">
        <h4 class="lab-title">Target fields</h4>
        {{ #items }}
        <div class="{{{ placeholder }}}"></div>
        {{ /items }}
    </div>
    <div class="lab-aside-settings">
        <h4 class="lab-title">Language</h4>
        <p class="lab-info">You can autodetect the language or use your page language.</p>
        <p class="lab-para"><label>Autodetect language<input type="checkbox" title="Automatically detect language" id="auto-language" style="float:left;"></label></p>
        <p class="lab-para"><label><span id="selectedLang">{{ languageName }}</span><input type="checkbox" checked title="Use page language" id="page-language" style="float:left;"></label></p>

        
        <select name="fields.seolanguage" id="languages">
            <option value="">Select language:</option>
            {{ #languages }}
            <option value="{{ code }}"{{ #selected }} selected{{ /selected }}>{{ name }} ({{ code }})</option>
            {{ /languages }}
        </select>
    </div>
    <div class="lab-aside-settings">
        <h4 class="lab-title">Automation</h4>
        <p class="lab-para"><label>Auto-insert <input type="checkbox" title="Automatically insert suggestions for new articles" id="suggestion-auto-btn" style="float:left;"></label></p>
        <p class="lab-info">This will add the text-suggestions to new articles when you have written enough bodytext.</p>
    </div>
    {{ /content }}
</div>`;
