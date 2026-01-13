import { name } from 'ts-interface-checker';
import { handleCopy, handleVersions } from '../5etools-conversion/copy';
import { findEntry } from '../5etools-conversion/find';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import {
    Description,
    DescriptionList,
    DescriptionTable,
    DescriptionType,
    List,
    parseAbilityScore,
    parseCreatureSummonSpell,
    parseCreatureTypes,
    parseDescriptions,
    parseSizes,
    Table,
} from '../parser';
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
    if (!creature.summonedByClass) return null;
    const parts = creature.summonedByClass.split('|');
    return `${parts[0]} (${parts[1]})`;
}

function getCreatureStats(creature: any): DescriptionTable {
    let stats = {
        str: creature.str ?? null,
        dex: creature.dex ?? null,
        con: creature.con ?? null,
        int: creature.int ?? null,
        wis: creature.wis ?? null,
        cha: creature.cha ?? null,
    };

    const statTable: Table = {
        type: 'table',
        title: 'Stats',
        headers: [''],
        rows: [['Score'], ['Mod.'], ['Save.']],
    };

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
        table: statTable,
    };
}

function getCreatureDetails(creature: any): DescriptionList {
    const list: List = {
        type: 'list',
        caption: '',
        entries: [],
    };

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
        list.entries.push(`**AC**: ${cleanDNDText(totalAC)}`);
    }

    if (creature.hp) {
        const hp = creature.hp;
        let totalHP = '';
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
        list.entries.push(`**HP**: ${cleanDNDText(totalHP)}`);
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
                else if (typeof s === 'boolean')
                    continue; // TODO Special movement types, like hovering.
                else if (s.condition) speeds.push(`${s.number} ft. ${s.condition}`);
                else throw `Unsupported creature-speed in ${creature.name}: ${JSON.stringify(creature.speed)}`;
            }
            results.push(`*${type}* ${joinStringsWithOr(speeds)}`);
        }
        const totalSpeed = results.join('; ');
        list.entries.push(`**Speed**: ${cleanDNDText(totalSpeed)}`);
    }

    if (creature.initiative) {
        const initiative = creature.initiative;
        let result;

        if (initiative.proficiency) result = initiative.proficiency.toString();
        else if (initiative.advantageMode)
            result = creature.dex.toString(); // TODO figure this out, is possibly more complex than just the dex value.
        else if (initiative.initiative != null) result = initiative.initiative.toString();
        else throw `Unsupported creature-initiative in ${creature.name}: ${JSON.stringify(initiative)}`; // TODO Should possible always revert to dex?

        list.entries.push(`**Initiative**: ${cleanDNDText(result)}`);
    }

    if (creature.skill) {
        const results: string[] = [];
        for (let [skill, value] of Object.entries(creature.skill) as [string, any][]) {
            value = variadic(value)[0]; // TODO -> multi-value support?
            if (skill === 'other') {
                if (value.oneOf) {
                    const other: string[] = [];
                    for (let [s, v] of Object.entries(value.oneOf) as [string, any][]) {
                        other.push(`${s} ${v}`);
                    }
                    results.push(`plus one of the following: ${joinStringsWithOr(other)}`);
                } else {
                    throw `Unsupported creature-skill (other) in ${creature.name}: ${JSON.stringify(value)}`;
                }
            } else results.push(`${skill} ${value}`);
        }
        const skills = results.join(', ');
        list.entries.push(`**Skills**: ${cleanDNDText(skills)}`);
    }

    if (creature.resist) {
        const results = [];
        const extra = [];
        for (const r of creature.resist) {
            if (typeof r === 'string') results.push(r);
            else if (r.resist) {
                const cond = r.resist.join(', ');
                extra.push(`${cond} ${r.note}`);
            } else if (r.special) results.push(r.special);
            else throw `Unsupported creature-resistance in ${creature.name}: ${JSON.stringify(creature.resist)}.`;
        }
        let resistances = results.join(', ');
        let conditions = extra.join(';');
        if (extra.length !== 0) resistances = resistances ? `${resistances}; ${conditions}` : conditions;

        // list.entries.push(`**Resistances**: ${cleanDNDText(resistances)}`);
        list.entries.push(`**Resistances**: ${resistances}`); // TODO Make parsing recursive, to support resistance exceptions within exceptions.
    }

    if (creature.immune) {
        // TODO conditionImmune
        const results = [];
        const extra = [];
        for (const i of creature.immune) {
            if (typeof i === 'string') results.push(i);
            else if (i.immune) {
                const cond = i.immune.join(', ');
                extra.push(`${cond} ${i.note}`);
            } else if (i.special) results.push(i.special);
            else throw `Unsupported creature-resistance in ${creature.name}: ${JSON.stringify(creature.immune)}.`;
        }
        let immunities = results.join(', ');
        let conditions = extra.join(';');
        if (extra.length !== 0) immunities = immunities ? `${immunities}; ${conditions}` : conditions;

        // list.entries.push(`**Immunities**: ${cleanDNDText(immunities)}`);
        list.entries.push(`**Immunities**: ${immunities}`); // TODO Make parsing recursive, to support immunities exceptions within exceptions.
    }

    if (creature.senses) {
        const senses = creature.senses.join(', ');
        list.entries.push(`**Senses**: ${cleanDNDText(senses)}`);
    }

    if (creature.languages) {
        const languages = creature.languages.join(', ');
        list.entries.push(`**Languages**: ${cleanDNDText(languages)}`);
    }

    if (creature.cr) {
        let result;
        if (typeof creature.cr === 'string') result = creature.cr;
        else if (creature.cr.cr) result = creature.cr.cr;
        else throw `Unsupported creature CR in ${creature.name}: ${JSON.stringify(creature.cr)}`;
        list.entries.push(`**CR**: ${result}`);
    }

    return {
        name: '',
        type: DescriptionType.list,
        list: list,
    };
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
        details: getCreatureDetails(creature),
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
