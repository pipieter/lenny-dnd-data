import { cleanDNDText, parseDescriptions, parseItemValue, parseItemWeight } from './parser';
import { getItemsUrl } from './urls';
import { joinStringsWithOr } from './util';

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
        const regex = /^.*\{\{item\.([^\}]*?)\}\}.*$/g;
        const matches = template.match(/^.*\{\{item\.([^\}]*?)\}\}.*$/g);
        if (matches === null) {
            hasRemainingTemplate = false;
        } else {
            for (const match of matches) {
                const field = match;
                const query = '{{item.' + field + '}}';
                const result = item[field];
                template = template.replace(query, result);
            }
        }
    }
    return template;
}

export function getItems(data: any): any[] {
    // TODO _copy items, item groups, item entries

    const items = [...data.item, ...data.baseitem];
    const types = mapItemTypes(data);
    const masteries = mapItemMasteries(data);
    const properties = mapItemProperties(data);

    const results = [];
    const toCopy = [];

    for (const item of items) {
        const url = getItemsUrl(item.name, item.source);

        if (item._copy) {
            toCopy.push(item);
            continue;
        }

        const result: any = {};

        result.name = cleanDNDText(item.name);
        result.source = item.source;
        result.url = url;
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
            const poisonTypesText = joinStringsWithOr(poisonTypes);
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
        result.description = parseDescriptions('', item.entries || [], url);
        result.properties = [];

        if (item.type) {
            const type = types.get(item.type.split('|')[0]) || [];
            result.description.push(...parseDescriptions('', type.entries || [], url));
        }

        // Item damage, if applicable
        if (item.dmg1) {
            const damage = `**{item['dmg1']}** ${DamageTypes.get(item.dmgType)}`;
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
                const entries = properties.get('entries') || properties.get('entriesTemplate') || [];
                if (entries.length === 0) continue;
                if (entries.length > 1) throw `Found property with more than one entry '${property.abbreviation}`;

                const entry = entries[0];
                const template = applyItemTemplate(item, entry, property.template).toLowerCase();
                result.properties.push(template);

                // Apply template to entries of entry (required for Extended Reach)
                for (let i = 0; i < entry.entries.length; i++) {
                    entry.entries[i] = applyItemTemplate(item, entry, item.entries[i]);
                }
                result.description.push(parseDescriptions(entry.name, entry.entries, url));
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
            const propertyName = `mastery: ${mastery.name}{note}`.toLowerCase();
            const propertyDesc = parseDescriptions(mastery.name, mastery.entries, url);
            result.properties.push(propertyName);
            result.description.push(...propertyDesc);
        }

        results.push(result);
    }

    // TODO
    while (toCopy.length > 0) break;

    return results;
}
