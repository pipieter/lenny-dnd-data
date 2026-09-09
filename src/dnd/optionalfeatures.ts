import { Databank } from '../data';
import {
    Description,
    ReprintData,
    parseDescriptions,
    parseOptionalFeatureType,
    parsePrerequisite,
    parseReprint,
} from '../parser';
import { getOptionalFeaturesUrl } from '../urls';
import { joinStringsWithOr, variadic } from '../util';

export interface ParsedOptionalFeature {
    name: string;
    source: string;
    url: string;
    prerequisite: string | null;
    type: string;
    description: Description[];
    reprint: ReprintData | null;
}

function getOptionalFeatureTypes(types: string[], source: string, data: Databank): string {
    const parsed = types.map((t) => parseOptionalFeatureType(t, source, data));

    // Special: Fighting Styles are bundled together.
    const isAllFightingStyles = parsed.every((t) => t.startsWith('Fighting Style;'));
    if (isAllFightingStyles && parsed.length > 0) {
        const classes = parsed.map((t) => t.split(';')[1].trim());
        return `Fighting Style; ${joinStringsWithOr(classes)}`;
    }

    return joinStringsWithOr(parsed);
}

export function getOptionalFeatures(data: Databank): ParsedOptionalFeature[] {
    const optFeatures = data.optionalfeature.map((optFeat) => {
        return {
            name: optFeat.name,
            source: optFeat.source,
            url: getOptionalFeaturesUrl(optFeat.name, optFeat.source),
            prerequisite: parsePrerequisite(optFeat.prerequisite),
            type: getOptionalFeatureTypes(optFeat.featureType, optFeat.source, data),
            description: parseDescriptions('', optFeat.entries),
            reprint: parseReprint(optFeat),
        };
    });

    return optFeatures;
}
