import { handleCopy } from '../5etools-conversion/copy';
import { applySingleTemplate, applyTemplating } from '../5etools-conversion/template';
import {
    Description,
    DescriptionType,
    parseDescriptions,
    parseImageUrl,
    parseItemValue,
    parseItemWeight,
    parseReprint,
    ReprintData,
} from '../parser';
import { getItemsUrl } from '../urls';
import { joinStringsWithOr, entrySort } from '../util';
import { Databank, getKey } from '../data';
import { cleanDNDText } from '../clean';
import { rawData } from '../5etools-conversion/rawdata';
import { Item, ItemMastery, ItemProperty, ItemType, MagicVariant } from '../../5etools-collector/types/item';
import { Fluff } from '../../5etools-collector/types/fluff';

export interface ParsedItem {
    name: string;
    source: string;
    url: string;
    image: string | null;
    value: string | null;
    weight: string | null;
    type: string[];
    description: Description[];
    properties: string[];
    reprint: ReprintData | null;
}

interface ItemMappings {
    masteries: Map<string, ItemMastery>;
    properties: Map<string, ItemProperty>;
    types: Map<string, ItemType>;
}

function getItemMappings(databanks: Databank[]): ItemMappings {
    const mappings: ItemMappings = {
        masteries: new Map(),
        properties: new Map(),
        types: new Map(),
    };

    for (const data of databanks) {
        for (const mastery of data.itemMastery) {
            const key = `${mastery.name}|${mastery.source}`;
            mappings.masteries.set(key, mastery);
        }

        for (const property of data.itemProperty) {
            mappings.properties.set(property.abbreviation, property);
        }

        for (const type of data.itemType) {
            mappings.types.set(type.abbreviation, type);
        }
    }

    return mappings;
}

function applyItemPropertyTemplate(item: any, property: any, template: string | undefined): string {
    if (!template) return cleanDNDText(property.entries[0]);

    template = template.replaceAll('{{prop_name}}', property.name);
    template = template.replaceAll('{{prop_name_lower}}', property.name.toLowerCase());

    for (const key of Object.keys(item)) {
        let replacement = item[key];
        if (typeof replacement === 'object') continue;
        if (typeof replacement === 'string') {
            replacement = replacement.split('|')[0]; // Sometimes specifics like sources will be shown, such as 'crossbow bolt|phb'
        }
        template = applySingleTemplate(template, `item.${key}`, replacement);
    }
    return template!;
}

function getItemFluff(fluffs: any[], name: string, source: string): any {
    for (const fluff of fluffs || []) {
        if (fluff.name === name && fluff.source === source) {
            return handleCopy(fluff, fluffs);
        }
    }
    return {};
}

function findItemEntry(entries: any[], name: string, source: string): any {
    for (const entry of entries) {
        if (entry.name === name && entry.source === source) {
            return entry;
        }
    }
    throw `Item entry not found ${name} (${source})`;
}

function resolveItemEntry(item: any, itemEntries: any[]): any {
    item = structuredClone(item);

    if (!item.entries) return item;

    const pattern1 = /\{#itemEntry ([^\}]*?)\|([^\}]*?)\}/;
    const pattern2 = /\{#itemEntry ([^\}]*?)\}/;

    for (let i = 0; i < item.entries.length; i++) {
        if (pattern1.test(item.entries[i])) {
            const matches = pattern1.exec(item.entries[i])!;
            const name = matches[1];
            const source = matches[2];
            const entry = findItemEntry(itemEntries, name, source);
            item.entries.splice(i, 1, ...entry.entriesTemplate);
            i += entry.entriesTemplate - 1;
        } else if (pattern2.test(item.entries[i])) {
            const matches = pattern2.exec(item.entries[i])!;
            const name = matches[1];
            const source = item.source;
            const entry = findItemEntry(itemEntries, name, source);
            item.entries.splice(i, 1, ...entry.entriesTemplate);
            i += entry.entriesTemplate - 1;
        }
    }

    item = applyTemplating(item, 'item.');

    // Specific template, required for Dragon Scail Mail armors
    item = applySingleTemplate(item, 'getFullImmRes item.resist', item.resist);

    return item;
}

function matchesRequirements(obj: any, requirements: any | any[]): boolean {
    if (Array.isArray(requirements)) {
        return requirements.map((r) => matchesRequirements(obj, r)).some((x) => x);
    }

    for (const requirement of Object.keys(requirements)) {
        if (obj[requirement] !== requirements[requirement]) {
            return false;
        }
    }
    return true;
}

function resolveMagicVariant(variant: MagicVariant, baseItems: readonly Item[]): Item[] {
    variant = structuredClone(variant);
    // Find matches
    const items = [];
    for (const item of baseItems) {
        if (variant.requires && !matchesRequirements(item, variant.requires)) continue;
        if (variant.excludes && matchesRequirements(item, variant.excludes)) continue;
        items.push(item);
    }

    const results: Item[] = [];
    for (const item of items) {
        const result = Object.assign({}, item, variant.inherits);
        result.name = (variant.inherits.namePrefix || '') + item.name + (variant.inherits.nameSuffix || '');

        // Overwrite or combine entries
        if (variant.entries) {
            result.entries = variant.entries;
        } else {
            result.entries = [...(variant.inherits.entries || []), ...(item.entries || [])];
        }

        // Remove value
        if (!variant.inherits.value) {
            result.value = undefined;
        }

        results.push(result);
    }

    return results;
}

function parseItemTypes(item: Item, mappings: ItemMappings): [string[], string[], Description[]] {
    // Item type information, see render.js:11480 (getHtmlAndTextTypes)

    const types: string[] = [];
    const properties: string[] = [];
    const descriptions: Description[] = [];

    if (item.wondrous) types.push(item.tattoo ? 'wondrous item (tattoo)' : 'wondrous item');
    if (item.staff) types.push('staff');
    if (item.ammo) types.push('ammunition');
    if (item.age) types.push(item.age);

    if (item.weaponCategory) {
        if (item.baseItem) {
            const baseItem = item.baseItem.split('|')[0];
            types.push(`weapon (${baseItem})`);
        }
        types.push(`${item.weaponCategory} weapon`);
    }

    if (item.type) {
        const type = mappings.types.get(item.type.split('|')[0])!;
        types.push(type.name.toLowerCase());
    }

    if (item.typeAlt) {
        const type = mappings.types.get(item.typeAlt.split('|')[0])!;
        types.push(type.name.toLowerCase());
    }

    if (item.firearm) {
        types.push('firearm');
    }

    if (item.poison) {
        const poisonTypes = item.poisonTypes || [];
        const poisonTypesText = joinStringsWithOr(poisonTypes, false);
        if (poisonTypesText) {
            types.push(`poison (${poisonTypesText})`);
        } else {
            types.push('poison');
        }
    }

    if (item.rarity) {
        let attune = '';
        if (item.reqAttune) {
            if (item.reqAttune === true) attune = ' (requires attunement)';
            else if (item.reqAttune === 'optional') attune = ' (attunement optional)';
            else if (item.reqAttune.startsWith('by')) attune = ` (requires attunement ${cleanDNDText(item.reqAttune)})`;
        }

        if (item.rarity === 'none' || item.rarity.startsWith('unknown')) {
            // ...
        } else {
            types.push(`${item.rarity}${attune}`);
        }
    }

    // Item, item type, and property descriptions
    descriptions.push(...parseDescriptions('', item.entries || []));

    if (item.type) {
        const type = mappings.types.get(item.type.split('|')[0])! || [];
        descriptions.push(...parseDescriptions('', type.entries || []));
    }

    // Item damage, if applicable
    if (item.dmg1) {
        if (item.dmgType) {
            const damage = `**${item.dmg1}** ${rawData.getDamageName(item.dmgType)}`;
            properties.push(damage);
        } else {
            const damage = `**${item.dmg1}**`;
            properties.push(damage);
        }
    }

    // Armor properties, if applicable
    if (item.ac && item.type) {
        if (item.type.includes('LA')) properties.push(`AC ${item.ac} + Dex`);
        else if (item.type.includes('MA')) properties.push(`AC ${item.ac} + Dex (max 2)`);
        else if (item.type.includes('S')) properties.push(`+${item.ac} AC`);
        else properties.push(`AC ${item.ac}`);
    }

    if (item.stealth) {
        descriptions.push({
            name: 'Stealth Disadvantage',
            type: DescriptionType.text,
            value: 'The wearer has **Disadvantage** on Dexterity (Stealth) checks.',
        });
    }

    if (item.strength && item.armor) {
        descriptions.push({
            name: 'Strength Requirement',
            type: DescriptionType.text,
            value: `If the wearer has a Strength score lower than ${item.strength}, their speed is reduced by 10 feet.`,
        });
    }

    return [types, properties, descriptions];
}

function parseItemProperties(item: Item, mappings: ItemMappings): [string[], Description[]] {
    const properties: string[] = [];
    const descriptions: Description[] = [];

    for (let p of item.property || []) {
        let note = null;
        if (typeof p === 'object') {
            note = p.note;
            p = p.uid;
        }

        let property = mappings.properties.get(p);
        if (!property) {
            p = p.split('|')[0];
            property = mappings.properties.get(p)!;
        }

        if (property.name === 'special') {
            properties.push('special');
        } else {
            const entries = property.entries || property.entriesTemplate || [];
            if (entries.length === 0) continue;
            if (entries.length > 1) {
                // Mainly used by partnered source HelianasGuidetoMonsterHunting's "Socketable" property.
                descriptions.push(...parseDescriptions('', entries));
                continue;
            }

            const entry = entries[0] as any;
            const template = applyItemPropertyTemplate(item, entry, property.template).toLowerCase();
            properties.push(template);

            // Apply template to entries of entry (required for Extended Reach)
            for (let i = 0; i < entry.entries.length; i++) {
                entry.entries[i] = applyItemPropertyTemplate(item, entry, entry.entries[i] as string);
            }
            descriptions.push(...parseDescriptions(entry.name, entry.entries));
        }
    }

    return [properties, descriptions];
}

function parseItemMastery(item: Item, mappings: ItemMappings): [string[], Description[]] {
    const names: string[] = [];
    const descriptions: Description[] = [];

    for (let masteryKey of item.mastery || []) {
        let note = '';
        if (typeof masteryKey === 'object') {
            note = ` (${masteryKey.note})`;
            masteryKey = masteryKey.uid;
        } else {
            const parts: string[] = masteryKey.split('|');
            if (parts.length > 2) {
                // Support for triple '|' (E.g. Scatter|GrimHollowPG24|Scatter)
                note = ` ${parts[2].replaceAll(parts[0], '').trim()}`;
                masteryKey = `${parts[0]}|${parts[1]}`;
            }
        }
        const mastery = mappings.masteries.get(masteryKey)!;
        const propertyName = `mastery: ${mastery.name}${note}`.toLowerCase();
        const propertyDesc = parseDescriptions(mastery.name, mastery.entries);
        names.push(propertyName);
        descriptions.push(...propertyDesc);
    }

    return [names, descriptions];
}

function parseItem(item: Item, fluffs: Fluff[], mappings: ItemMappings): ParsedItem {
    const fluff = getItemFluff(fluffs, item.name, item.source);

    const url = getItemsUrl(item.name, item.source);
    const result: ParsedItem = {
        name: '',
        source: '',
        url: '',
        image: null,
        value: null,
        weight: null,
        type: [],
        description: [],
        properties: [],
        reprint: parseReprint(item),
    };

    result.name = cleanDNDText(item.name);
    result.source = item.source;
    result.url = url;
    result.image = parseImageUrl(fluff.images || []);
    result.value = parseItemValue(item.value);
    result.weight = parseItemWeight(item.weight, item.weightNote);

    const [typeNames, typePropertyNames, typeDescriptions] = parseItemTypes(item, mappings);
    result.type.push(...typeNames);
    result.properties.push(...typePropertyNames);
    result.description.push(...typeDescriptions);

    const [propertyNames, propertyDescriptions] = parseItemProperties(item, mappings);
    result.properties.push(...propertyNames);
    result.description.push(...propertyDescriptions);

    const [masteryNames, masteryDescriptions] = parseItemMastery(item, mappings);
    result.properties.push(...masteryNames);
    result.description.push(...masteryDescriptions);

    return result;
}

export function getItems(databank: Databank, additionalDatabank?: Databank): ParsedItem[] {
    const databanks = additionalDatabank ? [databank, additionalDatabank] : [databank];
    const fluffs = databanks.flatMap((bank) => bank.itemFluff);
    const mappings = getItemMappings(databanks);

    // Resolve raw item data
    const items = [...databank.item, ...databank.baseitem];
    const extraItems = additionalDatabank ? [...additionalDatabank.item, ...additionalDatabank.baseitem] : [];

    const raw = items.map((item) => resolveItemEntry(handleCopy(item, [...items, ...extraItems]), databank.itemEntry));
    const data = raw.map((item) => parseItem(item, fluffs, mappings));
    return data.sort(entrySort);
}

export function getItemVariants(databank: Databank, additionalDatabank?: Databank): ParsedItem[] {
    const databanks = additionalDatabank ? [databank, additionalDatabank] : [databank];
    const fluffs = databanks.flatMap((bank) => bank.itemFluff);
    const mappings = getItemMappings(databanks);

    const items = [...databank.item, ...databank.baseitem];
    const extraItems = additionalDatabank ? [...additionalDatabank.item, ...additionalDatabank.baseitem] : [];

    const variants = databank.magicvariant.flatMap((m: any) => resolveMagicVariant(m, databank.baseitem));
    const seenVariants = new Set();
    const raw: any[] = [];
    for (const variant of variants) {
        const key = getKey(variant.name, variant.source);
        if (seenVariants.has(key)) continue;
        raw.push(resolveItemEntry(handleCopy(variant, [...items, ...extraItems]), databank.itemEntry));
        seenVariants.add(key);
    }
    const data = raw.map((variant) => parseItem(variant, fluffs, mappings));
    return data.sort(entrySort);
}
