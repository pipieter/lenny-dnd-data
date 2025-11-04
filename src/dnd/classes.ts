import { getKey, readJsonFile } from '../data';
import { ParsedFeat } from './feats';
import {
    capitalize,
    checkForDisallowedSymbols,
    cleanDNDText,
    parseAbilityScore,
    parseClassResourceValue,
    parseDescriptions,
    title,
} from '../parser';
import { getClassesUrl, getSubclassUrl } from '../urls';
import { BulletPoint, joinStringsWithAnd, joinStringsWithOr } from '../util';
import { Description, DescriptionType } from '../interfaces';

const BASEPATH = '5etools-src/data/class/';

export interface ClassFeatureDictionary {
    [classKey: string]: ClassFeature[];
}

interface SubclassDictionary {
    [subclassKey: string]: CharacterSubclass;
}

interface PaginatedDescriptions {
    [level: number]: Description[];
}

export class ClassFeature {
    name: string;
    source: string;
    level: number;

    className: string;
    classSource: string;
    classKey: string;
    subclassName: string | null = null;
    subclassSource: string | null = null;
    subclassKey: string | null = null;
    descriptions: Description[] | null = null;

    constructor(data: any) {
        this.name = data.name;
        this.source = data.source;
        this.level = data.level;

        this.className = data.className;
        this.classSource = data.classSource || 'PHB';
        this.classKey = getKey(this.className, this.classSource);
        if (data.subclassShortName && data.subclassSource) {
            this.subclassName = data.subclassShortName;
            this.subclassSource = data.subclassSource;
            this.subclassKey = getKey(data.subclassShortName, data.subclassSource);
        }

        if (data.entries) {
            const parsedDescriptions = parseDescriptions('', data.entries);
            if (parsedDescriptions.length > 0) this.descriptions = parsedDescriptions;
        }
    }
}

class CharacterSubclass {
    name: string;
    source: string;
    key: string;
    classKey: string;
    levelFeatures: ClassFeature[] | null = null;

    constructor(data: any, subclassFeatures: ClassFeatureDictionary) {
        this.name = data.name;
        this.source = data.source;
        this.key = getKey(data.shortName, data.source);
        this.classKey = getKey(data.className, data.classSource);

        if (!data.subclassFeatures) return;

        const features = subclassFeatures[this.classKey];
        for (const subclassFeature of data.subclassFeatures) {
            const parts = subclassFeature.split('|');
            const featName = parts[0];
            const featClassName = parts[1];
            const featClassSource = parts[2] || 'PHB';

            const featClassKey = getKey(featClassName, featClassSource);
            const level = parseInt(parts[5]);

            if (typeof level !== 'number') throw `Subclass feature-level was not a number ${parts}`;

            for (const feat of features) {
                if (featClassKey !== feat.classKey) continue;
                if (feat.subclassKey !== this.key) continue;
                if (feat.name !== featName) continue;

                if (this.levelFeatures === null) this.levelFeatures = [];
                feat.level = level;
                this.levelFeatures.push(feat);
            }
        }
    }
}

class CharacterClass {
    name: string;
    source: string;
    url: string;

    primaryAbility: string | null = null;
    spellcastAbility: string | null = null;
    baseInfo: Description[] | null = null;

    levelResources: PaginatedDescriptions | null = null;
    levelFeatures: PaginatedDescriptions | null = null;
    subclassLevelFeatures: { [subclass: string]: PaginatedDescriptions } | null = null;
    subclassUnlockLevel: number | null = null;

    constructor(
        data: any,
        features: ClassFeatureDictionary,
        subclassFeatures: ClassFeatureDictionary,
        subclasses: SubclassDictionary
    ) {
        this.name = data.name;
        this.source = data.source;
        this.url = getClassesUrl(this.name, this.source);

        this.setPrimaryAbility(data);
        this.spellcastAbility = data.spellcastingAbility
            ? parseAbilityScore(data.spellcastingAbility)
            : null;
        this.setBaseInfo(data);

        this.setLevelResources(data);
        this.setLevelFeatures(features);
        this.setSubclassData(subclasses, subclassFeatures);
    }

    toJSON() {
        // This function isn't strictly required, but it forces the name & source to be at the top, making the files easier to read.
        return {
            name: this.name,
            source: this.source,
            url: this.url,
            subclassUnlockLevel: this.subclassUnlockLevel,
            primaryAbility: this.primaryAbility,
            spellcastAbility: this.spellcastAbility,
            baseInfo: this.baseInfo,
            levelResources: this.levelResources,
            levelFeatures: this.levelFeatures,
            subclassLevelFeatures: this.subclassLevelFeatures,
        };
    }

    private setPrimaryAbility(data: any) {
        if (!data.primaryAbility) return;
        const primaryAbility: any[] = data.primaryAbility;

        let orGroups: string[] = [];

        for (const abilityGroup of primaryAbility) {
            let andGroup: string[] = [];

            // Each abilityGroup is an object like { "str": true }
            Object.keys(abilityGroup).forEach((ability) => {
                if (abilityGroup[ability]) {
                    andGroup.push(parseAbilityScore(ability));
                }
            });

            orGroups.push(joinStringsWithAnd(andGroup));
        }

        this.primaryAbility = joinStringsWithOr(orGroups);
    }

    private handleProficiencies(proficiencies: { [type: string]: any }): Description[] {
        const info: Description[] = [];

        for (const [type, proficiency] of Object.entries(proficiencies)) {
            let label = title(type);
            if (label.endsWith('s')) {
                label = label.slice(0, -1);
            }

            let text = '';

            switch (type) {
                case 'armor': {
                    const armor: string[] = [];
                    let hasShields = false;
                    for (let armorType of proficiency) {
                        if (armorType.proficiency) armorType = armorType.proficiency;
                        if (armorType === 'shield') {
                            hasShields = true;
                            continue;
                        }

                        armor.push(armorType);
                    }
                    text = `${joinStringsWithAnd(armor)} armor`;
                    if (hasShields) {
                        text += ' and Shields';
                    }
                    break;
                }
                case 'weapons': {
                    const weapons: string[] = [];
                    for (const weaponType of proficiency) {
                        if (typeof weaponType === 'object' && weaponType !== null) {
                            const weaponProficiency = weaponType.proficiency;
                            if (weaponProficiency) {
                                weapons.push(weaponProficiency);
                            }
                        } else {
                            weapons.push(cleanDNDText(weaponType));
                        }
                    }
                    text = `${joinStringsWithAnd(weapons)} weapons`;
                    break;
                }

                case 'skills': {
                    for (const skillProficiencies of proficiency) {
                        if (text !== '') {
                            text += '\n';
                        }
                        const choose = skillProficiencies.choose;
                        if (!choose) continue;
                        const skills = choose.from;
                        const count = parseInt(choose.count ?? '0');
                        if (!skills || count === 0) continue;
                        text += `Choose ${count}: ${joinStringsWithOr(skills)}`;
                    }
                    break;
                }
                case 'tools': {
                    const tools: string[] = [];
                    for (const tool of proficiency) {
                        const toolText = cleanDNDText(tool);
                        tools.push(toolText);
                    }
                    text = `${joinStringsWithAnd(tools)}`;
                    break;
                }
                case 'toolProficiencies':
                case 'weaponProficiencies':
                    // Data is not of use
                    continue;
                default:
                    throw new Error('Unknown proficiency type: ' + type);
            }

            if (text !== '') {
                info.push({
                    name: '',
                    type: DescriptionType.text,
                    value: `${BulletPoint} ${label} Proficiencies: ${text}`,
                });
            }
        }
        return info;
    }

    private setBaseInfo(data: any) {
        let info: Description[] = [];

        // hpInfo
        if (data.hd) {
            const hd = data.hd;
            const sides: number = parseInt(hd.number);
            const faces: number = parseInt(hd.faces);

            const die = `${sides}d${faces}`;
            const averageHp = Math.floor(faces / 2) + 1;
            const conMod = 'Con. mod';

            const text = [
                `${BulletPoint} HP Die: ${die}`,
                `${BulletPoint} Level 1 ${this.name} HP: ${faces} + ${conMod}`,
                `${BulletPoint} HP per ${this.name} level: ${die} + ${conMod} *or* ${averageHp} + ${conMod}`,
            ].join('\n');

            info.push({ name: 'Health', type: DescriptionType.text, value: text });
        }

        // Saving Proficiencies
        let profData: Description[] = [];
        if (data.proficiency) {
            let savingProficiencies: string[] = data.proficiency;
            savingProficiencies = savingProficiencies.map((proficiency) =>
                parseAbilityScore(proficiency)
            );

            const text = `${BulletPoint} Saving Throw Proficiencies: ${joinStringsWithAnd(savingProficiencies)}`;
            profData.push({ name: '', type: DescriptionType.text, value: text });
        }

        // startingProficiencies
        if (data.startingProficiencies) {
            const startingProficiencies = this.handleProficiencies(data.startingProficiencies);
            profData.push(...startingProficiencies);
        }

        if (profData.length > 0) {
            const mergedText = profData.map((d) => d.value).join('\n');
            info.push({ name: 'Proficiencies', type: DescriptionType.text, value: mergedText });
        }

        // startEquipment
        if (data.startingEquipment) {
            // Old class notation uses 'default', new uses 'entries'
            const startingEquipment = data.startingEquipment;
            const equipment = startingEquipment.default ?? startingEquipment.entries;

            if (equipment) {
                let text = [];
                for (let line of equipment) {
                    line = capitalize(cleanDNDText(line));
                    line = equipment.length !== 1 ? `${BulletPoint} ${line}` : line; // Only add bullet points if multiple entries
                    text.push(line);
                }

                info.push({
                    name: 'Starting Equipment',
                    type: DescriptionType.text,
                    value: text.join('\n'),
                });
            }
        }

        // multiclassing
        if (data.multiclassing && Object.keys(data.multiclassing).length > 0) {
            let multiclassData = [];
            const multiclassing = data.multiclassing;

            let multiclassRequirements = multiclassing.requirements;
            if (multiclassRequirements) {
                let useAnd = true;
                if (multiclassRequirements.or) {
                    multiclassRequirements = multiclassRequirements.or[0];
                    useAnd = false;
                }

                let skills: string[] = [];
                for (const skill in multiclassRequirements) {
                    if (Object.prototype.hasOwnProperty.call(multiclassRequirements, skill)) {
                        const lvl = multiclassRequirements[skill];
                        skills.push(`${lvl} ${parseAbilityScore(skill)} `);
                    }
                }

                const requirements = useAnd
                    ? joinStringsWithAnd(skills)
                    : joinStringsWithOr(skills);
                let text = `Ability requirements: At least ${requirements}`;

                multiclassData.push({ name: '', type: DescriptionType.text, value: text });
            }

            const multiclassProficiencies = multiclassing.proficienciesGained;
            if (multiclassProficiencies) {
                multiclassData.push(...this.handleProficiencies(multiclassProficiencies));
            }

            if (multiclassData.length > 0) {
                const mergedText = multiclassData.map((d) => d.value).join('\n');
                info.push({ name: 'Multiclassing', type: DescriptionType.text, value: mergedText });
            }
        } else if (!this.name.toLowerCase().includes('sidekick')) {
            // If no multiclass data is present, use default. (Does not apply to sidekick classes)
            info.push({
                name: 'Multiclassing',
                type: DescriptionType.text,
                value: 'To qualify for a new class, you must have a score of at least 13 in the primary ability of the new class and your current classes.',
            });
        }

        this.baseInfo = info;
    }

    private getSpellLevelResources(data: any): string[] | null {
        // Initialize an array of 20 arrays, one for each level (1-20)
        let spellResources: string[][] = Array.from({ length: 20 }, () => []);

        if (data.cantripProgression) {
            for (let i = 0; i < data.cantripProgression.length; i++) {
                const cantripCount = data.cantripProgression[i];
                if (cantripCount != null) {
                    spellResources[i].push(`${cantripCount} Cantrips known`);
                }
            }
        }

        const spellsKnown = data.spellsKnownProgression ?? data.spellsKnownProgressionFixed;
        if (spellsKnown) {
            let spellTotal = 0;
            for (let i = 0; i < spellsKnown.length; i++) {
                spellTotal = data.spellsKnownProgression
                    ? spellsKnown[i]
                    : spellTotal + spellsKnown[i];
                if (spellTotal != null) {
                    spellResources[i].push(`${spellTotal} Spells known`);
                }
            }
        }

        if (data.preparedSpellsProgression) {
            for (let i = 0; i < data.preparedSpellsProgression.length; i++) {
                const preparedCount = data.preparedSpellsProgression[i];
                if (preparedCount != null) {
                    spellResources[i].push(`${preparedCount} Prepared Spells`);
                }
            }
        }

        // Check if all spellResources are empty
        if (spellResources.every((arr) => arr.length === 0)) return null;

        let result: string[] = [];
        for (let i = 0; i < spellResources.length; i++) {
            result.push(spellResources[i].join('\n'));
        }
        return result;
    }

    private getClassResources(data: any): string[] | null {
        let classResources: string[] = [];

        const classTableGroups = data.classTableGroups;
        if (!classTableGroups) return null;

        for (const tableGroup of classTableGroups) {
            const colLabels = tableGroup.colLabels;
            const rows = tableGroup.rows;

            if (!rows) continue;

            for (let level = 0; level < rows.length; level++) {
                const row = rows[level];
                let text: string[] = [];

                // Every class has the same proficiency-bonus scaling, starting on +2, scaling with 1 every 4 levels.
                text.push(`+${2 + Math.floor(level / 4)} Proficiency Bonus`);

                for (let i = 0; i < row.length; i++) {
                    const label = cleanDNDText(colLabels[i]);

                    if (label.toLowerCase().includes('spell')) continue;
                    if (label.toLowerCase().includes('cantrip')) continue;

                    let value = row[i];
                    if (value.type) value = parseClassResourceValue(value);
                    if (typeof value === 'string') value = cleanDNDText(value);

                    text.push(`${value} ${label}`);
                }

                classResources.push(text.join('\n'));
            }
        }

        return classResources.length === 0 ? null : classResources;
    }

    private setLevelResources(data: any) {
        const spellSlotTables: Description[] = [];
        if (data.classTableGroups) {
            for (const tableGroup of data.classTableGroups) {
                if (!tableGroup.rowsSpellProgression) continue;

                const headers = tableGroup.colLabels.map((label: string) =>
                    cleanDNDText(label, true)
                );
                const title = tableGroup.title ?? 'Spell Slots per Spell Level';

                for (const spellRow of tableGroup.rowsSpellProgression) {
                    spellSlotTables.push({
                        name: title,
                        type: DescriptionType.table,
                        value: {
                            title,
                            headers,
                            rows: [spellRow],
                        },
                    });
                }

                break;
            }
        }

        const spellResources = this.getSpellLevelResources(data);
        const classResources = this.getClassResources(data);

        if (!spellSlotTables && !spellResources && !classResources) this.levelResources = null;

        let levelResources: PaginatedDescriptions = {};
        for (let i = 0; i < 20; i++) {
            const level = i + 1;
            levelResources[level] = [];

            if (spellSlotTables && spellSlotTables[i]) {
                levelResources[level].push(spellSlotTables[i]);
            }

            if (spellResources && spellResources[i]) {
                levelResources[level].push({
                    name: 'Spellcasting',
                    type: DescriptionType.text,
                    value: spellResources[i],
                });
            }
            if (classResources && classResources[i]) {
                levelResources[level].push({
                    name: 'Class Resources',
                    type: DescriptionType.text,
                    value: classResources[i],
                });
            }
        }

        this.levelResources = levelResources;
    }

    private setLevelFeatures(features: ClassFeatureDictionary) {
        let levelFeatures: PaginatedDescriptions = {};

        Object.values(features)
            .flat()
            .forEach((feature) => {
                if (feature.classKey !== getKey(this.name, this.source)) return;
                const levelKey = feature.level;
                if (feature.descriptions) {
                    if (!levelFeatures[levelKey]) levelFeatures[levelKey] = [];
                    levelFeatures[levelKey].push(...feature.descriptions);
                }
            });

        for (const level in levelFeatures) {
            if (levelFeatures[level].length > 0) {
                levelFeatures[level][0].name = 'Class Features';
                levelFeatures[level] = resolveReferences(levelFeatures[level], features, null);
            }
        }

        this.levelFeatures = levelFeatures;
    }

    private setSubclassData(subclasses: SubclassDictionary, subclassFeats: ClassFeatureDictionary) {
        let result: { [subclass: string]: PaginatedDescriptions } = {};
        let lowestLevel = 999;

        for (const key in subclasses) {
            const subclass = subclasses[key];

            if (!subclass.levelFeatures) continue;

            for (const feature of subclass.levelFeatures) {
                const subclassKey = feature.subclassKey;
                const levelKey = feature.level;

                if (!subclassKey) continue;
                if (!feature.descriptions) continue;

                if (feature.level < lowestLevel) lowestLevel = feature.level;
                if (!result[subclassKey]) result[subclassKey] = {};
                if (!result[subclassKey][levelKey]) result[subclassKey][levelKey] = [];

                result[subclassKey][levelKey].push(...feature.descriptions);
            }
        }

        for (const subclass in result) {
            for (const level in result[subclass]) {
                if (result[subclass][level].length > 0) {
                    result[subclass][level][0].name = `${subclass} Features`;
                    result[subclass][level] = resolveReferences(
                        result[subclass][level],
                        null,
                        subclassFeats
                    );
                }
            }
        }

        this.subclassUnlockLevel = lowestLevel === 999 ? null : lowestLevel;
        this.subclassLevelFeatures = result;
    }
}

function resolveClassFeatReference(
    text: string,
    feats: ClassFeatureDictionary | null,
    type: 'refClassFeature' | 'refSubclassFeature'
): Description[] {
    const regex = new RegExp(`\\{#${type}\\s+([^}]+)\\}`, 'g');
    const matches = [...text.matchAll(regex)];

    const onlyOneReference = matches.length === 1;
    const trimmedText = text.trim();
    const trimmedMatch = onlyOneReference ? matches[0][0].trim() : '';
    const isPureReference = onlyOneReference && trimmedText === trimmedMatch;

    const isOnlyReferences =
        matches.length > 0 &&
        text
            .replace(regex, '')
            .trim()
            .replace(/^[•\s\r\n]+|[•\s\r\n]+$/g, '') === '';

    // Case 1: String with only a {#ref } and nothing else.
    if (isPureReference || isOnlyReferences) {
        const parts = matches[0][1].split('|').map((p) => p.trim());

        let name: string, className: string, source: string, levelStr: string;
        let subclassName: string | undefined, subclassSource: string | undefined;

        if (type === 'refClassFeature') {
            [name, className, source, levelStr] = parts;
        } else {
            [name, className, source, subclassName, subclassSource, levelStr] = parts;
        }

        const featSource = source || 'PHB';
        const key = getKey(className, featSource);

        if (!feats || !feats[key]) {
            return [
                {
                    name: '',
                    type: DescriptionType.text,
                    value: `${BulletPoint} ${getKey(name, featSource)}`,
                },
            ];
        }

        const feat = feats[key].find(
            (f) => f.name.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (!feat?.descriptions) throw `Could not find ${type} for ${key}`;
        let descs = feat.descriptions.map((d) => ({ ...d }));
        descs[0].value = `__${getKey(name, featSource)}__: ${descs[0].value}`;

        return descs;
    }

    // Case 2: Inline substitution (multiple references or formatting like bullets)
    const updatedText = text.replace(regex, (match, inner) => {
        const parts = inner.split('|').map((p: string) => p.trim());

        const [name, , source] = parts;
        const featSource = source || 'PHB';
        return getKey(name, featSource);
    });

    return [
        {
            name: '',
            type: DescriptionType.text,
            value: updatedText,
        },
    ];
}

function resolveOptionalFeatReference(entry: Description): Description {
    const value = entry.value as string;

    const updatedValue = value.replace(
        /\{#refOptionalfeature\s+([^|}]+)(?:\|([^}]+))?\}/g,
        (_, name: string, source?: string) => {
            const finalSource = source?.trim() || 'PHB';
            return `${name.trim()} (${finalSource})`;
        }
    );

    return {
        ...entry,
        value: updatedValue,
    };
}

function resolveReferences(
    entries: Description[],
    classFeats: ClassFeatureDictionary | null = null,
    subclassFeats: ClassFeatureDictionary | null = null,
    isSubResolve: boolean = false
): Description[] {
    const resolvedEntries: Description[] = [];

    for (const entry of entries) {
        if (entry.type === DescriptionType.text) {
            const text = entry.value as string;

            if (!text.includes(`{#`)) {
                resolvedEntries.push(entry);
                continue;
            }

            if (text.includes(`refClassFeature`))
                resolvedEntries.push(
                    ...resolveClassFeatReference(text, classFeats, 'refClassFeature')
                );
            else if (text.includes(`refSubclassFeature`))
                resolvedEntries.push(
                    ...resolveClassFeatReference(text, subclassFeats, 'refSubclassFeature')
                );
            else if (text.includes('refOptionalfeature'))
                resolvedEntries.push(resolveOptionalFeatReference(entry));
            else throw `Unsupported text-description reference-type in: ${text}`;
        } else if (entry.type === DescriptionType.table) {
            resolvedEntries.push(entry); // For now, tables don't have any references.
        } else {
            throw `Could not resolve unsupported DescriptionType ${entry.type}`;
        }
    }

    if (!isSubResolve) {
        let indexesToResolve: number[] = [];
        let entriesToSubResolve: Description[] = [];
        for (let i = 0; i < resolvedEntries.length; i++) {
            const e = resolvedEntries[i];
            if (e.type === DescriptionType.text) {
                const val = e.value as string;
                if (!val.includes('{#')) continue;

                indexesToResolve.push(i);
                entriesToSubResolve.push(e);
            }
        }

        for (let j = indexesToResolve.length - 1; j >= 0; j--) {
            const index = indexesToResolve[j];
            const resolved = resolveReferences(
                [entriesToSubResolve[j]],
                classFeats,
                subclassFeats,
                true
            );
            resolvedEntries.splice(index, 1, ...resolved);
        }
    }

    for (const resolvedEntry of resolvedEntries) {
        if (resolvedEntry.type !== DescriptionType.text) continue;
        checkForDisallowedSymbols(resolvedEntry.value as string);
    }

    return resolvedEntries;
}

function classFeatsToParsedFeats(
    classFeats: ClassFeatureDictionary,
    subclassFeats: ClassFeatureDictionary
): ParsedFeat[] {
    let parsedFeats: ParsedFeat[] = [];
    /* 
    Blacklist for certain feats that are generic, repetitive, or not useful as individual feats.
    Users can still access this information when looking up classes, but can't directly look up these feats.
    */
    const blacklist: string[] = [
        'Ability Score Improvement', // Duplicate of standard feat.
        'Extra Attack', // Self-explanatory name, not unique between classes.
        'Subclass Feature', // Self-explanatory name, not unique between classes.
    ];

    function getClassFeatName(name: string, level: number, className: string): string {
        return `${name} (Lv. ${level} ${className})`;
    }

    for (const key in classFeats) {
        const feats = classFeats[key];
        for (const feat of feats) {
            if (!feat.descriptions) continue;
            if (blacklist.includes(feat.name)) continue;

            feat.descriptions = resolveReferences(feat.descriptions, classFeats, subclassFeats);

            parsedFeats.push({
                name: getClassFeatName(feat.name, feat.level, feat.className),
                source: feat.source,
                url: getClassesUrl(feat.className, feat.classSource),
                type: `Lv. ${feat.level} ${feat.className} Class Feature`,
                prerequisite: feat.classKey,
                abilityIncrease: null,
                description: feat.descriptions,
            });
        }
    }

    for (const key in subclassFeats) {
        const feats = subclassFeats[key];
        for (const feat of feats) {
            if (!feat.descriptions) continue;
            if (blacklist.includes(feat.name)) continue;
            if (!feat.subclassName || !feat.subclassSource)
                throw `Subclass feat ${feat.name} does not have subclass name or source`;

            feat.descriptions = resolveReferences(feat.descriptions, classFeats, subclassFeats);

            parsedFeats.push({
                name: getClassFeatName(feat.name, feat.level, feat.subclassName),
                source: feat.source,
                url: getSubclassUrl(
                    feat.className,
                    feat.classSource,
                    feat.subclassName,
                    feat.subclassSource,
                    feat.level
                ),
                type: `Lv. ${feat.level} ${feat.subclassName} Subclass Feature`,
                prerequisite: feat.subclassKey ?? feat.classKey,
                abilityIncrease: null,
                description: feat.descriptions,
            });
        }
    }

    return parsedFeats;
}

export function getClassesAndClassFeats(): {
    classes: any[];
    classFeats: ParsedFeat[];
} {
    const indexPath = BASEPATH + '/index.json';
    let classes: any[] = [];
    let classFeats: ParsedFeat[] = [];

    const indexData = readJsonFile(indexPath);
    for (const [className, classIndexFile] of Object.entries(indexData)) {
        const path = BASEPATH + classIndexFile;
        const data = readJsonFile(path);

        let features: ClassFeatureDictionary = {};

        for (const featureData of data.classFeature) {
            const feature = new ClassFeature(featureData);
            const key = feature.classKey;
            if (!features[key]) features[key] = [];
            features[key].push(feature);
        }

        let subclasses: SubclassDictionary = {};
        let subclassFeatures: ClassFeatureDictionary = {};
        if (data.subclassFeature && data.subclass) {
            for (const featureData of data.subclassFeature) {
                const feature = new ClassFeature(featureData);
                const key = feature.classKey;
                if (!subclassFeatures[key]) subclassFeatures[key] = [];
                subclassFeatures[key].push(feature);
            }

            for (const subclassData of data.subclass) {
                const subclass = new CharacterSubclass(subclassData, subclassFeatures);
                const key = subclass.key;
                if (!subclasses[key]) subclasses[key] = subclass;
            }
        }

        classFeats.push(...classFeatsToParsedFeats(features, subclassFeatures));
        for (const classData of data.class) {
            const characterClass = new CharacterClass(
                classData,
                features,
                subclassFeatures,
                subclasses
            );
            classes.push(characterClass.toJSON());
        }
    }

    return { classes, classFeats };
}
