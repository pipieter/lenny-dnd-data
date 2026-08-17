import { Databank } from '../data';
import { Description, parseDescriptions, parsePrerequisite, parseReprint, ReprintData } from '../parser';
import { getOptionalFeaturesUrl } from '../urls';
import { joinStringsWithOr } from '../util';

export interface ParsedOptionalFeature {
    name: string;
    source: string;
    url: string;
    prerequisite: string | null;
    type: string;
    description: Description[];
    reprint: ReprintData | null;
}

export function getOptionalFeatures(data: Databank): ParsedOptionalFeature[] {
    const optFeatures: ParsedOptionalFeature[] = [];
    for (const optFeat of data.optionalfeature) {
        console.log(optFeat);
        optFeatures.push({
            name: optFeat.name,
            source: optFeat.source,
            url: getOptionalFeaturesUrl(optFeat.name, optFeat.source),
            prerequisite: optFeat.prerequisite ? parsePrerequisite(optFeat.prerequisite[0]) : null,
            type: joinStringsWithOr(optFeat.featureType), // TODO add typemap for this
            description: parseDescriptions('', optFeat.entries),
            reprint: parseReprint(optFeat),
        });
    }
    return optFeatures;
}
