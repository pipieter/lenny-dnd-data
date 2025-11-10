import { handleCopy } from '../5etools-conversion/copy';
import { applySingleTemplate, applyTemplating } from '../5etools-conversion/template';
import {
    cleanDNDText,
    Description,
    parseDescriptions,
    parseImageUrl,
    parseItemValue,
    parseItemWeight,
} from '../parser';
import { DamageTypes } from '../5etools-conversion/data';
import { getItemsUrl } from '../urls';
import { joinStringsWithOr } from '../util';

interface Item {
    name: string;
    source: string;
    url: string;
    image: string | null;
    value: string | null;
    weight: string | null;
    type: string[];
    description: Description[];
    properties: string[];
}

function mapItemMasteries(data: any): Map<string, any> {
    const masteries = new Map<string, any>();

    for (const mastery of data.itemMastery || []) {
        const key = `${mastery.name}|${mastery.source}`;
        masteries.set(key, mastery);
    }

    return masteries;
}

function mapItemTypes(data: any): Map<string, any> {
    const types = new Map<string, any>();

    for (const type of data.itemType || []) {
        types.set(type.abbreviation, type);
    }

    return types;
}

function mapItemProperties(data: any): Map<string, any> {
    const properties = new Map<string, any>();

    for (const property of data.itemProperty || []) {
        properties.set(property.abbreviation, property);
    }

    return properties;
}

function applyItemPropertyTemplate(item: any, property: any, template: string): string {
    if (!template) return '';
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
    return template;
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

function resolveMagicVariant(variant: any, baseItems: readonly any[]): any[] {
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
        result.name =
            (variant.inherits.namePrefix || '') + item.name + (variant.inherits.nameSuffix || '');

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

function parseItem(item: any, data: any): Item {
    const fluff = getItemFluff(data.itemFluff, item.name, item.source);

    // TODO optimize these mappings beforehand
    const types = mapItemTypes(data);
    const masteries = mapItemMasteries(data);
    const properties = mapItemProperties(data);

    const url = getItemsUrl(item.name, item.source);
    const result: Item = {
        name: '',
        source: '',
        url: '',
        image: null,
        value: null,
        weight: null,
        type: [],
        description: [],
        properties: [],
    };

    result.name = cleanDNDText(item.name);
    result.source = item.source;
    result.url = url;
    result.image = parseImageUrl(fluff.images || []);
    result.value = parseItemValue(item.value);
    if (item.weightNote) {
        result.weight = `${parseItemWeight(item.weight)} (${item.weightNote})`;
    } else {
        result.weight = parseItemWeight(item.weight);
    }

    // Item type information, see render.js:11480 (getHtmlAndTextTypes)
    result.type = [];

    if (item.wondrous) result.type.push(item.tattoo ? 'wondrous item (tattoo)' : 'wondrous item');
    if (item.staff) result.type.push('staff');
    if (item.ammo) result.type.push('ammunition');
    if (item.age) result.type.push(item.age);

    if (item.weaponCategory) {
        if (item.baseItem) {
            const baseItem = item.baseItem.split('|')[0];
            result.type.push(`weapon (${baseItem})`);
        }
        result.type.push(`${item.weaponCategory} weapon`);
    }

    if (item.type) {
        const type = types.get(item.type.split('|')[0]);
        result.type.push(type.name.toLowerCase());
    }

    if (item.typeAlt) {
        const type = types.get(item.typeAlt.split('|')[0]);
        result.type.push(type.name.toLowerCase());
    }

    if (item.firearm) {
        result.type.push(item.firearm);
    }

    if (item.poison) {
        const poisonTypes = item.poisonTypes || [];
        const poisonTypesText = joinStringsWithOr(poisonTypes, false);
        if (poisonTypesText) {
            result.type.push(`poison (${poisonTypesText})`);
        } else {
            result.type.push('poison');
        }
    }

    if (item.rarity) {
        let attune = '';
        if (item.reqAttune) {
            if (item.reqAttune === true) attune = ' (requires attunement)';
            else if (item.reqAttune === 'optional') attune = ' (attunement optional)';
            else if (item.reqAttune.startsWith('by'))
                attune = ` (requires attunement ${cleanDNDText(item.reqAttune)})`;
        }

        if (item.rarity === 'none' || item.rarity.startsWith('unknown')) {
            // ...
        } else {
            result.type.push(`${item.rarity}${attune}`);
        }
    }

    // Item, item type, and property descriptions
    result.description = parseDescriptions('', item.entries || []);
    result.properties = [];

    if (item.type) {
        const type = types.get(item.type.split('|')[0]) || [];
        result.description.push(...parseDescriptions('', type.entries || []));
    }

    // Item damage, if applicable
    if (item.dmg1) {
        const damage = `**${item.dmg1}** ${DamageTypes.get(item.dmgType)}`;
        result.properties.push(damage);
    }

    // Item properties
    for (let p of item.property || []) {
        let note = null;
        if (typeof p === 'object') {
            note = p.note;
            p = p.uid;
        }

        let property = properties.get(p);
        if (!property) {
            p = p.split('|')[0];
            property = properties.get(p);
        }

        if (property.name === 'special') {
            result.properties.push('special');
        } else {
            const entries = property.entries || property.entriesTemplate || [];
            if (entries.length === 0) continue;
            if (entries.length > 1)
                throw `Found property with more than one entry '${property.abbreviation}`;

            const entry = entries[0];
            const template = applyItemPropertyTemplate(
                item,
                entry,
                property.template
            ).toLowerCase();
            result.properties.push(template);

            // Apply template to entries of entry (required for Extended Reach)
            for (let i = 0; i < entry.entries.length; i++) {
                entry.entries[i] = applyItemPropertyTemplate(item, entry, entry.entries[i]);
            }
            result.description.push(...parseDescriptions(entry.name, entry.entries));
        }
    }

    // Item masteries
    for (let masteryKey of item.mastery || []) {
        let note = '';
        if (typeof masteryKey === 'object') {
            note = ` (${masteryKey.note})`;
            masteryKey = masteryKey.uid;
        }
        const mastery = masteries.get(masteryKey);
        if (!mastery) continue;

        const propertyName = `mastery: ${mastery.name}${note}`.toLowerCase();
        const propertyDesc = parseDescriptions(mastery.name, mastery.entries);
        result.properties.push(propertyName);
        result.description.push(...propertyDesc);
    }

    return result;
}

export function getItems(data: any): any[] {
    // Resolve raw item data
    const items = [...data.item, ...data.baseitem];
    const raw: any[] = [];
    for (const item of items) {
        raw.push(resolveItemEntry(handleCopy(item, items), data.itemEntry));
    }

    return raw.map((item) => parseItem(item, data));
}

export function getItemVariants(data: any): any[] {
    const items = [...data.item, ...data.baseitem];
    const variants = data.magicvariant.flatMap((m: any) => resolveMagicVariant(m, data.baseitem));
    const raw: any[] = [];
    for (const variant of variants) {
        raw.push(resolveItemEntry(handleCopy(variant, items), data.itemEntry));
    }

    return raw.map((variant) => parseItem(variant, data));
}
