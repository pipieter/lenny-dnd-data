import { title } from './parser';
import { Rule } from './dnd/rules';
import { Hazard } from './dnd/hazards';
import { TableData } from './dnd/tables';
import { Feat } from './dnd/feats';
import { Skill } from './dnd/skills';
import { SpeciesName } from './dnd/names';
import { Vehicle, VehicleUpgrade } from './dnd/vehicles';
import { DNDObject } from './dnd/objects';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { Deity } from './dnd/deities';
import { Cult } from './dnd/cults';
import { Boon } from './dnd/boons';
import { LifeBackground, LifeClass } from './dnd/life';

import { Action } from '../5etools-collector/types/action';

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
    public readonly sidekick: any[] = [];
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

    // Source
    public readonly source: any[] = [];

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
