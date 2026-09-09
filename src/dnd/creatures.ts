import { resolveToBase } from '../5etools-conversion/copy';
import { FluffBase } from '../../5etools-collector/types/fluff';
import { AbilityString, Speed } from '../../5etools-collector/types/internal/base';
import { Entry } from '../../5etools-collector/types/internal/entry';
import { MonsterBase } from '../../5etools-collector/types/monster';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import {
    Description,
    DescriptionList,
    DescriptionTable,
    DescriptionType,
    List,
    ReprintData,
    Table,
    parseAdvantage,
    parseCreatureSummonSpell,
    parseCreatureTypes,
    parseDescriptions,
    parseReprint,
    parseSizes,
} from '../parser';
import { getBestiaryUrl, getCreatureTokenUrl } from '../urls';
import {
    calculateAbilityMod,
    findFluff,
    formatModifier,
    joinStringsWithAnd,
    joinStringsWithOr,
    variadic,
} from '../util';
import { resolve } from 'path';

export interface ParsedCreature {
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
    traits: Description[];
    actions: Description[];
    bonusActions: Description[];

    reprint: ReprintData | null;
}

function parseCreatureSummonClass(summonedByClass: string | undefined): string | null {
    if (!summonedByClass) return null;
    const parts = summonedByClass.split('|');
    return `${parts[0]} (${parts[1]})`;
}

function getCreatureStats(creature: MonsterBase): DescriptionTable {
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

        statTable.headers?.push(stat.toUpperCase());
        statTable.rows[0].push(score.toString());

        const mod = typeof score !== 'number' ? score.special : calculateAbilityMod(score);
        statTable.rows[1].push(formatModifier(mod));

        const save = creature.save?.[stat as keyof AbilityString] ?? mod;
        statTable.rows[2].push(formatModifier(save));
    }

    return {
        name: 'Stats',
        type: DescriptionType.table,
        table: statTable,
    };
}

function parseAC(creature: MonsterBase): string {
    const results: string[] = [];
    if (!creature.ac) throw 'Unsupported - Creature AC is undefined';

    for (const ac of creature.ac) {
        if (typeof ac === 'number') results.push(ac.toString());
        else if ('special' in ac) results.push(ac.special);
        else if (ac.condition) results.push(`${ac.ac} ${ac.condition}`);
        else if (ac.from) results.push(`${ac.ac} (${joinStringsWithAnd(ac.from)})`);
        else if (ac.ac) results.push(`${ac.ac}`);
        else throw `Unsupported creature-AC in ${creature.name}: ${JSON.stringify(ac)}`;
    }

    return joinStringsWithOr(results);
}

function parseHP(creature: MonsterBase): string {
    if (!creature.hp) throw 'Unsupported - Creature HP is undefined';
    const hp = creature.hp;

    if (typeof hp === 'number') return hp.toString();
    if ('special' in hp) return hp.special;
    if ('average' in hp) return hp.formula ? `${hp.average} (${hp.formula})` : hp.average.toString();
    throw `Unsupported creature-HP in ${creature.name}: ${JSON.stringify(hp)}`;
}

function parseSpeed(creature: MonsterBase): string {
    const iterateSpeed = (speedBlock: Speed | undefined) => {
        const results: string[] = [];
        if (!speedBlock) throw 'Unsupported: Creature-speed is undefined.';

        // TODO - Rewrite with strict typing.
        // eslint-disable-next-line prefer-const
        for (let [type, speed] of Object.entries(speedBlock)) {
            if (type === 'alternate') {
                results.push(...iterateSpeed(speed));
                continue;
            }

            if (type == 'choose') {
                const options = joinStringsWithOr(speed.from, false);
                results.push(`*${options}* ${speed.amount} ft. ${speed.note}`.trim());
                continue;
            }

            speed = variadic(speed);
            const speeds = [];

            for (const s of speed) {
                if (typeof s === 'number') speeds.push(`${s} ft.`);
                else if (typeof s === 'boolean') {
                    switch (type) {
                        case 'canHover':
                            speeds.push(`(hover)`);
                            break;

                        default:
                            throw `Unsupported creature speed movement-type in ${creature.name}: ${type}`;
                    }
                } else if (s.condition) speeds.push(`${s.number} ft. ${s.condition}`);
                else throw `Unsupported creature - speed in ${creature.name}: ${JSON.stringify(creature.speed)}`;
            }
            results.push(`*${type}* ${joinStringsWithOr(speeds)}`);
        }

        return results;
    };

    return iterateSpeed(creature.speed).join(', ').trim();
}

function parseInitiative(creature: MonsterBase): string {
    const initiative = creature.initiative;

    if (initiative.proficiency) return initiative.proficiency.toString();
    if (initiative.initiative != null) return initiative.initiative.toString();
    if (initiative.advantageMode && creature.dex && typeof creature.dex === 'number') {
        const mod = calculateAbilityMod(creature.dex);
        const advantage = parseAdvantage(initiative.advantageMode);
        return `${formatModifier(mod)} (with ${advantage})`;
    }
    if (typeof initiative === 'number') return initiative.toString();

    throw `Unsupported creature - initiative in ${creature.name}: ${JSON.stringify(initiative)}`;
}

function parseSkills(creature: MonsterBase): string {
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

function parseResistances(creature: MonsterBase): string {
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

function parseImmunities(creature: MonsterBase): string {
    // TODO Use of sublists could make rendering clearer.
    const iterateImmunities = (immunities: any): { results: string[]; extra: string[] } => {
        const results: string[] = [];
        const extra: string[] = [];

        for (const i of immunities) {
            if (typeof i === 'string') {
                const parts = i.split('|'); // Some homebrew creatures have conditions which specify a source (e.g. burning|MonstersOfDrakkenheim)
                results.push(cleanDNDText(parts[0]));
            } else if (i.immune || i.conditionImmune) {
                const nestedList = i.immune || i.conditionImmune;
                const iterated = iterateImmunities(nestedList);

                const prefix = i.preNote ?? '';
                const suffix = i.note ?? '';
                const innerResistances = iterated.results.join(', ');

                let inner = `${prefix} ${innerResistances} ${suffix}`.trim();
                if (iterated.extra.length > 0) inner = inner + '; ' + joinStringsWithAnd(iterated.extra);
                extra.push(inner);
            } else if (i.special) results.push(i.special);
            else throw `Unsupported creature - immunities in ${creature.name}: ${JSON.stringify(i)}.`;
        }

        return { results, extra };
    };

    const finalParts: string[] = [];

    const processCategory = (list?: any[]) => {
        if (!list || !list.length) return;
        const { results, extra } = iterateImmunities(list);
        if (results.length) finalParts.push(results.join(', '));
        if (extra.length) finalParts.push(extra.join('; '));
    };

    processCategory(creature.immune);
    processCategory(creature.conditionImmune);

    return finalParts.join('; ');
}

function parseCR(creature: MonsterBase): string | null {
    if (!creature.cr) return null;
    if (typeof creature.cr === 'string') return creature.cr;
    else if (creature.cr.cr) return creature.cr.cr;
    throw `Unsupported creature CR in ${creature.name}: ${JSON.stringify(creature.cr)} `;
}

function getCreatureDetails(creature: MonsterBase): DescriptionList {
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

    const cr = parseCR(creature);
    if (cr) list.entries.push(`**CR**: ${cr}`);

    list.entries = list.entries.map((entry: string | List) =>
        typeof entry === 'string' ? cleanDNDText(entry as string).trim() : entry
    );
    return { name: '', type: DescriptionType.list, list: list };
}

function buildCreature(creature: MonsterBase, fluff: FluffBase | undefined): ParsedCreature {
    const name = creature.name;
    const source = creature.source;

    return {
        name,
        source,
        subtitle: getSubtitle(creature),
        summonedBySpell: parseCreatureSummonSpell(creature.summonedBySpell),
        summonedByClass: parseCreatureSummonClass(creature.summonedByClass),
        tokenUrl: creature.hasToken ? getCreatureTokenUrl(name, source) : null,
        url: getBestiaryUrl(name, source),
        description: getDescriptions(creature),
        fluffInfo: getDescriptions(fluff),
        stats: getCreatureStats(creature),
        details: getCreatureDetails(creature), // TODO Possibly not store all values in details, would be easier to customize things in front-end.
        traits: creature.trait?.flatMap((trait: any) => parseDescriptions(trait.name, trait.entries)) ?? [],
        actions: creature.action?.flatMap((action: any) => parseDescriptions(action.name, action.entries)) ?? [],
        bonusActions: creature.bonus?.flatMap((bonus: any) => parseDescriptions(bonus.name, bonus.entries)) ?? [],
        reprint: parseReprint(creature),
    };
}

function getSubtitle(data: MonsterBase): string | null {
    const size = data.size ? parseSizes(data.size) : '';
    const type = data.type ? parseCreatureTypes(data.type) : '';

    const text = (size + ' ' + type).trim();
    if (text.length == 0) return null;
    return text;
}

function getDescriptions(data: MonsterBase | FluffBase | undefined): Description[] {
    if (!data || !('entries' in data) || !data.entries) return [];
    const filteredEntries = filterEntries(data.entries);
    return parseDescriptions('', filteredEntries);
}

function filterEntries(entries: Entry[]): any[] {
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

export function getCreatures(data: Databank): ParsedCreature[] {
    const fluffs = data.monsterFluff.flatMap((fluff) => {
        return resolveToBase(fluff, data.monsterFluff);
    });

    return data.monster.flatMap((creatures) => {
        return resolveToBase(creatures, data.monster).map((creature) => {
            const fluff = findFluff(creature, fluffs) as FluffBase | undefined;
            return buildCreature(creature, fluff);
        });
    });
}
