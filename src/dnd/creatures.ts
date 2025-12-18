import { handleCopy, handleVersions } from '../5etools-conversion/copy';
import { findEntry } from '../5etools-conversion/find';
import { Databank } from '../data';
import { Description, parseCreatureSummonSpell, parseCreatureTypes, parseDescriptions, parseSizes } from '../parser';
import { getBestiaryUrl, getCreatureTokenUrl } from '../urls';

interface Creature {
    name: string;
    source: string;
    url: string;
    subtitle: string | null;
    tokenUrl: string | null;
    summonedBySpell: string | null;

    description: Description[];
    fluffInfo: Description[];
}

function buildCreature(creature: any, fluff: any | null): Creature {
    const name = creature.name;
    const source = creature.source;
    const url = getBestiaryUrl(name, source);
    const description = getDescriptions(creature);
    const fluffInfo = getDescriptions(fluff);
    const subtitle = getSubtitle(creature);
    const summonedBySpell = parseCreatureSummonSpell(creature.summonedBySpell);
    const tokenUrl = creature.hasToken ? getCreatureTokenUrl(name, source) : null;

    return {
        name,
        source,
        subtitle,
        summonedBySpell,
        tokenUrl,
        url,
        description,
        fluffInfo,
    };
}

function getSubtitle(data: any): string | null {
    const sizeData = data.size;
    const typeData = data.type;

    const size = sizeData ? parseSizes(sizeData) : null;
    const type = typeData ? parseCreatureTypes(typeData) : null;

    if (!size && !type) return null;

    const text = size + ' ' + type;
    return text.trim();
}

function getDescriptions(data: any | null): Description[] {
    const entries = data?.entries || [];
    if (!entries) return [];
    const filteredEntries = filterEntries(entries);
    return parseDescriptions('', filteredEntries);
}

function filterEntries(entries: any[]): any[] {
    // Creatures generally have way too many entries, impacting performance heavily. We pre-cut entries we may not need.
    const filteredEntries: any[] = [];

    entries.forEach((entry: any) => {
        if (entry.type !== 'entries') return; // Only 'entries' hold information we'd want to use.
        if (entry.name) return; // Entries with names generally refer to races and books, not of use to us.

        filteredEntries.push(entry);
        if (filteredEntries.length >= 2) return; // Generally the first two entries are the actual descriptions of a creature.
    });

    return filteredEntries;
}

export function getCreatures(databank: Databank): Creature[] {
    const creatures: Creature[] = [];
    const fluffs: any[] = [];

    // Get creatures
    for (const creature of databank.monster) {
        const fullCreature = handleCopy(creature, databank.monster);
        const versions = handleVersions(fullCreature);
        creatures.push(fullCreature, ...versions);
    }

    // Get fluffs
    for (const fluff of databank.monsterFluff) {
        const fullFluff = handleCopy(fluff, databank.monsterFluff);
        const versions = handleVersions(fullFluff);
        fluffs.push(fullFluff, ...versions);
    }

    // Parse creatures
    const parsed: Creature[] = [];
    for (const creature of creatures) {
        const fluff = findEntry(fluffs, creature.name, creature.source);
        parsed.push(buildCreature(creature, fluff));
    }

    return parsed;
}
