import { Databank } from '../data';
import {
    Description,
    parseDescriptions,
    parseOptionalFeatureType,
    parsePrerequisite,
    parseReprint,
    ReprintData,
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

function getOptionalFeatureTypes(types: string[] | string): string {
    types = variadic(types);
    const parsed = types.map(parseOptionalFeatureType);

    // Special: Fighting Styles are bundled together.
    const isAllFightingStyles = parsed.every((t) => t.startsWith('Fighting Style;'));
    if (isAllFightingStyles && parsed.length > 0) {
        const classes = parsed.map((t) => t.split(';')[1].trim());
        return `Fighting Style; ${joinStringsWithOr(classes)}`;
    }

    return joinStringsWithOr(parsed);
}

export function getOptionalFeatures(data: Databank): ParsedOptionalFeature[] {
    const optFeatures: ParsedOptionalFeature[] = data.optionalfeature.map((optFeat: any) => {
        return {
            name: optFeat.name,
            source: optFeat.source,
            url: getOptionalFeaturesUrl(optFeat.name, optFeat.source),
            prerequisite: optFeat.prerequisite ? parsePrerequisite(optFeat.prerequisite[0]) : null,
            type: getOptionalFeatureTypes(optFeat.featureType),
            description: parseDescriptions('', optFeat.entries),
            reprint: parseReprint(optFeat),
        };
    });

    return optFeatures;
}
