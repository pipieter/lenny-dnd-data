import { name } from 'ts-interface-checker';
import { handleCopy, handleVersions } from '../5etools-conversion/copy';
import { findEntry } from '../5etools-conversion/find';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, DescriptionList, DescriptionTable, DescriptionType, List, parseAbilityScore, parseCreatureSummonSpell, parseCreatureTypes, parseDescriptions, parseSizes, Table } from '../parser';
import { getBestiaryUrl, getCreatureTokenUrl } from '../urls';
import { calculateAbilityMod, joinStringsWithAnd, joinStringsWithOr, variadic } from '../util';

interface Creature {
    name: string;
    source: string;
    url: string;
    subtitle: string | null;
    tokenUrl: string | null;
    summonedBySpell: string | null;
    summonedByClass: string | null;

    description: Description[];
    fluffInfo: Description[];
    stats: DescriptionTable;
    details: DescriptionList;
}

function parseCreatureSummonClass(creature: any): string | null {
    if (!creature.summonedByClass) return null
    const parts = creature.summonedByClass.split("|");
    return `${parts[0]} (${parts[1]})`
}

function getCreatureStats(creature: any): DescriptionTable {
    let stats = {
        'str': creature.str ?? null,
        'dex': creature.dex ?? null,
        'con': creature.con ?? null,
        'int': creature.int ?? null,
        'wis': creature.wis ?? null,
        'cha': creature.cha ?? null
    }

    const statTable: Table = {
        type: 'table',
        title: 'Stats',
        headers: [""],
        rows: [['Score'], ['Mod.'], ['Save.']]
    }

    for (const [stat, score] of Object.entries(stats)) {
        if (score === null) continue;

        let mod = calculateAbilityMod(score);
        const save = creature.stats?.[stat] ?? mod;
        statTable.headers?.push(parseAbilityScore(stat));
        statTable.rows[0].push(score.toString());
        statTable.rows[1].push(mod.toString());
        statTable.rows[2].push(save.toString()); // TODO, seemingly doesn't work (Drake Companion)?
    }

    return {
        name: 'Stats',
        type: DescriptionType.table,
        table: statTable
    }
}

function getCreatureDetails(creature: any): DescriptionList {
    const list: List = {
        type: 'list',
        caption: '',
        entries: []
    }

    if (creature.ac) {
        const results: string[] = [];
        for (const ac of creature.ac) {
            if (typeof ac === 'number') {
                results.push(ac.toString());
            } else if (ac.special) {
                results.push(ac.special);
            } else if (ac.condition) {
                results.push(`${ac.ac} ${ac.condition}`);
            } else if (ac.from) {
                results.push(`${ac.ac} (${joinStringsWithAnd(ac.from)})`);
            } else {
                throw `Unsupported creature-AC: ${JSON.stringify(ac)}`;
            }
        }
        const totalAC = joinStringsWithOr(results);
        list.entries.push(`**AC**: ${cleanDNDText(totalAC)}`)
    }

    if (creature.hp) {
        const hp = creature.hp;
        let totalHP = "";
        if (typeof hp === 'number') {
            totalHP = hp.toString();
        } else if (hp.special) {
            totalHP = hp.special;
        } else if (hp.average) {
            totalHP = hp.formula ? `${hp.average} (${hp.formula})` : hp.average.toString();
        } else {
            throw `Unsupported creature-HP: ${JSON.stringify(hp)}`;
        }
        // TODO Companion special HP
        list.entries.push(`**HP**: ${cleanDNDText(totalHP)}`)
    }

    if (creature.speed) {
        const results: string[] = [];
        for (let [type, speed] of Object.entries(creature.speed) as [string, any][]) {
            speed = variadic(speed);
            const speeds = [];

            if (type === 'alternate') continue; // TODO Alternate movement speeds.
            if (type == 'choose') continue; // TODO Choose speeds

            for (const s of speed) {
                if (typeof s === 'number') speeds.push(`${s} ft.`);
                else if (typeof s === 'boolean') continue; // TODO Special movement types, like hovering.
                else if (s.condition) speeds.push(`${s.number} ft. ${s.condition}`);
                else throw `Unsupported creature-speed in ${creature.name}: ${JSON.stringify(creature.speed)}`
            }
            results.push(`*${type}* ${joinStringsWithOr(speeds)}`);
        }
        const totalSpeed = results.join('; ');
        list.entries.push(`**Speed**: ${cleanDNDText(totalSpeed)}`)
    }

    return {
        name: '',
        type: DescriptionType.list,
        list: list,
    }
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
        summonedByClass: parseCreatureSummonClass(creature),
        tokenUrl,
        url,
        description,
        fluffInfo,
        stats: getCreatureStats(creature),
        details: getCreatureDetails(creature)
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
