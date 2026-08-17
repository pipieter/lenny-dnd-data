import { title } from './parser';
import { read, readJsonFile } from './read';
import { Rule } from './dnd/rules';
import { Hazard } from './dnd/hazards';
import { TableData } from './dnd/tables';
import { Action } from './dnd/actions';
import { Feat } from './dnd/feats';
import { Skill } from './dnd/skills';
import { SpeciesName } from './dnd/names';
import { Vehicle, VehicleUpgrade } from './dnd/vehicles';
import { DNDObject } from './dnd/objects';
import { existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { Deity } from './dnd/deities';
import { Cult } from './dnd/cults';
import { Boon } from './dnd/boons';
import { LifeBackground, LifeClass } from './dnd/life';
import { rawData } from './5etools-conversion/rawdata';
import { ParsedSource } from './dnd/sources';

export function getKey(name: string, source: string): string {
    return `${title(name)} (${source.toUpperCase()})`;
}

export function write(path: string, contents: object[]) {
    const directory = dirname(path);
    if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
    writeFileSync(path, JSON.stringify(contents, null, 1), 'utf-8');
}

export class Databank {
    // Spells
    public readonly spell: any[] = [];
    public readonly spellFluff: any[] = [];
    public readonly spellSource: any[] = [];
    // Items
    public readonly item: any[] = [];
    public readonly baseitem: any[] = [];
    public readonly itemGroup: any[] = [];
    public readonly itemProperty: any[] = [];
    public readonly itemType: any[] = [];
    public readonly itemTypeAdditionalEntries: any[] = [];
    public readonly itemEntry: any[] = [];
    public readonly itemMastery: any[] = [];
    public readonly magicvariant: any[] = [];
    public readonly itemFluff: any[] = [];
    // Conditions
    public readonly condition: any[] = [];
    public readonly status: any[] = [];
    public readonly disease: any[] = [];
    public readonly conditionFluff: any[] = [];
    public readonly statusFluff: any[] = [];
    public readonly diseaseFluff: any[] = [];
    // Creatures
    public readonly monster: any[] = [];
    public readonly monsterFluff: any[] = [];
    // Languages
    public readonly language: any[] = [];
    public readonly languageFluff: any[] = [];
    public readonly languageScript: any[] = [];
    // Classes
    public readonly class: any[] = [];
    public readonly classFeature: any[] = [];
    public readonly subclass: any[] = [];
    public readonly subclassFeature: any[] = [];
    public readonly classFluff: any[] = [];
    public readonly subclassFluff: any[] = [];
    // Rules
    public readonly variantrule: Rule[] = [];
    public readonly sense: any[] = [];
    // Hazards
    public readonly trap: Hazard[] = [];
    public readonly hazard: Hazard[] = [];
    public readonly trapFluff: any[] = [];
    public readonly hazardFluff: any[] = [];
    // Books and adventures
    public readonly book: any[] = [];
    public readonly adventure: any[] = [];
    // Actions
    public readonly action: Action[] = [];
    // Tables
    public readonly table: TableData[] = [];
    public readonly tableGroup: any[] = [];
    // Backgrounds
    public readonly background: any[] = [];
    public readonly backgroundFluff: any[] = [];
    // Feats
    public readonly feat: Feat[] = [];
    public readonly optionalfeature: any[] = [];
    // Skills
    public readonly skill: Skill[] = [];
    // Names
    public readonly name: SpeciesName[] = [];
    // Species
    public readonly race: any[] = [];
    public readonly subrace: any[] = [];
    public readonly raceFluff: any[] = [];
    // Vehicles
    public readonly vehicle: Vehicle[] = [];
    public readonly vehicleUpgrade: VehicleUpgrade[] = [];
    public readonly vehicleFluff: any = [];
    // Objects
    public readonly object: DNDObject[] = [];
    public readonly objectFluff: any[] = [];
    // Deities
    public readonly deity: Deity[] = [];
    // Cults
    public readonly cult: Cult[] = [];
    // Boons
    public readonly boon: Boon[] = [];
    // Life
    public readonly lifeClass: LifeClass[] = [];
    public readonly lifeBackground: LifeBackground[] = [];
    public readonly lifeTrinket: any[] = [];

    public get(key: string): any[] {
        if ((this as any)[key] === undefined) {
            throw new Error(`Databank error: key '${key}' not found!`);
        }
        return (this as any)[key];
    }

    public add(path: string) {
        // Keys that will not be handled
        const keysToIgnore = ['_meta', '_test', 'linkedLootTables', 'raceFluffMeta'];

        const data = read(path);
        for (const key of Object.keys(data)) {
            if (keysToIgnore.includes(key)) continue;

            this.get(key).push(...data[key]);
        }
    }

    /**
     * Spell sources are stored in a very special way, and thus need to be
     * handled separately.
     * @param source The source path of the spellcasters
     */
    public addSpellSource(path: string) {
        const data = read(path);
        for (const source of Object.keys(data)) {
            for (const spell of Object.keys(data[source])) {
                const classes = [...(data[source][spell].class || []), ...(data[source][spell].classVariant || [])];
                const parsed = classes.map((class$) => ({
                    spellName: spell,
                    spellSource: source,
                    casterName: class$.name,
                    casterSource: class$.source,
                }));
                this.spellSource.push(...parsed);
            }
        }
    }

    public search(key: string, name: string, source: string): any | undefined {
        const entries = this.get(key);
        return entries.find((entry) => entry.name === name && entry.source === source);
    }

    public getAllSources(): Set<string> {
        const sources = new Set<string>();
        const keys = Object.keys(this) as (keyof Databank)[];

        for (const key of keys) {
            const value = this[key];

            if (!Array.isArray(value)) continue;
            for (const entry of value) {
                if (typeof entry === 'string') continue;
                if (entry && 'source' in entry) {
                    sources.add(entry.source);
                }
            }
        }
        return sources;
    }

    public getSourceData(sourceId: string): ParsedSource {
        throw 'getSourceData not implemented on this Databank type!';
    }
}

export class OfficialDatabank extends Databank {
    private getFullPath(path: string): string {
        return `5etools-src/data/${path}`;
    }

    public override add(path: string) {
        super.add(this.getFullPath(path));
    }

    public override addSpellSource(path: string) {
        super.addSpellSource(this.getFullPath(path));
    }

    constructor() {
        super();

        this.add('actions.json');
        this.add('adventures.json');
        this.add('backgrounds.json');
        this.add('bestiary/fluff-index.json');
        this.add('bestiary/index.json');
        this.add('books.json');
        this.add('class/index.json');
        this.add('conditionsdiseases.json');
        this.add('cultsboons.json');
        this.add('deities.json');
        this.add('feats.json');
        this.add('fluff-backgrounds.json');
        this.add('fluff-conditionsdiseases.json');
        this.add('fluff-items.json');
        this.add('fluff-languages.json');
        this.add('fluff-objects.json');
        this.add('fluff-races.json');
        this.add('fluff-trapshazards.json');
        this.add('generated/gendata-tables.json');
        this.add('generated/gendata-variantrules.json');
        this.add('items-base.json');
        this.add('items.json');
        this.add('languages.json');
        this.add('life.json');
        this.add('magicvariants.json');
        this.add('names.json');
        this.add('objects.json');
        this.add('optionalfeatures.json');
        this.add('races.json');
        this.add('senses.json');
        this.add('skills.json');
        this.add('spells/fluff-index.json');
        this.add('spells/index.json');
        this.add('tables.json');
        this.add('trapshazards.json');
        this.add('variantrules.json');
        this.add('vehicles.json');
        this.addSpellSource('spells/sources.json');
    }

    public getSourceData(sourceId: string): ParsedSource {
        return {
            name: rawData.getSourceFullName(sourceId),
            source: sourceId,
            abbreviation: rawData.getSourceAbbreviation(sourceId),
            published: rawData.getSourcePublishDate(sourceId),
            category: rawData.getSourceCategory(sourceId),
            legacy: rawData.getSourceLegacyStatus(sourceId),
        };
    }
}

export interface PartneredFilters {
    partnered: boolean;
    allowPHB2014: boolean;
}

export class PartneredDatabank extends Databank {
    public readonly filters: PartneredFilters;
    private readonly sourceData: { [key: string]: ParsedSource } = {};

    private getFullPath(path: string): string {
        return `5etools-homebrew/data/${path}`;
    }

    public override add(path: string) {
        path = this.getFullPath(path);
        const stats = lstatSync(path);
        if (!stats.isDirectory()) {
            throw new Error(`Partnered databank expects a directory, received '${path}'!`);
        }

        for (const file of readdirSync(path)) {
            const fullPath = join(path, file);
            const data = readJsonFile(fullPath);
            this.addContents(data, fullPath);
        }
    }

    private addContents(data: any, path: string): void {
        if (!data._meta) {
            throw new Error(`Partnered databank content expects a +meta field, but '${path}' didn't have one!`);
        }

        const sources: any[] = data._meta.sources ?? [];
        const partnered = sources.some((source) => source.partnered ?? false);
        const isClassic = data._meta.edition === 'classic';

        if (this.filters.partnered && !partnered) return;
        if (!this.filters.allowPHB2014 && isClassic) return;

        for (const datum of sources) {
            const source = datum['json'];
            const name = datum['full'] ?? source;
            const abbreviation = datum['abbreviation'] ?? source;
            const published = datum['dateReleased'] ?? null;
            const legacy = isClassic;
            this.sourceData[source] = { name, abbreviation, published, source, category: 'partnered', legacy };
        }

        const prefixesToIgnore = ['foundry'];
        const keysToIgnore = [
            '$schema',
            '_meta',
            '_test',
            'linkedLootTables',
            'raceFluffMeta',
            'bookData',
            'adventureData',
            'roll20Spell',
            'makebrewCreatureTrait',
            'citation',
            // The items below are not implemented *yet*, and should be TODO
            'reward',
            'rewardFluff',
            'deck',
            'featFluff',
            'card',
            'legendaryGroup',
            'charoption',
            'facility',
            'psionic',
        ];

        for (const key of Object.keys(data)) {
            if (prefixesToIgnore.some((prefix) => key.startsWith(prefix))) continue;
            if (keysToIgnore.includes(key)) continue;

            this.get(key).push(...data[key]);
        }
    }

    constructor(official: OfficialDatabank, filters: PartneredFilters) {
        super();
        this.filters = { ...filters };

        // Load in some data from the official content
        // The data from the official sources is later removed by ParsedDatabank.removeSources
        const entriesToCopy = [
            'itemType',
            'itemGroup',
            'itemProperty',
            'itemTypeAdditionalEntries',
            'itemEntry',
            'itemMastery',
            'monster',
            'item',
            'monsterFluff',
            'race',
            'raceFluff',
        ];
        for (const entryToCopy of entriesToCopy) {
            this.get(entryToCopy).push(...official.get(entryToCopy));
        }

        // Load homebrew
        this.add('action/');
        this.add('adventure/');
        this.add('background/');
        this.add('baseitem/');
        this.add('book/');
        this.add('boon/');
        this.add('charoption/');
        this.add('class/');
        this.add('collection/');
        this.add('creature/');
        this.add('cult/');
        this.add('deck/');
        this.add('deity/');
        this.add('disease/');
        this.add('facility/');
        this.add('feat/');
        this.add('hazard/');
        this.add('item/');
        this.add('language/');
        this.add('magicvariant/');
        this.add('makebrew/');
        this.add('object/');
        this.add('optionalfeature/');
        this.add('psionic/');
        this.add('race/');
        this.add('recipe/');
        this.add('reward/');
        this.add('spell/');
        this.add('subclass/');
        this.add('subrace/');
        this.add('table/');
        this.add('trap/');
        this.add('variantrule/');
        this.add('vehicle/');
    }

    public getSourceData(sourceId: string): ParsedSource {
        if (this.sourceData[sourceId]) return this.sourceData[sourceId];
        return {
            name: sourceId,
            source: sourceId,
            abbreviation: sourceId,
            published: null,
            category: 'partnered',
            legacy: false,
        };
    }
}
