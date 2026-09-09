import { Action } from '../5etools-collector/types/action';
import { Background } from '../5etools-collector/types/background';
import { Boon } from '../5etools-collector/types/boon';
import { Class, ClassFeature, Subclass, SubclassFeature } from '../5etools-collector/types/class';
import { Condition } from '../5etools-collector/types/condition';
import { Cult } from '../5etools-collector/types/cult';
import { Deity } from '../5etools-collector/types/deity';
import { Disease } from '../5etools-collector/types/disease';
import { Fluff } from '../5etools-collector/types/fluff';
import { Hazard } from '../5etools-collector/types/hazard';
import { Language } from '../5etools-collector/types/language';
import { Monster } from '../5etools-collector/types/monster';
import { DNDObject } from '../5etools-collector/types/object';
import { Rule } from '../5etools-collector/types/rule';
import { Skill } from '../5etools-collector/types/skill';
import { Source } from '../5etools-collector/types/source';
import { Status } from '../5etools-collector/types/status';
import { TableGroup, TableTable } from '../5etools-collector/types/table';
import { Vehicle, VehicleUpgrade } from '../5etools-collector/types/vehicle';
import { Feat } from './dnd/feats';
import { LifeBackground, LifeClass } from './dnd/life';
import { SpeciesName } from './dnd/names';
import { title } from './parser';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export function getKey(name: string, source: string): string {
    return `${title(name)} (${source.toUpperCase()})`;
}

export function write(path: string, contents: object[]) {
    const directory = dirname(path);
    if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
    writeFileSync(path, JSON.stringify(contents, null, 1), 'utf-8');
}

export function read(filepath: string): any {
    return JSON.parse(readFileSync(filepath).toString());
}

export class MetaData {
    // TODO - Currently metadata is retained globally, however overlapping keys are possible when homebrew content is enabled.
    // E.g. in optionalFeatureTypes, "CO" can have 3 different meanings (Concoction, Channeling Option, or Companion Origin) depending on which source it's from.
    public readonly vehicleUpgradeTypes: Record<string, Record<string, string>> = {};
    public readonly featCategories: Record<string, Record<string, string>> = {};
    public readonly spellSchools: Record<string, Record<string, string>> = {};
    public readonly optionalFeatureTypes: Record<string, Record<string, string>> = {};
    // The items below are not used in the code *yet*, and should be TODO
    public readonly psionicTypes: Record<string, Record<string, string>> = {};

    public load(file: string) {
        // Exceptions where the metadata is {[key: string]: object}
        const objectMapping: { [key: string]: string } = {
            spellSchools: 'full', // From each spellSchool object, take data from the 'full' key.
            psionicTypes: 'full',
        };

        const metadata = read(file);
        for (const meta of metadata) {
            const source = meta.sourceKey ?? meta.sourceAbbreviation;
            for (const key of Object.keys(meta.value)) {
                let value = meta.value[key];
                if (typeof value === 'object') {
                    value = (value as any)[objectMapping[meta.type]];
                }
                const existing = (this as any)[meta.type][source] || {};
                const addition: Record<string, any> = {};
                addition[key] = value;
                (this as any)[meta.type][source] = { ...existing, ...addition };
            }
        }
    }
}

export abstract class Databank {
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
    public readonly condition: Condition[] = [];
    public readonly status: Status[] = [];
    public readonly disease: Disease[] = [];
    public readonly conditionFluff: Fluff[] = [];
    public readonly statusFluff: Fluff[] = [];
    public readonly diseaseFluff: Fluff[] = [];
    // Creatures
    public readonly monster: Monster[] = [];
    public readonly monsterFluff: Fluff[] = [];
    // Languages
    public readonly language: Language[] = [];
    public readonly languageFluff: Fluff[] = [];
    // Classes
    public readonly class: Class[] = [];
    public readonly classFeature: ClassFeature[] = [];
    public readonly subclass: Subclass[] = [];
    public readonly subclassFeature: SubclassFeature[] = [];
    public readonly classFluff: Fluff[] = [];
    public readonly subclassFluff: Fluff[] = [];
    public readonly sidekick: Class[] = [];
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
    public readonly table: TableTable[] = [];
    public readonly tableGroup: TableGroup[] = [];
    // Backgrounds
    public readonly background: Background[] = [];
    public readonly backgroundFluff: Fluff[] = [];
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
    public readonly vehicleFluff: Fluff[] = [];
    // Objects
    public readonly object: DNDObject[] = [];
    public readonly objectFluff: Fluff[] = [];
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

    // Source
    public readonly source: Source[] = [];

    public readonly metadata = new MetaData();

    constructor() {
        for (const file of this.getFiles()) {
            if (file === 'meta') {
                this.metadata.load(join(this.path(), 'meta.json'));
            } else {
                this.add(file);
            }
        }
    }

    public get(key: string): any[] {
        if ((this as any)[key] === undefined) {
            throw new Error(`Databank error: key '${key}' not found!`);
        }
        return (this as any)[key];
    }

    protected abstract path(): string;

    protected getFiles(): string[] {
        return readdirSync(this.path()).map((f) => f.replaceAll('.json', ''));
    }

    public add(key: string) {
        const filePath = join(this.path(), `${key}.json`);
        const data = read(filePath);
        this.get(key).push(...data);
    }

    public search(key: string, name: string, source: string): any | undefined {
        const entries = this.get(key);
        return entries.find((entry) => entry.name === name && entry.source === source);
    }
}

export class OfficialDatabank extends Databank {
    protected path(): string {
        return './5etools-collector/data/official';
    }
}

export class PartneredDatabank extends Databank {
    protected path(): string {
        return './5etools-collector/data/partnered';
    }

    constructor(official: OfficialDatabank) {
        super();

        // Load in some data from the official content
        // The data from the official sources is later removed by ParsedDatabank.removeSources
        const entriesToCopy = [
            'itemType',
            'itemGroup',
            'itemProperty',
            'itemTypeAdditionalEntries',
            'itemEntry',
            'itemMastery',
            'itemFluff',
            'monster',
            'item',
            'monsterFluff',
            'race',
            'raceFluff',
        ];
        for (const entryToCopy of entriesToCopy) {
            this.get(entryToCopy).push(...official.get(entryToCopy));
        }
    }
}
