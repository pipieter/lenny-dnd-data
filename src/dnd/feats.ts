import { Databank } from '../data';
import {
    Description,
    parseAbilityScore,
    parseDescriptions,
    parseFeatCategory,
    parseReprint,
    ReprintData,
    title,
} from '../parser';
import { getFeatsUrl } from '../urls';
import { joinStringsWithAnd, joinStringsWithOr } from '../util';

export interface Feat {
    name: string;
    source: string;
    page: number;
    srd52?: boolean;
    basicRules2024?: boolean;

    reprintedAs?: any[];
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

export interface ParsedFeat {
    name: string;
    source: string;
    url: string;
    type: string;
    prerequisite: string | null;
    abilityIncrease: string | null;
    description: Description[];
    reprint: ReprintData | null;
}

function getFeatAbilityIncrease(feat: Feat): string | null {
    if (!feat.ability) return null;

    const result: string[] = [];

    for (const ability of feat.ability) {
        if (ability.hidden) continue;

        const max = ability.max || 20;
        if (ability.choose) {
            // Prefer explicit entry if present
            if (ability.choose.entry) {
                result.push(ability.choose.entry);
                continue;
            }

            const { from = [], amount = 1, max = 20 } = ability.choose;

            const options = from.map(parseAbilityScore);
            const optionText =
                options.length === 6 ? 'one ability score of your choice' : `your ${joinStringsWithOr(options)} score`;

            result.push(`Increase ${optionText} by ${amount}, to a maximum of ${max}.`);
            continue;
        }

        const skipKeys = ['max']; // List of keys to skip, as they are either unimportant or already handled
        const keys = Object.keys(ability);
        if (keys.length > 0) {
            for (const key of keys) {
                const score = parseAbilityScore(key);
                const amount = ability[key];

                if (skipKeys.includes(key)) continue;
                if (score === key) throw `Unsupported feat-ability key ${key}`;
                result.push(`Increase your ${score} score by ${amount}, to a maximum of ${max}.`);
            }
            continue;
        }
    }

    return result.length ? result.join('\n') : null;
}

function getFeatPrerequisites(feat: Feat, data: Databank): string | null {
    if (!feat.prerequisite) return null;

    const prerequisites: string[][] = [];
    for (const prerequisite of feat.prerequisite) {
        const keys = Object.keys(prerequisite);

        const group: string[] = [];
        for (const key of keys) {
            const entry = prerequisite[key];

            switch (key) {
                case 'level': {
                    const level = entry;

                    if (level.level) {
                        if (level.class) {
                            group.push(`Level ${level.level} ${level.class.name}`);
                        } else {
                            group.push(`Level ${level.level}`);
                        }
                        continue;
                    }

                    group.push(`Level ${level}+`);
                    break;
                }
                case 'feat': {
                    const feat: string = entry[0]; // Only ever has 1 feat
                    const parts = feat.split('|').map(title);

                    if (parts.length <= 2) group.push(parts[0]);
                    else group.push(parts[parts.length - 1]);
                    break;
                }
                case 'feature': {
                    const feature = entry[0]; // Only ever has 1 feature
                    group.push(feature);
                    break;
                }
                case 'ability': {
                    const abilityKeys = Object.keys(entry[0]);
                    const abilityGroup = [];
                    for (const abilityKey of abilityKeys) {
                        const score = parseAbilityScore(abilityKey);
                        const amount = entry[0][abilityKey];

                        abilityGroup.push(`${amount} ${score}`);
                    }
                    group.push(joinStringsWithOr(abilityGroup, false));
                    break;
                }
                case 'background': {
                    const background = entry[0];
                    group.push(background.name);
                    break;
                }
                case 'race': {
                    const races: string[] = [];
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
                }
                case 'proficiency': {
                    const proficiencyKeys = Object.keys(entry[0]); // Only ever has 1 proficiency

                    const proficiencies: string[] = [];
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
                        } else if (profKey === 'skill') {
                            proficiencies.push(joinStringsWithOr(profValue));
                        } else {
                            throw `Unsupported feat-proficiency-prerequisite ${profKey}`;
                        }
                    }

                    group.push(joinStringsWithAnd(proficiencies, true));
                    break;
                }
                case 'campaign': {
                    const campaign = `${entry[0]} Campaign`; // Only ever has 1 campaign
                    group.push(campaign);
                    break;
                }
                case 'spellcasting': {
                    group.push('The ability to cast at least one spell');
                    break;
                }
                case 'spellcasting2020': {
                    group.push('Spellcasting or Pact Magic Feature');
                    break;
                }
                case 'spellcastingFeature': {
                    group.push('Spellcasting Feature');
                    break;
                }
                case 'spellcastingPrepared': {
                    group.push('Spellcasting feature from a class that prepares spells');
                    break;
                }
                case 'otherSummary': {
                    const summaryEntry = entry.entry;
                    group.push(summaryEntry);
                    break;
                }
                case 'other': {
                    group.push(entry);
                    break;
                }
                case 'featCategory': {
                    const featCategories = entry.map((e: string) => parseFeatCategory(e, feat.source, data));
                    group.push(`Any ${joinStringsWithOr(featCategories, true)} Feat`);
                    break;
                }
                case 'exclusiveFeatCategory': {
                    const featCategories = entry.map((e: string) => parseFeatCategory(e, feat.source, data));
                    group.push(`Can't Have Another ${joinStringsWithOr(featCategories, true)} Feat`);
                    break;
                }
                case 'note':
                    // Additional information, but not actually a prerequisite
                    break;
                case 'culture':
                    group.push(`${joinStringsWithOr(prerequisite.culture)} culture`);
                    break;
                default: {
                    throw `Unsupported feat prerequisite-key '${key}' in: ${JSON.stringify(prerequisite)}`;
                }
            }
        }

        prerequisites.push(group);
    }

    // Count how many times each prerequisite entry appears across all groups
    const entryCounts: Record<string, number> = {};
    for (const group of prerequisites) {
        for (const entry of group) {
            entryCounts[entry] = (entryCounts[entry] || 0) + 1;
        }
    }

    const groupCount = prerequisites.length;
    const commonEntries = Object.keys(entryCounts).filter((entry) => entryCounts[entry] === groupCount);
    const filteredGroups = prerequisites.map((group) => group.filter((entry) => !commonEntries.includes(entry)));
    const joinedGroups = filteredGroups.map((group) => joinStringsWithAnd(group, false));

    if (commonEntries.length === 0) return joinStringsWithOr(joinedGroups, false);
    if (groupCount === 1) return joinStringsWithAnd(prerequisites[0], false);

    // Combine common entries with the rest
    return joinStringsWithAnd(
        [joinStringsWithAnd(commonEntries, false), joinStringsWithOr(joinedGroups, false)],
        false
    );
}

function getFeatType(feat: Feat, data: Databank): string {
    if (!feat.category) return 'Uncategorized Feat';
    return parseFeatCategory(feat.category, feat.source, data);
}

export function getFeats(data: Databank): ParsedFeat[] {
    return data.feat.map((feat) => {
        return {
            name: feat.name,
            source: feat.source,
            url: getFeatsUrl(feat.name, feat.source),
            type: getFeatType(feat, data),
            prerequisite: getFeatPrerequisites(feat, data),
            abilityIncrease: getFeatAbilityIncrease(feat),
            description: parseDescriptions('', feat.entries),
            reprint: parseReprint(feat),
        };
    });
}
