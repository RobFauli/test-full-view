export class StyleHelper {

    static getStyleDefinitions(api) {
        const alias = api.v1.properties.get('site.alias');
        const definitions = api.v1.config.get('style_definitions', alias);
        const rules = [];

        (definitions.rules || []).forEach((rule) => rules.push(rule));
        (definitions.fontface || []).forEach((font) => {
            const selector = `.font-${ font.family.replace(/ /g, '') }`;
            rules.push(StyleHelper.getFamilyDefinition(selector, font.family));

            const weights = {
                light: {
                    keys: ['light', '200', '100', '300'],
                    used: false
                },
                normal: {
                    keys: ['regular', 'normal', '400', '500'],
                    used: false
                },
                bold: {
                    keys: ['bold', '600', '700'],
                    used: false
                },
                black: {
                    keys: ['black', '800', '900'],
                    used: false
                }
            };
            font.variants.forEach((definedWeight) => {
                for (const weight of Object.keys(weights)) {
                    const weightDefinition = weights[weight];
                    if (weightDefinition && !weightDefinition.used && weightDefinition.keys.indexOf(definedWeight) > -1) {
                        rules.push(StyleHelper.getWeightDefinition(selector, definedWeight, weight));
                        weightDefinition.used = true;
                    }
                }
            });
        });

        const result = {
            fontface: definitions.fontface || [],
            parsedRules: StyleHelper.CSSRuleParser(rules)
        };
        result.hasRules = !!result.parsedRules.length;
        return result;
    }

    static getFamilyDefinition(selector, family) {
        return {
            selector,
            declarations: [{
                key: 'font-family',
                value: `"${ family }" !important`
            }]
        };
    }

    static getWeightDefinition(selector, weight, name) {
        let validatedWeight = weight;
        if (weight === 'regular') {
            validatedWeight = 'normal';
        }
        return {
            selector: `${ selector  }.font-weight-${  name }`,
            declarations: [{
                key: 'font-weight',
                value: `${ validatedWeight } !important`
            }]
        };
    }

    static CSSRuleParser(rules) {
        const results = [];
        rules.forEach((rule) => {
            let ruleString = `${ rule.selector } { `;
            let fontSizeMobile;
            let lineHeightMobile;
            rule.declarations.forEach((subrule) => {
                if (subrule.key === 'font-size-desktop') {
                    if (subrule.value !== 'default') {
                        ruleString += `font-size: ${ subrule.value.slice(0, -2) / 16 }rem; `;
                    }
                } else if (subrule.key === 'font-size-mobile') {
                    if (subrule.value !== 'default') {
                        fontSizeMobile = `calc(0.262vw * ${ subrule.value.slice(0, -2) })`;
                    }
                } else if (subrule.key === 'line-height-desktop') {
                    if (subrule.value !== 'default') {
                        ruleString += `line-height: ${ subrule.value }; `;
                    }
                } else if (subrule.key === 'line-height-mobile') {
                    if (subrule.value !== 'default') {
                        lineHeightMobile = subrule.value;
                    }
                } else if (subrule.key === 'font-family') {
                    if (subrule.value.includes('!important')) {
                        ruleString += `${ subrule.key }: ${ subrule.value }; `;
                    } else {
                        ruleString += `${ subrule.key }: "${ subrule.value }"; `;
                    }
                } else {
                    ruleString += `${ subrule.key }: ${ subrule.value }; `;
                }
            });
            ruleString += '}';
            if (fontSizeMobile || lineHeightMobile) {
                ruleString += `@media (max-width: 767px) { .resp_fonts ${ rule.selector } {`;
                if (fontSizeMobile) {
                    ruleString += `font-size: ${ fontSizeMobile }; `;
                }
                if (lineHeightMobile) {
                    ruleString += `line-height: ${ lineHeightMobile }; `;
                }
                ruleString += `} }`;
            }
            results.push(ruleString);
        });

        return results;
    }

    static getInlineCSS(api, site) {
        return [
            {
                key: 'custom_properties',
                value: api.v1.config.get('css_build.custom_properties', { site }) || ''
            },
            {
                key: 'background_colors',
                value: api.v1.config.get('css_build.background_colors', { site }) || ''
            },
            {
                key: 'background_colors_opacity',
                value: api.v1.config.get('css_build.background_colors_opacity', { site }) || ''
            },
            {
                key: 'border_colors',
                value: api.v1.config.get('css_build.border_colors', { site }) || ''
            },
            {
                key: 'font_colors',
                value: api.v1.config.get('css_build.font_colors', { site }) || ''
            },
            {
                key: 'image_gradient',
                value: api.v1.config.get('css_build.image_gradient', { site }) || ''
            }
        ];
    }

}
