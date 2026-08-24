import { rawData } from '../5etools-conversion/rawdata';
import { Databank } from '../data';
import { Description, parseDescriptions, parsePrerequisite, parseReprint, ReprintData } from '../parser';
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

const OptionalFeatureTypeMap: { [key: string]: string } = {
    // Partnered
    'MV:G': 'Maneuver, Gunslinger',
    ItdBoon: 'Interdict Boon',
    IllMastery: 'Combat Mastery',
    CO: 'Concoction',
    WE: 'Wax Enchantment',
    Mask: 'Craft Mask',
    '4M': '4th Manifestation',
    'FS:C': 'Fighting Style, Cultivator',
    Misf: 'Misfortune',
    'MV:BB': 'Maneuver: Blade Breaker',
    'MV:CR': 'Maneuver: Carrion Raven',
    GoD: 'Gifts of Damnation',
    'AH:TB': 'Aberrant Horror; Transformation Boon',
    'AH:TF': 'Aberrant Horror; Transformation Flaw',
    'TF:TB': 'The Fiend; Transformation Boon',
    'TF:TF': 'The Fiend; Transformation Flaw',
    'TLi:TB': 'The Lich; Transformation Boon',
    'TLi:TF': 'The Lich; Transformation Flaw',
    'TLy:TB': 'The Lycanthrope; Transformation Boon',
    'TLy:TF': 'The Lycanthrope; Transformation Flaw',
    'TS:TB': 'The Seraph; Transformation Boon',
    'TS:TF': 'The Seraph; Transformation Flaw',
    'V:TB': 'Vampire; Transformation Boon',
    'V:TF': 'Vampire; Transformation Flaw',
    'BGT:Ac': 'Background Talent; Academic',
    'BGT:Ar': 'Background Talent; Aristocrat',
    'BGT:Cl': 'Background Talent; Clergy',
    'BGT:CF': 'Background Talent; Common Folk',
    'BGT:CM': 'Background Talent; Clan Member',
    'BGT:Cr': 'Background Talent; Criminal',
    'BGT:M': 'Background Talent; Militarist',
    'BGT:O': 'Background Talent; Outlander',
    'BGT:P': 'Background Talent; Pauper & Pit Fighter',
    'BGT:S': 'Background Talent; Seafarer',
    HT: 'Heritage Trait',
    E: 'Exploration',
    C: 'Combat',
    R: 'Roleplaying',
    'LC:CO': 'Living Crucible: Compound Option',
    'TG:TG': 'Trapper Guild: Trapper Gadget',
    'TG:AM': 'Trapper Guild: Armor Modification',
    'MB:M': 'Misfortune Bringer: Misfortune',
    'CA:AT': 'College of Adventurers: Adventurer Talent',
    'CM:MO': 'Circle of Mutation: Mutation Option',
    'F:TB': 'Fey; Transformation Boon',
    'F:TF': 'Fey; Transformation Flaw',
    'Fi:TB': 'Fiend; Transformation Boon',
    'Fi:TF': 'Fiend; Transformation Flaw',
    'H:TB': 'Hag; Transformation Boon',
    'H:TF': 'Hag; Transformation Flaw',
    'L:TB': 'Lich; Transformation Boon',
    'L:TF': 'Lich; Transformation Flaw',
    'Ly:TB': 'Lycanthrope; Transformation Boon',
    'Ly:TF': 'Lycanthrope; Transformation Flaw',
    'O:TB': 'Ooze; Transformation Boon',
    'O:TF': 'Ooze; Transformation Flaw',
    'P:TB': 'Primordial; Transformation Boon',
    'P:TF': 'Primordial; Transformation Flaw',
    'Ser:TB': 'Seraph; Transformation Boon',
    'Ser:TF': 'Seraph; Transformation Flaw',
    'SG:TB': 'Shadowsteel Ghoul; Transformation Boon',
    'SG:TF': 'Shadowsteel Ghoul; Transformation Flaw',
    'Spec:TB': 'Specter; Transformation Boon',
    'Spec:TF': 'Specter; Transformation Flaw',
    'DG:M': 'Devourer Guild: Mutation',
    MGS: 'Monster Grimoire Specialization',
    OAF: 'Optional Animal Feature',
    HCF: 'Hag Coven Feature',
    CCF: 'Cave Creature Feature',
    EFCF: 'Enchanted Forest Creature Feature',
    TCF: 'Tomb Creature Feature',
    RKCF: 'Ruined Keep Creature Feature',
    SeCF: 'Sewer Creature Feature',
    SwCF: 'Swamp Creature Feature',
    UCF: 'Underground Creature Feature',
    'BST:MC': 'Mystic Connection',
    'C.T': 'Character Thread',
    'T:P': 'Trap: Physical',
    'T:M': 'Trap: Magical',
    'VSS:M': 'Mask',
    'MCDM:EM': 'Enucleator Modification',
    'MCDM:PP': 'Psionic Power',
    BS: 'Blood Strike',
};

function parseOptionalFeatureType(types: string[] | string): string {
    types = variadic(types);

    const parsed = types.map((t: string) => {
        const raw = rawData.getOptionalFeatureTypeFullName(t);
        if (raw !== t) return raw;
        if (t in OptionalFeatureTypeMap) return OptionalFeatureTypeMap[t];
        throw `Unknown optional feature type: ${t}`;
    });

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
            type: parseOptionalFeatureType(optFeat.featureType),
            description: parseDescriptions('', optFeat.entries),
            reprint: parseReprint(optFeat),
        };
    });

    return optFeatures;
}
