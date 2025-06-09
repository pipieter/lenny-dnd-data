import { Description, parseAbilityScore, parseDescriptions, title } from './parser';
import { getFeatsUrl } from './urls';
import { joinStringsWithAnd, joinStringsWithOr } from './util';

interface Feat {
    name: string;
    source: string;
    page: number;
    srd52?: boolean;
    basicRules2024?: boolean;

    reprintedAs?: string[];
    category?: string;
    prerequisite?: any[];
    optionalfeatureProgression?: any[];
    repeatable?: boolean;
    repeatableHidden?: boolean;

    additionalSpells?: any[];
    toolProficiencies?: any[];
    weaponProficiencies?: any[];
    armorProficiencies?: any[];
    skillProficiencies?: any[];
    languageProficiencies?: any[];

    ability?: any[];
    resist?: any[];
    senses?: any[];
    expertise?: any[];

    entries: (string | any)[];
    hasFluffImages?: boolean;
}

interface ParsedFeat {
    name: string;
    source: string;
    url: string;
    type: string;
    prerequisite: string | null;
    abilityIncrease: string | null;
    description: Description[];
}

function getFeatAbilityIncrease(feat: Feat): string | null {
    if (!feat.ability) return null;

    const result: string[] = [];

    for (const ability of feat.ability) {
        if (ability.hidden) continue;

        if (ability.choose) {
            // Prefer explicit entry if present
            if (ability.choose.entry) {
                result.push(ability.choose.entry);
                continue;
            }

            const { from = [], amount = 1, max = 20 } = ability.choose;

            const options = from.map(parseAbilityScore);
            const optionText =
                options.length === 6
                    ? 'one ability score of your choice'
                    : `your ${joinStringsWithOr(options)} score`;

            result.push(`Increase ${optionText} by ${amount}, to a maximum of ${max}.`);
            continue;
        }

        const keys = Object.keys(ability);
        if (keys.length > 0) {
            for (const key of keys) {
                const score = parseAbilityScore(key);
                const amount = ability[key];

                if (score === key) throw `Unsupported feat-ability key ${key}`;
                result.push(`Increase your ${score} score by ${amount}, to a maximum of 20.`);
            }
            continue;
        }
    }

    return result.length ? result.join('\n') : null;
}

function getFeatPrerequisites(feat: Feat): string | null {
    if (!feat.prerequisite) return null;

    let prerequisites: string[][] = [];
    for (const prerequisite of feat.prerequisite) {
        const keys = Object.keys(prerequisite);

        let group: string[] = [];
        for (const key of keys) {
            const entry = prerequisite[key];

            switch (key) {
                case 'level':
                    const level = entry;

                    if (level.level) {
                        group.push(`Level ${level.level} ${level.class.name}`);
                        continue;
                    }

                    group.push(`Level ${level}+`);
                    break;

                case 'feat':
                    const feat: string = entry[0]; // Only ever has 1 feat
                    const parts = feat.split('|').map(title);

                    if (parts.length <= 2) group.push(parts[0]);
                    else group.push(parts[parts.length - 1]);
                    break;

                case 'feature':
                    const feature = entry[0]; // Only ever has 1 feature
                    group.push(feature);
                    break;

                case 'ability':
                    const abilityKeys = Object.keys(entry[0]);
                    let abilityGroup = [];
                    for (const abilityKey of abilityKeys) {
                        const score = parseAbilityScore(abilityKey);
                        const amount = entry[0][abilityKey];

                        abilityGroup.push(`${amount} ${score}`);
                    }
                    group.push(joinStringsWithOr(abilityGroup, false));
                    break;

                case 'background':
                    const background = entry[0];
                    group.push(background.name);
                    break;

                case 'race':
                    let races: string[] = [];
                    for (const race of entry) {
                        if (race.displayEntry) {
                            races.push(race.displayEntry);
                            continue;
                        }

                        const name = race.name;
                        const subrace = race.subrace;
                        const raceText = subrace ? `${subrace} ${name}` : name;
                        races.push(title(raceText));
                    }

                    group.push(joinStringsWithOr(races, false));
                    break;

                case 'proficiency':
                    const proficiencyKeys = Object.keys(entry[0]); // Only ever has 1 proficiency

                    let proficiencies: string[] = [];
                    for (const profKey of proficiencyKeys) {
                        const profValue = entry[0][profKey];

                        if (profKey === 'armor') {
                            if (profValue === 'shield') {
                                proficiencies.push(profValue);
                                continue;
                            }
                            proficiencies.push(`${profValue} ${profKey} Proficiency`);
                        } else if (profKey === 'weapon') {
                            proficiencies.push(`Proficiency with a ${profValue} weapon`);
                        } else if (profKey === 'weaponGroup') {
                            proficiencies.push(`${profValue} Proficiency`);
                        } else {
                            throw `Unsupported feat-proficiency-prerequisite ${profKey}`;
                        }
                    }

                    group.push(joinStringsWithAnd(proficiencies, true));
                    break;

                case 'campaign':
                    const campaign = `${entry[0]} Campaign`; // Only ever has 1 campaign
                    group.push(campaign);
                    break;

                case 'spellcasting':
                    group.push('The ability to cast at least one spell');
                    break;

                case 'spellcasting2020':
                    group.push('Spellcasting or Pact Magic Feature');
                    break;

                case 'spellcastingFeature':
                    group.push('Spellcasting Feature');
                    break;

                case 'spellcastingPrepared':
                    group.push('Spellcasting feature from a class that prepares spells');
                    break;

                case 'otherSummary':
                    const summaryEntry = entry.entry;
                    group.push(summaryEntry);
                    break;

                case 'other':
                    group.push(entry);
                    break;

                default:
                    throw `Unsupported feat prerequisite key ${key}`;
            }
        }

        prerequisites.push(group);
    }

    // Iterate over prerequisite groups and count up how many times each group-entry appears.
    const commonTracker: Record<string, number> = {};
    for (const group of prerequisites) {
        for (const trait of group) {
            commonTracker[trait] = (commonTracker[trait] || 0) + 1;
        }
    }

    // Filter out 'common' group-entries
    const groupLength = prerequisites.length;
    let common: string[] = [];
    const andedPrerequisites = prerequisites.map((group) => {
        const filteredGroup = group.filter((entry) => {
            if (commonTracker[entry] === groupLength) {
                if (!common.includes(entry)) common.push(entry);
                return false;
            }
            return true;
        });
        return joinStringsWithAnd(filteredGroup, false);
    });

    if (common.length === 0) return joinStringsWithOr(andedPrerequisites, false);
    if (groupLength === 1) return joinStringsWithAnd(prerequisites[0], false);

    // Return common joined with rest of the prerequisites. (e.g. Level 4+ and Fighter 1 or Paladin 1)
    return joinStringsWithAnd(
        [joinStringsWithAnd(common, false), joinStringsWithOr(andedPrerequisites, false)],
        false
    );
}

function getFeatType(feat: Feat): string {
    if (!feat.category) return 'Uncategorized Feat';

    const categoryMap: Record<string, string> = {
        G: 'General Feat',
        O: 'Origin Feat',
        FS: 'Fighting Style Feat',
        'FS:P': 'Fighting Style Replacement Feat (Paladin)',
        'FS:R': 'Fighting Style Replacement Feat (Ranger)',
        EB: 'Epic Boon Feat',
    };

    if (feat.category in categoryMap) {
        return categoryMap[feat.category];
    }

    throw `Unsupported feat-type ${feat.category}`;
}

export function getFeats(data: any): ParsedFeat[] {
    return (data.feat as Feat[]).map((feat) => {
        return {
            name: feat.name,
            source: feat.source,
            url: getFeatsUrl(feat.name, feat.source),
            type: getFeatType(feat),
            prerequisite: getFeatPrerequisites(feat),
            abilityIncrease: getFeatAbilityIncrease(feat),
            description: parseDescriptions('', feat.entries),
        };
    });
}
