import { Databank, getKey } from '../data';
import { ParsedFeat } from './feats';
import {
    capitalize,
    checkForDisallowedSymbols,
    containsDisallowedSymbols,
    Description,
    DescriptionTable,
    DescriptionType,
    List,
    parseAbilityScore,
    parseClassResourceValue,
    parseDescriptions,
    parseProficiencyList,
    parseReprint,
    parseSkillProficiency,
    ProficiencyOptions,
    ReprintData,
} from '../parser';
import { getClassesUrl, getSubclassUrl } from '../urls';
import { joinStringsWithAnd, joinStringsWithOr, entrySort } from '../util';
import { cleanDNDText } from '../clean';

export interface ClassFeatureDictionary {
    [classKey: string]: ClassFeature[];
}

interface SubclassDictionary {
    [subclassKey: string]: Subclass;
}

interface PaginatedDescriptions {
    [level: number]: Description[];
}

export interface ClassFeature {
    name: string;
    source: string;
    level: number;

    className: string;
    classSource: string;
    classKey: string;
    subclassName: string | null;
    subclassSource: string | null;
    subclassKey: string | null;
    descriptions: Description[] | null;
}

interface StartingProficiencies {
    armor: string[];
    weapons: string[];
    tools: string[];
    skills: ProficiencyOptions | null;
    saving: string[];
}

export interface ParsedClass {
    name: string;
    source: string;
    url: string;

    primaryAbility: string | null;
    spellcastAbility: string | null;
    startingProficiencies: StartingProficiencies | null;
    hp: number | null;
    baseInfo: Description[] | null;

    levelResources: PaginatedDescriptions;
    levelFeatures: PaginatedDescriptions;
    subclassLevelFeatures: { [subclass: string]: PaginatedDescriptions } | null;
    subclassUnlockLevel: number | null;

    reprint: ReprintData | null;
}

interface Subclass {
    name: string;
    source: string;
    key: string;
    classKey: string;
    levelFeatures: ClassFeature[] | null;

    reprint: ReprintData | null;
}

function parseClassFeature(feature: any): ClassFeature {
    const name = feature.name;
    const source = feature.source;
    const level = feature.level;
    const className = feature.className;
    const classSource = feature.classSource || 'PHB';
    const classKey = getKey(className, classSource);

    let subclassName = null;
    let subclassSource = null;
    let subclassKey = null;
    if (feature.subclassShortName && feature.subclassSource) {
        subclassName = feature.subclassShortName ?? null;
        subclassSource = feature.subclassSource ?? null;
        subclassKey = getKey(subclassName, subclassSource);
    }

    let descriptions: Description[] | null = null;
    if (feature.entries) {
        descriptions = parseDescriptions('', feature.entries);
    }

    return {
        name,
        source,
        level,
        className,
        classSource,
        classKey,
        subclassName,
        subclassSource,
        subclassKey,
        descriptions,
    };
}

function parseSubclass(data: any, subclassFeatures: ClassFeatureDictionary): Subclass {
    const name = data.name;
    const source = data.source;
    const key = getKey(data.shortName, data.source);
    const classKey = getKey(data.className, data.classSource);

    let levelFeatures: ClassFeature[] | null = null;
    if (data.subclassFeatures) {
        const features = subclassFeatures[classKey];
        for (const subclassFeature of data.subclassFeatures) {
            const parts = subclassFeature.split('|');
            const featName = parts[0];
            const featClassName = parts[1];
            const featClassSource = parts[2] || 'PHB';

            const featClassKey = getKey(featClassName, featClassSource);
            const level = parseInt(parts[5]);

            if (typeof level !== 'number') {
                throw `Subclass feature-level was not a number ${parts}`;
            }

            for (const feat of features) {
                if (featClassKey !== feat.classKey) continue;
                if (feat.subclassKey !== key) continue;
                if (feat.name !== featName) continue;
                if (feat.level !== level) continue;

                if (levelFeatures === null) levelFeatures = [];
                levelFeatures.push({ ...feat, level: level });
            }
        }
    }

    const reprint = parseReprint(data);

    return {
        name,
        source,
        key,
        classKey,
        levelFeatures,
        reprint,
    };
}

function parseStartingProficiencies(data: any): StartingProficiencies | null {
    if (!data.startingProficiencies) return null;
    const prof = data.startingProficiencies;

    const armor: string[] = parseProficiencyList(prof.armor);
    const tools = prof.tools ? prof.tools.map((t: string) => cleanDNDText(t, true)) : [];
    const weapons = parseProficiencyList(prof.weapons);
    const skills = parseSkillProficiency(prof.skills);
    const saving = data.proficiency?.map((p: string) => cleanDNDText(p, true)) ?? [];

    return {
        armor,
        tools,
        weapons,
        skills,
        saving,
    };
}

function parseClass(
    data: any,
    features: ClassFeatureDictionary,
    subclassFeatures: ClassFeatureDictionary,
    subclasses: SubclassDictionary
): ParsedClass {
    const name = data.name;
    const source = data.source;
    const url = getClassesUrl(name, source);

    const primaryAbility = parsePrimaryAbility(data);
    const spellcastAbility = parseSpellcastAbility(data);
    const startingProficiencies = parseStartingProficiencies(data);
    const hp = data.hd?.faces ?? null; // The faces-value is also the starting hp value. The HP-die's 'number' value is always 1 (1dN)
    const baseInfo = parseBaseInfo(data);

    const levelResources = parseLevelResources(data);
    const levelFeatures = parseLevelFeatures(name, source, features);
    const { subclassLevelFeatures, subclassUnlockLevel } = parseSubclassData(subclasses, subclassFeatures);

    const reprint = parseReprint(data);

    return {
        name,
        source,
        url,
        subclassUnlockLevel,
        primaryAbility,
        spellcastAbility,
        startingProficiencies,
        hp,
        baseInfo,
        levelResources,
        levelFeatures,
        subclassLevelFeatures,
        reprint,
    };
}

function parsePrimaryAbility(data: any): string | null {
    if (!data.primaryAbility) {
        return null;
    }

    const groups: string[] = [];

    for (const abilityGroup of data.primaryAbility) {
        const andGroup: string[] = [];

        // Each abilityGroup is an object like { "str": true }
        Object.keys(abilityGroup).forEach((ability) => {
            if (abilityGroup[ability]) {
                andGroup.push(parseAbilityScore(ability));
            }
        });

        groups.push(joinStringsWithAnd(andGroup));
    }

    return joinStringsWithOr(groups);
}

function parseSpellcastAbility(data: any): string | null {
    if (!data.spellcastingAbility) {
        return null;
    }
    return parseAbilityScore(data.spellcastingAbility);
}

function parseClassArmorProficiencies(proficiency: any): string[] {
    const armors: string[] = [];
    let hasShields = false;

    for (const armorType of proficiency) {
        const armor = armorType.proficiency ? armorType.proficiency : armorType;
        if (armor === 'shield') {
            hasShields = true;
        } else if (armor) {
            armors.push(`${armor} armor`);
        }
    }
    if (hasShields) {
        armors.push('shields');
    }

    return armors;
}

function parseClassWeaponProficiencies(proficiency: any): string[] {
    const weapons: string[] = [];
    for (const weaponType of proficiency as any) {
        if (typeof weaponType === 'object' && weaponType !== null) {
            if (weaponType.proficiency) {
                weapons.push(capitalize(weaponType.proficiency));
            }
        } else {
            weapons.push(capitalize(cleanDNDText(weaponType)));
        }
    }

    return weapons;
}

function parseClassSkillProficiencies(proficiency: any): string[] {
    const skills = [];
    for (const skillProficiencies of proficiency as any) {
        const choose = skillProficiencies.choose;
        if (!choose) continue;
        const chooseFrom = choose.from;
        const count = parseInt(choose.count ?? '0');
        if (!chooseFrom || count === 0) continue;
        skills.push(`Choose ${count}: ${joinStringsWithOr(chooseFrom)}`);
    }

    return skills;
}

function parseClassToolProficiencies(proficiency: any): string[] {
    return proficiency.map(cleanDNDText);
}

function parseClassProficiencies(proficiencies: any): Description[] {
    if (!proficiencies) {
        return [];
    }

    const entries: string[] = [];

    for (const [type, proficiency] of Object.entries(proficiencies)) {
        switch (type) {
            case 'armor': {
                const armor = parseClassArmorProficiencies(proficiency);
                entries.push(`Armor Proficiencies: ${joinStringsWithAnd(armor)}`);
                break;
            }
            case 'weapons': {
                const weapons = parseClassWeaponProficiencies(proficiency);
                entries.push(`Weapon Proficiencies: ${joinStringsWithAnd(weapons)}`);
                break;
            }
            case 'skills': {
                const skills = parseClassSkillProficiencies(proficiency);
                entries.push(`Skill Proficiencies: ${joinStringsWithAnd(skills)}`);
                break;
            }
            case 'tools': {
                const tools = parseClassToolProficiencies(proficiency);
                entries.push(`Tool Proficiencies: ${joinStringsWithAnd(tools)}`);
                break;
            }
            case 'toolProficiencies':
            case 'weaponProficiencies':
                // Data is not of use
                continue;
            default:
                throw new Error('Unknown proficiency type: ' + type);
        }
    }

    if (entries.length === 0) {
        return [];
    }

    return [
        {
            name: 'Proficiencies',
            type: DescriptionType.list,
            list: {
                type: 'list',
                caption: '',
                entries: entries,
            },
        },
    ];
}

function parseMulticlassing(data: any): Description[] {
    if (!data) {
        return [];
    }

    if (Object.keys(data).length === 0) {
        return [];
    }

    const multiclassData: Description[] = [];

    // Requirements
    let requirements = data.requirements;
    if (requirements) {
        let useAnd = true;
        if (requirements.or) {
            requirements = requirements.or[0];
            useAnd = false;
        }

        const skills: string[] = [];
        for (const skill in requirements) {
            if (Object.prototype.hasOwnProperty.call(requirements, skill)) {
                const lvl = requirements[skill];
                skills.push(`${lvl} ${parseAbilityScore(skill)} `);
            }
        }

        const reqs = useAnd ? joinStringsWithAnd(skills) : joinStringsWithOr(skills);
        const text = `Ability requirements: At least ${reqs}`;

        multiclassData.push({
            name: '',
            type: DescriptionType.text,
            value: text,
        });
    }

    // Proficiencies
    if (data.proficienciesGained) {
        multiclassData.push(...parseClassProficiencies(data.proficienciesGained));
    }

    return multiclassData;
}

function parseBaseInfo(data: any): Description[] {
    const info: Description[] = [];

    const name = data.name;

    // Hit dice
    if (data.hd) {
        const sides = parseInt(data.hd.number);
        const faces = parseInt(data.hd.faces);

        const die = `${sides}d${faces}`;
        const averageHp = Math.floor(faces / 2) + 1;
        const entries = [
            `HP Die: ${die}`,
            `Level 1 ${name} HP: ${faces} + Con. mod`,
            `HP per ${name} level: ${die} + Con. mod *or* ${averageHp} + Con. mod`,
        ];

        info.push({
            name: 'Health',
            type: DescriptionType.list,
            list: { type: 'list', caption: '', entries: entries },
        });
    }

    // Saving throw proficiencies
    if (data.proficiency) {
        const savingProficiencies = data.proficiency.map(parseAbilityScore);
        info.push({
            name: 'Saving Throw Proficiencies',
            type: DescriptionType.list,
            list: { type: 'list', caption: '', entries: savingProficiencies },
        });
    }

    // Starting proficiencies (e.g. skills, tools, armor...)
    if (data.startingProficiencies) {
        info.push(...parseClassProficiencies(data.startingProficiencies));
    }

    // Starting equipment
    if (data.startingEquipment) {
        const equipment = data.startingEquipment.default ?? data.startingEquipment.entries;

        if (equipment) {
            const entries = equipment.map((entry: any) => {
                if (typeof entry == 'string') return capitalize(cleanDNDText(entry));
                return parseDescriptions('', [entry]); // TLOTRR (partnered) stores equipment as entries rather than strings.
            });
            // If entries only has one item, return a text
            if (entries.length === 1) {
                info.push({
                    name: 'Starting Equipment',
                    type: DescriptionType.text,
                    value: entries[0],
                });
            } else {
                info.push({
                    name: 'Starting Equipment',
                    type: DescriptionType.list,
                    list: { type: 'list', caption: '', entries: entries },
                });
            }
        }
    }

    // Multi-classing
    let multiclassing = [];
    if (data.multiclassing) {
        multiclassing = parseMulticlassing(data.multiclassing);
        if (multiclassing.length > 0) {
            // Add the multiclassing header
            multiclassing[0].name = 'Multiclassing';
            info.push(...multiclassing);
        }
    }

    // If no multiclass data is present, use default. (Does not apply to sidekick classes)
    if (multiclassing.length === 0 && !name.toLowerCase().includes('sidekick')) {
        info.push({
            name: 'Multiclassing',
            type: DescriptionType.text,
            value: 'To qualify for a new class, you must have a score of at least 13 in the primary ability of the new class and your current classes.',
        });
    }

    return info;
}

function parseSpellSlotTables(data: any): DescriptionTable[] {
    if (!data.classTableGroups) {
        return [];
    }
    const spellSlotTables: DescriptionTable[] = [];
    for (const tableGroup of data.classTableGroups) {
        if (!tableGroup.rowsSpellProgression) continue;

        const headers = tableGroup.colLabels.map((label: string) => cleanDNDText(label, true));
        const title = tableGroup.title ?? 'Spell Slots per Spell Level';

        for (const spellRow of tableGroup.rowsSpellProgression) {
            spellSlotTables.push({
                name: title,
                type: DescriptionType.table,
                table: {
                    type: 'table',
                    title,
                    headers,
                    rows: [spellRow],
                },
            });
        }

        break;
    }

    return spellSlotTables;
}

function parseSpellLevelResources(data: any): string[] {
    // Initialize an array of 20 arrays, one for each level (1-20)
    const spellResources: string[][] = Array.from({ length: 20 }, () => []);

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
            spellTotal = data.spellsKnownProgression ? spellsKnown[i] : spellTotal + spellsKnown[i];
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
    if (spellResources.every((arr) => arr.length === 0)) return [];

    const result: string[] = [];
    for (let i = 0; i < spellResources.length; i++) {
        result.push(spellResources[i].join('\n'));
    }
    return result;
}

function parseClassResources(data: any): string[] {
    const classResources: string[] = [];

    const classTableGroups = data.classTableGroups;
    if (!classTableGroups) return [];

    for (const tableGroup of classTableGroups) {
        const colLabels = tableGroup.colLabels;
        const rows = tableGroup.rows;

        if (!rows) continue;

        for (let level = 0; level < rows.length; level++) {
            const row = rows[level];
            const text: string[] = [];

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

    return classResources;
}

function parseLevelResources(data: any): PaginatedDescriptions {
    const spellSlotTables = parseSpellSlotTables(data);
    const spellResources = parseSpellLevelResources(data);
    const classResources = parseClassResources(data);

    const levelResources: PaginatedDescriptions = {};
    for (let i = 0; i < 20; i++) {
        const level = i + 1;
        levelResources[level] = [];

        if (spellSlotTables[i]) {
            levelResources[level].push(spellSlotTables[i]);
        }

        if (spellResources[i]) {
            levelResources[level].push({
                name: 'Spellcasting',
                type: DescriptionType.text,
                value: spellResources[i],
            });
        }
        if (classResources[i]) {
            levelResources[level].push({
                name: 'Class Resources',
                type: DescriptionType.text,
                value: classResources[i],
            });
        }
    }

    return levelResources;
}

function parseLevelFeatures(
    name: string,
    source: string,
    classFeatures: ClassFeatureDictionary
): PaginatedDescriptions {
    const key = getKey(name, source);
    const features = classFeatures[key];

    const levelFeatures: PaginatedDescriptions = {};
    for (const feature of features) {
        const level = feature.level;
        levelFeatures[level] ??= [];

        if (feature.descriptions) {
            const descriptions = feature.descriptions.map((desc) => ({ ...desc }));
            descriptions[0].name = feature.name;
            levelFeatures[level].push(...descriptions);
        }
    }

    return levelFeatures;
}

function parseSubclassData(
    subclasses: SubclassDictionary,
    subclassFeats: ClassFeatureDictionary
): {
    subclassUnlockLevel: number | null;
    subclassLevelFeatures: Record<string, PaginatedDescriptions>;
} {
    const result: { [subclass: string]: PaginatedDescriptions } = {};
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
                result[subclass][level] = resolveDescriptionReferences(result[subclass][level], null, subclassFeats);
            }
        }
    }

    const subclassUnlockLevel = lowestLevel === 999 ? null : lowestLevel;
    const subclassLevelFeatures = result;

    return { subclassUnlockLevel, subclassLevelFeatures };
}

function resolveClassFeatReference(
    text: string,
    feats: ClassFeatureDictionary | null,
    type: 'refClassFeature' | 'refSubclassFeature'
): { resolved: string; additionalEntries: Description[] } {
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
            return { resolved: getKey(name, featSource), additionalEntries: [] };
        }

        const feat = feats[key].find((f) => f.name.trim().toLowerCase() === name.trim().toLowerCase());

        if (!feat?.descriptions) throw `Could not find ${type} for ${key}`;
        const descs = feat.descriptions.map((d) => ({ ...d }));

        if (descs[0].type !== DescriptionType.text) {
            throw new Error(`First class feat of ${text} does not start with a text.`);
        }

        const resolved = `__${getKey(name, featSource)}__: ${descs[0].value}`;
        const additionalEntries = descs.slice(1);
        return { resolved, additionalEntries };
    }

    // Case 2: Inline substitution (multiple references or formatting like bullets)
    const updatedText = text.replace(regex, (match, inner) => {
        const parts = inner.split('|').map((p: string) => p.trim());

        const [name, , source] = parts;
        const featSource = source || 'PHB';
        return getKey(name, featSource);
    });

    return { resolved: updatedText, additionalEntries: [] };
}

function resolveOptionalFeatReference(text: string): string {
    const updatedValue = text.replace(
        /\{#refOptionalfeature\s+([^|}]+)(?:\|([^}]+))?\}/g,
        (_, name: string, source?: string) => {
            const finalSource = source?.trim() || 'PHB';
            return `${name.trim()} (${finalSource})`;
        }
    );

    return updatedValue;
}

function resolveReference(
    text: string,
    classFeats: ClassFeatureDictionary | null,
    subclassFeats: ClassFeatureDictionary | null
): { resolved: string; additionalEntries: Description[] } {
    if (!text.includes(`{#`)) {
        return { resolved: text, additionalEntries: [] };
    }

    if (text.includes(`refClassFeature`)) {
        return resolveClassFeatReference(text, classFeats, 'refClassFeature');
    } else if (text.includes(`refSubclassFeature`)) {
        return resolveClassFeatReference(text, subclassFeats, 'refSubclassFeature');
    } else if (text.includes('refOptionalfeature')) {
        const resolved = resolveOptionalFeatReference(text);
        return { resolved, additionalEntries: [] };
    } else {
        throw `Unsupported text-description reference-type in: ${text}`;
    }
}

function resolveListReferences(
    list: List,
    classFeats: ClassFeatureDictionary | null,
    subclassFeats: ClassFeatureDictionary | null
): { resolved: List; additionalEntries: Description[] } {
    const resolved: List = { type: 'list', caption: list.caption, entries: [] };
    const additionalEntries: Description[] = [];

    if (!list.entries) {
        return { resolved, additionalEntries };
    }

    for (const subentry of list.entries) {
        if (typeof subentry === 'string') {
            const subresolved = resolveReference(subentry, classFeats, subclassFeats);
            resolved.entries.push(subresolved.resolved);
            additionalEntries.push(...subresolved.additionalEntries);
        } else {
            const subresolved = resolveListReferences(subentry, classFeats, subclassFeats);
            resolved.entries.push(subresolved.resolved);
            additionalEntries.push(...subresolved.additionalEntries);
        }
    }

    return { resolved, additionalEntries };
}

function containsUnresolvedReferences(description: Description): boolean {
    if (description.type === DescriptionType.text) {
        return containsDisallowedSymbols(description.value);
    }

    if (description.type === DescriptionType.table) {
        return false; // For now, tables don't have any references.
    }

    if (description.type === DescriptionType.list) {
        return containsDisallowedSymbols(description.list);
    }

    throw `Unsupported unresolved description references type '${description.type}'`;
}

function resolveDescriptionReferences(
    entries: Description[],
    classFeats: ClassFeatureDictionary | null = null,
    subclassFeats: ClassFeatureDictionary | null = null
): Description[] {
    let resolvedEntries: Description[] = entries;

    while (resolvedEntries.some(containsUnresolvedReferences)) {
        const newResolvedEntries: Description[] = [];

        for (const entry of resolvedEntries) {
            // DescriptionText
            if (entry.type === DescriptionType.text) {
                const { resolved, additionalEntries } = resolveReference(entry.value, classFeats, subclassFeats);
                newResolvedEntries.push({ ...entry, value: resolved });
                newResolvedEntries.push(...additionalEntries);
            }
            // DescriptionTable
            else if (entry.type === DescriptionType.table) {
                newResolvedEntries.push(entry); // For now, tables don't have any references.
            }
            // DescriptionList
            else if (entry.type === DescriptionType.list) {
                const { resolved, additionalEntries } = resolveListReferences(entry.list, classFeats, subclassFeats);
                newResolvedEntries.push({ ...entry, list: resolved });
                newResolvedEntries.push(...additionalEntries);
            } else {
                throw `Could not resolve unsupported DescriptionType ${entry.type}`;
            }
        }

        resolvedEntries = newResolvedEntries;
    }

    // Validate the results to ensure no remaining references remain
    for (const resolvedEntry of resolvedEntries) {
        if (resolvedEntry.type === DescriptionType.text) {
            checkForDisallowedSymbols(resolvedEntry.value);
        } else if (resolvedEntry.type === DescriptionType.table) {
            continue; // Tables don't have references
        } else if (resolvedEntry.type === DescriptionType.list) {
            checkForDisallowedSymbols(resolvedEntry.list);
        } else {
            throw `Error: reference validation code for ${JSON.stringify(resolvedEntry)} not supported`;
        }
    }

    return resolvedEntries;
}

function classFeatsToParsedFeats(
    classFeats: ClassFeatureDictionary,
    subclassFeats: ClassFeatureDictionary
): ParsedFeat[] {
    const parsedFeats: ParsedFeat[] = [];
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

            feat.descriptions = resolveDescriptionReferences(feat.descriptions, classFeats, subclassFeats);

            parsedFeats.push({
                name: getClassFeatName(feat.name, feat.level, feat.className),
                source: feat.source,
                url: getClassesUrl(feat.className, feat.classSource),
                type: `Lv. ${feat.level} ${feat.className} Class Feature`,
                prerequisite: feat.classKey,
                abilityIncrease: null,
                description: feat.descriptions,
                reprint: parseReprint(feat),
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

            feat.descriptions = resolveDescriptionReferences(feat.descriptions, classFeats, subclassFeats);

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
                reprint: parseReprint(feat),
            });
        }
    }

    return parsedFeats;
}

function getClassFeatures(databank: Databank, name: string, source: string): ClassFeatureDictionary {
    const classKey = getKey(name, source);
    const features: any[] = databank.classFeature.filter((c) => {
        const key = getKey(c.className, c.classSource);
        return classKey === key;
    });

    const dictionary: ClassFeatureDictionary = {};
    for (const featureData of features.sort(entrySort)) {
        const feature = parseClassFeature(featureData);
        if (!dictionary[feature.classKey]) dictionary[feature.classKey] = [];
        dictionary[feature.classKey].push(feature);
    }

    return dictionary;
}

function getSubclasses(
    databank: Databank,
    name: string,
    source: string,
    subclassFeatures: ClassFeatureDictionary
): SubclassDictionary {
    const subclasses: any[] = databank.subclass.filter((s) => {
        if (source === 'PHB' && s.source === 'XPHB') return false; // Don't show 2024 subclasses on 2014 classes
        if (source === 'XPHB' && s.source === 'PHB') return false; // Don't show 2014 subclasses on 2024 classes
        if (source === 'TCE' && s.source === 'EFA') return false; // Don't mix Artificer TCE with EFA
        if (source === 'EFA' && s.source === 'TCE') return false; // Don't mix Artificer EFA with TCE
        return s.className === name;
    });

    const dictionary: SubclassDictionary = {};
    for (const subclassData of subclasses.sort(entrySort)) {
        const subclass = parseSubclass(subclassData, subclassFeatures);
        const key = subclass.key;
        if (!dictionary[key]) dictionary[key] = subclass;
    }

    return dictionary;
}

function getClassSubclassFeatures(databank: Databank, name: string, _source: string): ClassFeatureDictionary {
    const subclassFeatures: any[] = databank.subclassFeature
        .filter((sf) => {
            // The source is not checked, as this may prevent older content not being applied to newer content.
            // For example, subclasses from XGE are originally designed for PHB'14, but they are also compatible
            // with PHB'24. In order to not lose compatibility, the source is thus not checked. In the future
            // this might change.
            // sf.classSource === source
            return sf.className === name;
        })
        .sort(entrySort);

    const dictionary: ClassFeatureDictionary = {};
    for (const featureData of subclassFeatures.sort(entrySort)) {
        const feature = parseClassFeature(featureData);
        if (!dictionary[feature.classKey]) dictionary[feature.classKey] = [];
        dictionary[feature.classKey].push(feature);
    }

    return dictionary;
}

export function getClassesAndClassFeats(databank: Databank): {
    classes: ParsedClass[];
    classFeats: ParsedFeat[];
} {
    const classes: ParsedClass[] = [];
    const classFeats: ParsedFeat[] = [];
    const visitedFeats = new Set<string>();

    for (const cls of databank.class.sort(entrySort)) {
        const features = getClassFeatures(databank, cls.name, cls.source);
        const subclassFeatures = getClassSubclassFeatures(databank, cls.name, cls.source);
        const subclasses = getSubclasses(databank, cls.name, cls.source, subclassFeatures);

        const parsedFeats = classFeatsToParsedFeats(features, subclassFeatures);
        for (const feat of parsedFeats) {
            const key = getKey(feat.name, feat.source);
            if (!visitedFeats.has(key)) {
                visitedFeats.add(key);
                classFeats.push(feat);
            }
        }

        classes.push(parseClass(cls, features, subclassFeatures, subclasses));
    }

    return { classes: classes.sort(entrySort), classFeats: classFeats.sort(entrySort) };
}
