export default {
    ui: `<div class="lab-content lab-grid abtest-ui-container abtest-will-hide abtest-hidden{{ #displayArticleData }} abtest-article{{ /displayArticleData }}" data-ab-container="{{ id }}">
        <span class="abtest-close-btn labicon-remove" title="Close"></span>
        <ul class="abtest-tabs lab-list lab-grid-large-12">
            <li class="tab-variants-container lab-selected">Variants</li>
            {{ #displayTestData }}
                <li class="tab-tests-container">Settings</li>
                <li class="tab-test-results-container">Test results</li>
            {{ /displayTestData }}
        </ul>

        <div class="lab-formgroup lab-grid-large-{{ sizes.logo }} abtest-logo">
            <h3 class="lab-title labicon-ab_version">
                <strong>AB-testing for {{ type }} #{{ instanceOfId }}</strong>
                <span class="lab-ellipsis">{{{ title }}}</span>
                <a target="_blank" href="{{{ front }}}/a/{{ instanceOfId }}" class="lab-link">View{{ ^links.edit }} article{{ /links.edit }}</a> {{ #links.edit }}- <a target="_blank" href="/edit/article/id/{{ instanceOfId }}" class="lab-link">Edit</a>{{ /links.edit }}
                <span>
                    <input type="button" value="Publish" class="abtest-publish-btn lab-selected" title="Publish modifications to front-servers" disabled> &nbsp; 
                    <input type="button" value="Delete all" class="abtest-delete-btn" title="Delete test and variants for this article">
                    {{ #displayTestData }}
                        <input type="button" value="Reset test" class="abtest-reset-btn" title="Delete test and variants for this article" disabled>
                        <input type="button" value="Start test" class="start-test-now-btn" title="Start the test using the selected variants" disabled>
                    {{ /displayTestData }}
                </span>
            </h3>
        </div>


        <div class="lab-formgroup lab-grid-large-{{ sizes.variantsContainer }} lab-grid tests-container lab-hidden">            
            <div class="lab-formgroup lab-grid-large lab-grid test-info-container">
                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">AB-test for this {{ type }}</h4>
                {{ #displayTestData }}
                    <div class="lab-formgroup-item lab-grid-gap lab-grid-large-9 lab-grid">
                        <label class="name-label">Status:</label>
                        <span class="test-status">{{ test.status }}</span>
                    </div>

                    <div class="lab-formgroup-item lab-grid-gap lab-grid-large-12 lab-grid">
                        <label class="name-label">Test method:</label>
                        <span class="test-test-method">{{ test.testMethod }}</span>
                    </div>
    
                    <div class="lab-formgroup-item lab-grid-gap lab-grid-large-12 lab-grid">
                        <label class="name-label" for="test-start-field-input">Test duration</label>
                        <input type="datetime-local" class="lab-grid-large-2 test-start-field" id="test-start-field-input" style="width: 250px; max-width: 250px;" value="{{ test.start }}" placeholder="Start date (YYYY-MM-DD)">
                        <span>&ndash;</span>
                        <input type="datetime-local" class="lab-grid-large-2 test-end-field" id="test-end-field-input" style="width: 250px; max-width: 250px;" value="{{ test.end }}" placeholder="End date (YYYY-MM-DD)">
                        <input type="button" class="set-test-now-btn" value="Now + 1 hour">
                    </div>
    
                    <div class="lab-formgroup-item lab-grid-gap lab-inline lab-grid-large-12 lab-grid">
                        <label for="test-is-published">Active</label>
                        <input type="checkbox" class="test-is-published" id="test-is-published">
                    </div>
                {{ /displayTestData }}
    
                {{ ^displayTestData }}
                    <div class="lab-formgroup-item lab-grid-gap lab-grid-large-12 lab-grid">
                        <div class="abtest-text" style="flex-basis: auto;">AB-tests are added on the frontpage but will use the variants created here.</div>
                    </div>
                {{ /displayTestData }}
            </div>

        </div>

        <div class="lab-formgroup lab-grid-large-{{ sizes.variantsContainer }} lab-grid test-results-container lab-hidden">

            <div class="lab-formgroup lab-grid-large-{{ sizes.variants }} results-container">
                No test results available yet. When enough data has been collected to determine a winning variant, the winner will be selected automatically as long as the AB-test is running and active.
                When the test period is over, only the original article will be shown.<br>
                <br>
                To continue to show the winning variant, make sure to keep the test running for as long as the article is present on the frontpage.
            </div>

        </div>

        <div class="lab-formgroup lab-grid-large-{{ sizes.variantsContainer }} lab-grid variants-container">

            <div class="lab-formgroup lab-grid-large-{{ sizes.variants }}">
                
                <h4 class="lab-title">Variants of this {{ type }}</h4>

                <div class="variants lab-grid"><span class="lab-btn original">Original</span></div>

                <div class="lab-grid lab-bordered-top" style="padding-top: 14px;">
                    <input type="button" value="Duplicate selected" class="lab-btn lab-selected labicon-pluss_slim add-variant-btn" title="Add a variant based on the selected variant">
                    <input type="button" value="Suggest" class="suggest-variant-btn" title="Get suggestions for variants" style="margin-left: auto;">
                    <input type="number" value="3" class="suggest-variant-count-btn" style="width: 50px; margin-left: 0.5rem;">
                </div>

                {{ ^displayArticleData }}<p class="lab-info lab-grid-large-12 lab-grid-gap lab-space-above-medium">Use the editor to modify variant details. All changes will be used in the test.</p>{{ /displayArticleData }}
            </div>

            <div class="lab-formgroup lab-grid-large-{{ sizes.selectedVariant }} lab-grid lab-valign-top">

                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">Selected Variant{{ #displayArticleData }}<span class="abtest-helpertext-title"> - Click to edit text / image</span>{{ /displayArticleData }}</h4>

                {{ #displayArticleData }}
                <div class="lab-grid lab-grid-large-12 abtest-editables lab-grid-gap lab-bordered lab-autogrid" style="margin-bottom:14px; flex-wrap: nowrap;">
                    <div class="abtest-text" style="flex-basis: auto;">No variant added. Click the "Duplicate selected" button to create a variant based on the article.</div>
                    <div class="abtest-image"><div class="lab-empty-placeholder lab-color-light lab-bordered">
                        <div class="lab-inner">
                            <div class="lab-icon-large labicon-images"></div>
                        </div>
                    </div></div>
                </div>
                {{ /displayArticleData }}

                <div class="lab-formgroup-item lab-grid-gap lab-grid-large-{{ #displayArticleData }}3{{ /displayArticleData }}{{ ^displayArticleData }}12{{ /displayArticleData }} lab-grid">
                    <label class="name-label" for="variant-name-field-input">Variant name</label>
                    <input type="text" class="lab-grid-large-12 variant-name-field" id="variant-name-field-input" value="{{ variant.title }}" placeholder="Name of variant ...">
                </div>

                <div class="lab-formgroup-item lab-grid-gap lab-grid-large-{{ #displayArticleData }}4{{ /displayArticleData }}{{ ^displayArticleData }}12{{ /displayArticleData }} lab-grid">
                    <label class="name-label" for="variant-name-field-input">Notes</label>
                    <textarea class="lab-grid-large-12 variant-notes-field" placeholder="Add notes here ...">{{ variant.notes }}</textarea>
                </div>

                <div class="lab-formgroup-item lab-grid-gap lab-inline lab-grid-large-{{ #displayArticleData }}5{{ /displayArticleData }}{{ ^displayArticleData }}12{{ /displayArticleData }}">
                    <label for="disable-variant-btn">Disabled</label>
                    <input type="checkbox" id="disable-variant-btn">
                    <button class="lab-btn labicon-delete delete-variant-btn" style="margin-left: auto;"> Delete variant</button>
                </div>

            </div>

        </div>

    </div>`,
    result: `<h2>Results</h2>

    <p>
        Article: <a href="/edit/article/id/{{ article.id }}" target="_blank">{{ article.id }}</a> <b>{{{ article.title }}}</b><br>
        Status: <b>{{ stats.status }}</b>. Winner: <b>{{ stats.winner }}</b>
    </p>
    
    {{ #data }}
        <ul class="lab-list">
            <div class="lab-grid">
                <li class="lab-grid-large-12 lab-grid-small-12">
                    <h3>Score</h3>
                    {{ #data }}
                    <p title="{{ score }}" class="ab-result ab-score"><span class="ab-name lab-ellipsis">{{ name }}</span> <span class="ab-value" data-value="{{ scorePercent }}"><span class="ab-value-area" style="width:{{ score }}%;"></span><span class="ab-value-number">{{ scoreNice }}</span></span></p>
                    {{ /data }}
                </li>
                <li class="lab-grid-large-12 lab-grid-small-12">
                    <h3>Views</h3>
                    {{ #data }}
                    <p title="{{ views }}" class="ab-result ab-views"><span class="ab-name lab-ellipsis">{{ name }}</span> <span class="ab-value" data-value="{{ viewsPercent }}"><span class="ab-value-area" style="width:{{ viewsPercent }}%;"></span><span class="ab-value-number">{{ viewsNice }}</span></span></p>
                    {{ /data }}
                </li>
                <li class="lab-grid-large-12 lab-grid-small-12">
                    <h3>Clicks</h3>
                    {{ #data }}
                    <p title="{{ clicks }}" class="ab-result ab-clicks"><span class="ab-name lab-ellipsis">{{ name }}</span> <span class="ab-value" data-value="{{ clicksPercent }}"><span class="ab-value-area" style="width:{{ clicksPercent }}%;"></span><span class="ab-value-number">{{ clicksNice }}</span></span></p>
                    {{ /data }}
                </li>
            </div>
        </ul>
    {{ /data }}
    
    {{ ^data }}
        <p>{{ no_data_text }}</p>
    {{ /data }}
    `
};
