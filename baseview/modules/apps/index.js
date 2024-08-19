/**
 * Export a list of standalone apps as modules
 * Secondary views may override by replacing one or more modules
 */

import { SettingsFront } from './front/index.js';
import { GeneralSettings } from './front/GeneralSettings.js';
import { GeneralPage } from './front/GeneralPage.js';
import { SeoSettings } from './front/SeoSettings.js';
import { AutomationSettings } from './front/AutomationSettings.js';
import { FrontSaveAs } from './front/FrontSaveAs.js';
import { AdvancedViewports } from './front/AdvancedViewports.js';
import { ExportMailmojo } from './front/ExportMailmojo.js';
import { ConfigOverride } from './front/ConfigOverride.js';
import { Colors } from './front/Colors.js';

import { ArticleSettings } from './article/index.js';
import { ArticleTranslate } from './article/ArticleTranslate.js';
import { ArticleNotes } from './article/ArticleNotes.js';
import { ArticleGeneralTeaser } from './article/ArticleGeneralTeaser.js';
import { ArticleDates } from './article/ArticleDates.js';
import { ArticleCommercialSettings } from './article/ArticleCommercialSettings.js';
import { ArticleAdvancedSettings } from './article/ArticleAdvancedSettings.js';
import { ArticleCitation } from './article/ArticleCitation.js';

import { ArticleApproval } from './article/ArticleApproval.js';
import { ArticleStyling } from './article/ArticleStyling.js';
import { ArticleSite } from './article/ArticleSite.js';
import { RoxenExport } from './article/RoxenExport.js';
import { AptomaExport } from './article/AptomaExport.js';

import { CustomElements } from './CustomElements.js';
import { BylineEditor } from './BylineEditor.js';
import { TeaserEditor } from './TeaserEditor.js';
import { FrontContentSupport } from './FrontContentSupport.js';
import { ParallaxSupport } from './ParallaxSupport.js';

import { TopicSummary } from './article/TopicSummary.js';
import { ImageColors } from './ImageColors.js';

import { FieldVersion } from './fieldversion/index.js';

export default {
    SettingsFront,
    GeneralSettings,
    GeneralPage,
    SeoSettings,
    AutomationSettings,
    FrontSaveAs,
    AdvancedViewports,
    ExportMailmojo,
    ConfigOverride,
    Colors,
    ArticleSettings,
    ArticleNotes,
    ArticleGeneralTeaser,
    ArticleDates,
    ArticleCommercialSettings,
    ArticleAdvancedSettings,
    ArticleCitation,
    ArticleApproval,
    ArticleStyling,
    ArticleSite,
    ArticleTranslate,
    RoxenExport,
    AptomaExport,
    CustomElements,
    BylineEditor,
    TeaserEditor,
    FrontContentSupport,
    ParallaxSupport,
    TopicSummary,
    ImageColors,
    FieldVersion
};
