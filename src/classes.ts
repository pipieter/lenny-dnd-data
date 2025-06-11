import { getKey, readJsonFile } from './data';
import {
    capitalize,
    cleanDNDText,
    Description,
    DescriptionType,
    parseAbilityScore,
    parseClassResourceValue,
    parseDescriptions,
    title,
} from './parser';
import { getClassesUrl } from './urls';
import { BulletPoint, joinStringsWithAnd, joinStringsWithOr } from './util';

const BASEPATH = '5etools-src/data/class/';

interface ClassFeatureDictionary {
    [classKey: string]: ClassFeature[];
}
interface PaginatedDescriptions {
    [level: number]: Description[];
}

class ClassFeature {
    name: string;
    source: string;
    level: number;

    classKey: string;
    subclassKey: string | null = null;
    descriptions: Description[] | null = null;

    constructor(data: any) {
        this.name = data.name;
        this.source = data.source;
        this.level = data.level;

        this.classKey = getKey(data.className, data.classSource);
        if (data.subclassShortName && data.subclassSource) {
            this.subclassKey = getKey(data.subclassShortName, data.subclassSource);
        }

        if (data.entries) {
            const parsedDescriptions = parseDescriptions('', data.entries);
            if (parsedDescriptions.length > 0) this.descriptions = parsedDescriptions;
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
        subclassFeatures: ClassFeatureDictionary
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
        this.setSubclassData(subclassFeatures);
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
            }
        }

        this.levelFeatures = levelFeatures;
    }

    private setSubclassData(subclassFeatures: ClassFeatureDictionary) {
        let result: { [subclass: string]: PaginatedDescriptions } = {};
        let lowestLevel = 999;

        Object.values(subclassFeatures)
            .flat()
            .forEach((feature) => {
                const subclassKey = feature.subclassKey;
                const levelKey = feature.level;
                if (!subclassKey) return;
                if (!feature.descriptions) return;

                if (feature.level < lowestLevel) lowestLevel = feature.level;
                if (!result[subclassKey]) result[subclassKey] = {};
                if (!result[subclassKey][levelKey]) result[subclassKey][levelKey] = [];

                const descriptions = feature.descriptions;
                result[subclassKey][levelKey].push(...descriptions);
            });

        for (const subclass in result) {
            for (const level in result[subclass]) {
                if (result[subclass][level].length > 0) {
                    result[subclass][level][0].name = `${subclass} Features`;
                }
            }
        }

        this.subclassUnlockLevel = lowestLevel === 999 ? null : lowestLevel;
        this.subclassLevelFeatures = result;
    }
}

export function getClasses(): any[] {
    const indexPath = BASEPATH + '/index.json';
    let result: any[] = [];

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

        let subclassFeatures: ClassFeatureDictionary = {};
        if (data.subclassFeature) {
            for (const featureData of data.subclassFeature) {
                const feature = new ClassFeature(featureData);
                const key = feature.classKey;
                if (!subclassFeatures[key]) subclassFeatures[key] = [];
                subclassFeatures[key].push(feature);
            }
        }

        for (const classData of data.class) {
            const characterClass = new CharacterClass(classData, features, subclassFeatures);
            result.push(characterClass.toJSON());
        }
    }

    return result;
}
