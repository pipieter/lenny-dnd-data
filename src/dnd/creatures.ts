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
import { calculateAbilityMod, formatModifier, joinStringsWithAnd, joinStringsWithOr, variadic } from '../util';

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
    const stats = {
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

        const mod = calculateAbilityMod(score);
        const save = creature.save?.[stat] ?? mod;

        statTable.headers?.push(parseAbilityScore(stat));
        statTable.rows[0].push(score.toString());
        statTable.rows[1].push(formatModifier(mod));
        statTable.rows[2].push(formatModifier(save));
    }

    return {
        name: 'Stats',
        type: DescriptionType.table,
        table: statTable,
    };
}

function parseAC(creature: any): string {
    const results: string[] = [];
    for (const ac of creature.ac) {
        if (typeof ac === 'number') results.push(ac.toString());
        else if (ac.special) results.push(ac.special);
        else if (ac.condition) results.push(`${ac.ac} ${ac.condition}`);
        else if (ac.from) results.push(`${ac.ac} (${joinStringsWithAnd(ac.from)})`);
        else throw `Unsupported creature-AC in ${creature.name}: ${JSON.stringify(ac)}`;
    }

    return joinStringsWithOr(results);
}

function parseHP(creature: any): string {
    const hp = creature.hp;

    if (typeof hp === 'number') return hp.toString();
    if (hp.special) return hp.special;
    if (hp.average) return hp.formula ? `${hp.average} (${hp.formula})` : hp.average.toString();
    throw `Unsupported creature-HP in ${creature.name}: ${JSON.stringify(hp)}`;
}

function parseSpeed(creature: any): string {
    const iterateSpeed = (speedBlock: any) => {
        const results: string[] = [];

        // eslint-disable-next-line prefer-const
        for (let [type, speed] of Object.entries(speedBlock) as [string, any][]) {
            if (type === 'alternate') {
                results.push(...iterateSpeed(speed));
                continue;
            }

            if (type == 'choose') continue; // TODO Choose speeds

            speed = variadic(speed);
            const speeds = [];

            for (const s of speed) {
                if (typeof s === 'number') speeds.push(`${s} ft.`);
                else if (typeof s === 'boolean')
                    continue; // TODO Special movement types, like hovering.
                else if (s.condition) speeds.push(`${s.number} ft. ${s.condition}`);
                else throw `Unsupported creature - speed in ${creature.name}: ${JSON.stringify(creature.speed)}`;
            }
            results.push(`*${type}* ${joinStringsWithOr(speeds)}`);
        }

        return results;
    }

    return iterateSpeed(creature.speed).join(', ').trim();
}

function parseInitiative(creature: any): string {
    const initiative = creature.initiative;

    if (initiative.proficiency) return initiative.proficiency.toString();
    if (initiative.advantageMode) return creature.dex.toString(); // TODO figure this out, is possibly more complex than just the dex value.
    if (initiative.initiative != null) return initiative.initiative.toString();

    throw `Unsupported creature - initiative in ${creature.name}: ${JSON.stringify(initiative)}`;
}

function parseSkills(creature: any): string {
    const iterateSkills = (s: any, isOneOf = false): string => {
        const entries = Object.entries(s) as [string, any][];
        const parts = entries.map(([skill, value]) => {
            const val = variadic(value)[0];

            if (skill === 'other') {
                if (!val.oneOf) throw `Unsupported creature skill(other) in ${creature.name}: ${JSON.stringify(val)}`;
                return `plus one of the following: ${iterateSkills(val.oneOf, true)}`;
            }

            return `${skill} ${val}`;
        });

        return isOneOf ? joinStringsWithOr(parts) : parts.join(', ');
    };

    return iterateSkills(creature.skill || {});
}

function parseResistances(creature: any): string {
    // TODO Use of sublists could make rendering clearer.
    const iterateResistances = (resists: any): { results: string[]; extra: string[] } => {
        const results: string[] = [];
        const extra: string[] = [];

        for (const r of resists) {
            if (typeof r === 'string') results.push(r);
            else if (r.special) results.push(r.special);
            else if (r.resist) {
                const iterated = iterateResistances(r.resist);
                const prefix = r.preNote ?? '';
                const suffix = r.note ?? '';
                const innerResistances = iterated.results.join(', ');
                let inner = `${prefix} ${innerResistances} ${suffix}`.trim();
                if (iterated.extra.length > 0) inner = inner + '; ' + joinStringsWithAnd(iterated.extra);
                extra.push(inner);
            } else throw `Unsupported creature - resistance in ${creature.name}: ${JSON.stringify(r)}.`;
        }

        return { results, extra };
    };

    const resistances = iterateResistances(creature.resist);
    const main = resistances.results.join(', ');
    const special = resistances.extra.join(', ');
    if (resistances.results.length == 0) return special;
    if (resistances.extra.length != 0) return `${main}; ${special}`;
    return main;
}

function parseImmunities(creature: any): string {
    // TODO Use of sublists could make rendering clearer.
    // TODO add conditionImmune, currently only shows damage immunities.
    const iterateImmunities = (immunities: any): { results: string[]; extra: string[] } => {
        const results: string[] = [];
        const extra: string[] = [];

        for (const i of immunities) {
            if (typeof i === 'string') results.push(i);
            else if (i.special) results.push(i.special);
            else if (i.immune) {
                const iterated = iterateImmunities(i.immune);
                const prefix = i.preNote ?? '';
                const suffix = i.note ?? '';
                const innerResistances = iterated.results.join(', ');
                let inner = `${prefix} ${innerResistances} ${suffix}`.trim();
                if (iterated.extra.length > 0) inner = inner + '; ' + joinStringsWithAnd(iterated.extra);
                extra.push(inner);
            } else throw `Unsupported creature - immunities in ${creature.name}: ${JSON.stringify(i)}.`;
        }

        return { results, extra };
    };

    const immunities = iterateImmunities(creature.immune);
    const main = immunities.results.join(', ');
    const special = immunities.extra.join(', ');
    if (immunities.results.length == 0) return special;
    if (immunities.extra.length != 0) return `${main}; ${special}`;
    return main;
}

function parseCR(creature: any): string {
    if (typeof creature.cr === 'string') return creature.cr;
    else if (creature.cr.cr) return creature.cr.cr;
    throw `Unsupported creature CR in ${creature.name}: ${JSON.stringify(creature.cr)} `;
}

function getCreatureDetails(creature: any): DescriptionList {
    const list: List = { type: 'list', caption: '', entries: [] };

    if (creature.ac) list.entries.push(`**AC**: ${parseAC(creature)}`);
    if (creature.hp) list.entries.push(`**HP**: ${parseHP(creature)}`);
    if (creature.speed) list.entries.push(`**Speed**: ${parseSpeed(creature)}`);
    if (creature.initiative) list.entries.push(`**Initiative**: ${parseInitiative(creature)}`);
    if (creature.skill) list.entries.push(`**Skills**: ${parseSkills(creature)}`);
    if (creature.resist) list.entries.push(`**Resistances**: ${parseResistances(creature)}`);
    if (creature.immune) list.entries.push(`**Immunities**: ${parseImmunities(creature)}`);
    if (creature.senses) {
        const senses = creature.senses.join(', ');
        list.entries.push(`**Senses**: ${senses}`);
    }
    if (creature.languages) {
        const languages = creature.languages.join(', ');
        list.entries.push(`**Languages**: ${languages}`);
    }
    if (creature.cr) list.entries.push(`**CR**: ${parseCR(creature)}`);

    list.entries = list.entries.map((entry: string | List) =>
        typeof entry === 'string' ? cleanDNDText(entry as string).trim() : entry
    );
    return { name: '', type: DescriptionType.list, list: list };
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
        details: getCreatureDetails(creature), // TODO Possibly not store all values in details, would be easier to customize things in front-end.
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
