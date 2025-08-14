import { handleCopy } from './5etools-conversion/copy';
import {
    cleanDNDText,
    parseDescriptions,
    parseImageUrl,
    parseItemValue,
    parseItemWeight,
} from './parser';
import { getItemsUrl } from './urls';
import { joinStringsWithOr } from './util';

// TODO move this to 5etools-conversion/data.ts
const DamageTypes = new Map([
    ['A', 'Acid'],
    ['B', 'Bludgeoning'],
    ['C', 'Cold'],
    ['F', 'Fire'],
    ['O', 'Force'],
    ['L', 'Lightning'],
    ['N', 'Necrotic'],
    ['P', 'Piercing'],
    ['I', 'Poison'],
    ['Y', 'Psychic'],
    ['R', 'Radiant'],
    ['S', 'Slashing'],
    ['T', 'Thunder'],
]);

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

function applyItemTemplate(item: any, entry: any, template: string): string {
    template = template.replaceAll('{{prop_name}}', entry.name);
    template = template.replaceAll('{{prop_name_lower}}', entry.name.toLowerCase());

    let hasRemainingTemplate = true;
    while (hasRemainingTemplate) {
        const regex = /^.*\{\{item\.([^\}]*?)\}\}.*$/;
        const matches = template.match(regex);
        if (matches === null) {
            hasRemainingTemplate = false;
        } else {
            const field = matches[1];
            let result = item[field];
            if (typeof result === 'string') {
                result = result.split('|')[0]; // Sometimes specifics like sources will be shown, such as 'crossbow bolt|phb'
            }
            template = template.replace('{{item.' + field + '}}', result);
        }
    }
    return template;
}

function getItemImage(data: any, name: string, source: string): string | null {
    for (const item of data.itemFluff || []) {
        if (item.name === name && item.source === source) {
            if (item.images) {
                return parseImageUrl(item.images);
            } else if (item._copy) {
                return getItemImage(data, item._copy.name, item._copy.source);
            }
        }
    }
    return null;
}

function findItemEntry(entries: any[], name: string, source: string): any {
    for (const entry of entries) {
        if (entry.name === name && entry.source === source) {
            return entry;
        }
    }
    throw `Item entry not found ${name} (${source})`;
}

// TODO look at render.js:4778 applyTemplate
// TODO make this more generic, by allowing a prefix such as 'item.'
// TODO move this 5etools-conversion/copy.ts
function resolveItemEntryTemplating(item: any, obj: any): any {
    obj = structuredClone(obj);

    if (!obj) return obj;

    // TODO this seems like double work, considering parser and parseDescriptions
    // Look into cleaning this up

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = resolveItemEntryTemplating(item, obj[i]);
        }
        return obj;
    }

    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            obj[key] = resolveItemEntryTemplating(item, obj[key]);
        }
        return obj;
    }

    if (typeof obj === 'string') {
        for (const key of Object.keys(item)) {
            obj = obj.replaceAll(`{{item.${key}}}`, item[key]);
            if (typeof item[key] === 'string') {
                obj = obj.replaceAll(`{{item.${key}}}_lower`, item[key].toLocaleLowerCase());
            }

            // TODO Specific case for Dragon Scale Mail, this needs to be fixed
            obj = obj.replaceAll(`{{getFullImmRes item.resist}}`, item.resist);
        }
        return obj;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }

    throw `resolveItemEntryTemplating: Unsupported obj type ${typeof obj}`;
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

    item = resolveItemEntryTemplating(item, item);

    return item;
}

export function getItems(data: any): any[] {
    // TODO _copy items, item groups, item entries

    // Resolve raw item data
    const items = [...data.item, ...data.baseitem];
    const raw: any[] = [];
    for (const item of items) {
        raw.push(resolveItemEntry(handleCopy(item, items), data.itemEntry));
    }

    const types = mapItemTypes(data);
    const masteries = mapItemMasteries(data);
    const properties = mapItemProperties(data);

    const results = [];

    for (const item of raw) {
        const url = getItemsUrl(item.name, item.source);
        const result: any = {};

        result.name = cleanDNDText(item.name);
        result.source = item.source;
        result.url = url;
        result.image = getItemImage(data, item.name, item.source);
        result.value = parseItemValue(item.value);
        if (item.weightNote) {
            result.weight = `${parseItemWeight(item.weight)} (${item.weightNote})`;
        } else {
            result.weight = parseItemWeight(item.weight);
        }

        // Item type information, see render.js:11480 (getHtmlAndTextTypes)
        result.type = [];

        if (item.wondrous)
            result.type.push(item.tattoo ? 'wondrous item (tattoo)' : 'wondrous item');
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
                const template = applyItemTemplate(item, entry, property.template).toLowerCase();
                result.properties.push(template);

                // Apply template to entries of entry (required for Extended Reach)
                for (let i = 0; i < entry.entries.length; i++) {
                    entry.entries[i] = applyItemTemplate(item, entry, entry.entries[i]);
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
            const propertyName = `mastery: ${mastery.name}${note}`.toLowerCase();
            const propertyDesc = parseDescriptions(mastery.name, mastery.entries);
            result.properties.push(propertyName);
            result.description.push(...propertyDesc);
        }

        results.push(result);
    }

    return results;
}
