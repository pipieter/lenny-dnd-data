import { handleCopy, handleVersions } from '../5etools-conversion/copy';
import { findEntry } from '../5etools-conversion/find';
import { readJsonFile } from '../data';
import {
    Description,
    parseCreatureSummonSpell,
    parseCreatureTypes,
    parseDescriptions,
    parseSizes,
} from '../parser';
import { getBestiaryUrl, getCreatureTokenUrl } from '../urls';

const BASEPATH = '5etools-src/data/bestiary/';

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

function loadCreaturesFromIndex(): [any[], any[]] {
    const creatures: any[] = [];
    const fluffs: any[] = [];

    for (const file of ['fluff-index.json', 'index.json']) {
        const indexPath = BASEPATH + file;
        const indexData = readJsonFile(indexPath);

        for (const [_, sourceIndexFile] of Object.entries(indexData)) {
            const path = BASEPATH + sourceIndexFile;
            const data = readJsonFile(path);

            creatures.push(...(data.monster || []));
            fluffs.push(...(data.monsterFluff || []));
        }
    }

    return [creatures, fluffs];
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
    let filteredEntries: any[] = [];

    entries.forEach((entry: any) => {
        if (entry.type !== 'entries') return; // Only 'entries' hold information we'd want to use.
        if (entry.name) return; // Entries with names generally refer to races and books, not of use to us.

        filteredEntries.push(entry);
        if (filteredEntries.length >= 2) return; // Generally the first two entries are the actual descriptions of a creature.
    });

    return filteredEntries;
}

export function getCreatures(): Creature[] {
    const [baseCreatures, baseFluffs] = loadCreaturesFromIndex();

    const creatures: Creature[] = [];
    const fluffs: any[] = [];

    // Get creatures
    for (const creature of baseCreatures) {
        const fullCreature = handleCopy(creature, baseCreatures);
        const versions = handleVersions(fullCreature);
        creatures.push(fullCreature, ...versions);
    }

    // Get fluffs
    for (const fluff of baseFluffs) {
        const fullFluff = handleCopy(fluff, baseFluffs);
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
