import { title } from './parser';
import { read } from './read';
import { Rule } from './dnd/rules';
import { Hazard } from './dnd/hazards';
import { TableData } from './dnd/tables';
import { Action } from './dnd/actions';
import { Feat } from './dnd/feats';
import { Skill } from './dnd/skills';
import { SpeciesName } from './dnd/names';
import { Vehicle, VehicleUpgrade } from './dnd/vehicles';
import { DNDObject } from './dnd/objects';

export function getKey(name: string, source: string): string {
    return `${title(name)} (${source.toUpperCase()})`;
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
    // Rules
    public readonly variantrule: Rule[] = [];
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
    // Feats
    public readonly feat: Feat[] = [];
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
    // Objects
    public readonly object: DNDObject[] = [];

    public get(key: string): any[] {
        if ((this as any)[key] === undefined) {
            throw new Error(`Databank error: key '${key}' not found!`);
        }
        return (this as any)[key];
    }

    public add(path: string) {
        // Keys that will not be handled
        const keysToIgnore = ['_meta', 'linkedLootTables', 'raceFluffMeta'];

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
                const classes = [
                    ...(data[source][spell].class || []),
                    ...(data[source][spell].classVariant || []),
                ];
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
        this.add('feats.json');
        this.add('fluff-conditionsdiseases.json');
        this.add('fluff-items.json');
        this.add('fluff-languages.json');
        this.add('fluff-races.json');
        this.add('fluff-trapshazards.json');
        this.add('generated/gendata-tables.json');
        this.add('generated/gendata-variantrules.json');
        this.add('items-base.json');
        this.add('items.json');
        this.add('languages.json');
        this.add('magicvariants.json');
        this.add('names.json');
        this.add('objects.json');
        this.add('races.json');
        this.add('skills.json');
        this.add('spells/fluff-index.json');
        this.add('spells/index.json');
        this.add('tables.json');
        this.add('trapshazards.json');
        this.add('variantrules.json');
        this.add('vehicles.json');
        this.addSpellSource('spells/sources.json');
    }
}
