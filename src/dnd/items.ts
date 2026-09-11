import { handleCopy } from '../5etools-conversion/copy';
import { applySingleTemplate, applyTemplating } from '../5etools-conversion/template';
import { Fluff } from '../../5etools-collector/types/fluff';
import { Base } from '../../5etools-collector/types/internal/base';
import { ItemBase, ItemMastery, ItemProperty, ItemType, MagicVariant } from '../../5etools-collector/types/item';
import { cleanDNDText } from '../clean';
import { Databank, getKey } from '../data';
import {
    Description,
    DescriptionType,
    ReprintData,
    parseDescriptions,
    parseItemValue,
    parseItemWeight,
    parseReprint,
} from '../parser';
import { getFluffImageUrl, getItemsUrl } from '../urls';
import { findFluff, joinStringsWithOr } from '../util';
import { Variables } from '../variables';

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

// Utility class to quickly look up item data
class ItemData {
    public readonly masteries = new Map<string, ItemMastery>();
    public readonly types = new Map<string, ItemType>();
    public readonly properties = new Map<string, ItemProperty>();

    constructor(data: Databank) {
        for (const mastery of data.itemMastery) {
            const key = `${mastery.name}|${mastery.source}`;
            this.masteries.set(key, mastery);
        }

        for (const type of data.itemType) {
            const key = type.abbreviation ?? `${type.name}|${type.source}`;
            this.types.set(key, type);
        }

        for (const property of data.itemProperty) {
            const key = property.abbreviation ?? `${property.name}|${property.source}`;
            this.properties.set(key, property);
        }
    }
}

function applyItemPropertyTemplate(item: ItemBase, property: any, template: string | undefined): string {
    if (!template) return cleanDNDText(property.entries[0]);

    template = template.replaceAll('{{prop_name}}', property.name);
    template = template.replaceAll('{{prop_name_lower}}', property.name.toLowerCase());

    for (const key of Object.keys(item)) {
        let replacement = item[key as keyof ItemBase];
        if (typeof replacement === 'object') continue;
        if (typeof replacement === 'string') {
            replacement = replacement.split('|')[0]; // Sometimes specifics like sources will be shown, such as 'crossbow bolt|phb'
        }
        template = applySingleTemplate(template, `item.${key}`, replacement); // TODO applySingleTemplate accepts string | undefined for the template, if typing is added for items.ts this can be adjusted.
    }
    return template!;
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

function resolveMagicVariant(variant: MagicVariant, baseItems: readonly ItemBase[]): MagicVariant[] {
    variant = structuredClone(variant);
    // Find matches
    const items = [];
    for (const item of baseItems) {
        if (variant.requires && !matchesRequirements(item, variant.requires)) continue;
        if (variant.excludes && matchesRequirements(item, variant.excludes)) continue;
        items.push(item);
    }

    const results = [];
    for (const item of items) {
        const result = Object.assign({}, item, variant.inherits);
        result.name = (variant.inherits?.namePrefix || '') + item.name + (variant.inherits?.nameSuffix || '');

        // Overwrite or combine entries
        if (variant.entries) {
            result.entries = variant.entries;
        } else {
            result.entries = [...(variant.inherits?.entries ?? []), ...(item.entries || [])];
        }

        // Remove value
        if (!variant.inherits?.value) {
            result.value = undefined;
        }

        results.push(result as MagicVariant);
    }

    return results;
}

function parseItemTypes(item: ItemBase, data: ItemData): [string[], Description[]] {
    // Item type information, see render.js:11480 (getHtmlAndTextTypes)
    const types: string[] = [];
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
        const type = data.types.get(item.type.split('|')[0]);
        if (type?.name) {
            types.push(type.name.toLowerCase());
        }
    }

    if (item.typeAlt) {
        const type = data.types.get(item.typeAlt.split('|')[0]);
        if (type?.name) {
            types.push(type.name.toLowerCase());
        }
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
        const type = data.types.get(item.type.split('|')[0]);
        if (type?.entries) {
            descriptions.push(...parseDescriptions('', type.entries));
        }
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

    return [types, descriptions];
}

function parseItemProperties(item: ItemBase, data: ItemData): [string[], Description[]] {
    const properties: string[] = [];
    const descriptions: Description[] = [];

    // Item damage, if applicable
    if (item.dmg1) {
        if (item.dmgType) {
            const damage = `**${item.dmg1}** ${Variables.getDamageName(item.dmgType)}`;
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

    // Item properties
    for (let p of item.property || []) {
        if (typeof p === 'object') {
            p = p.uid;
        }

        let property = data.properties.get(p);
        if (!property) {
            p = p.split('|')[0];
            property = data.properties.get(p)!;
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

            const entry = entries[0] as any; // TODO
            const template = applyItemPropertyTemplate(item, entry, property.template).toLowerCase();
            properties.push(template);

            // Apply template to entries of entry (required for Extended Reach)
            for (let i = 0; i < entry.entries.length; i++) {
                entry.entries[i] = applyItemPropertyTemplate(item, entry, entry.entries[i]);
            }
            descriptions.push(...parseDescriptions(entry.name, entry.entries));
        }
    }

    return [properties, descriptions];
}

function parseItemMasteries(item: ItemBase, data: ItemData): [string[], Description[]] {
    const masteries: string[] = [];
    const descriptions: Description[] = [];

    // Item masteries
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
        const mastery = data.masteries.get(masteryKey)!;
        const propertyName = `mastery: ${mastery.name}${note}`.toLowerCase();
        const propertyDesc = parseDescriptions(mastery.name, mastery.entries);
        masteries.push(propertyName);
        descriptions.push(...propertyDesc);
    }

    return [masteries, descriptions];
}

function parseItem(item: ItemBase, fluffs: Fluff[], data: ItemData): ParsedItem {
    const fluff = findFluff(item, fluffs);

    const name = cleanDNDText(item.name);
    const source = item.source;
    const url = getItemsUrl(item.name, item.source);
    const image = getFluffImageUrl(fluff);
    const value = parseItemValue(item.value);
    let weight = parseItemWeight(item.weight);
    if (item.weightNote) {
        weight = `${weight} ${item.weightNote}`;
    }
    const reprint = parseReprint(item);
    const description: Description[] = [];

    const [type, typeDescriptions] = parseItemTypes(item, data);
    const [properties, propertyDescriptions] = parseItemProperties(item, data);
    const [masteries, masteryDescriptions] = parseItemMasteries(item, data);

    properties.push(...masteries);
    description.push(...typeDescriptions, ...propertyDescriptions, ...masteryDescriptions);

    return {
        name,
        source,
        url,
        image,
        value,
        weight,
        type,
        description,
        properties,
        reprint,
    };
}

export function getItems(databank: Databank): ParsedItem[] {
    // Resolve raw item data
    const items = [...databank.item, ...databank.baseitem];
    const data = new ItemData(databank);
    const fluffs = databank.itemFluff.map((fluff) => handleCopy(fluff, databank.itemFluff));

    return items.map((item) => {
        const resolved = (item = resolveItemEntry(handleCopy(item, items), databank.itemEntry));
        const parsed = parseItem(resolved, fluffs, data);
        return parsed;
    });
}

export function getItemVariants(databank: Databank): ParsedItem[] {
    const data = new ItemData(databank);
    const items = [...databank.item, ...databank.baseitem];
    const fluffs = databank.itemFluff.map((fluff) => handleCopy(fluff, databank.itemFluff));

    let variants: any[] = databank.magicvariant;
    const variantCopies = [...variants, ...items];
    variants = variants.flatMap((v) => handleCopy(v as Base, variantCopies));
    variants = variants.flatMap((m: any) => resolveMagicVariant(m, databank.baseitem as any[]));
    const seenVariants = new Set();
    const raw: any[] = [];
    for (const variant of variants) {
        const key = getKey(variant.name, variant.source);
        if (seenVariants.has(key)) continue;
        raw.push(resolveItemEntry(handleCopy(variant, items), databank.itemEntry));
        seenVariants.add(key);
    }
    return raw.map((variant) => parseItem(variant, fluffs, data));
}
