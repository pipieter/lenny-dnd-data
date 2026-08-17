import { write } from './data';
import { ParsedAction } from './dnd/actions';
import { ParsedBackground } from './dnd/backgrounds';
import { ParsedBoon } from './dnd/boons';
import { ParsedClass } from './dnd/classes';
import { ParsedCondition } from './dnd/conditions';
import { ParsedCreature } from './dnd/creatures';
import { ParsedCult } from './dnd/cults';
import { ParsedDeity } from './dnd/deities';
import { ParsedFeat } from './dnd/feats';
import { ParsedHazard } from './dnd/hazards';
import { ParsedItem } from './dnd/items';
import { ParsedLanguage } from './dnd/languages';
import { ParsedLife } from './dnd/life';
import { ParsedSpeciesNames } from './dnd/names';
import { ParsedDNDObject } from './dnd/objects';
import { ParsedOptionalFeature } from './dnd/optionalfeatures';
import { ParsedRule } from './dnd/rules';
import { ParsedSkill } from './dnd/skills';
import { ParsedSource } from './dnd/sources';
import { ParsedSpecies } from './dnd/species';
import { ParsedSpell } from './dnd/spells';
import { ParsedTable } from './dnd/tables';
import { ParsedVehicle } from './dnd/vehicles';
import { entrySort } from './util';

export class ParsedDatabank {
    public readonly actions: ParsedAction[] = [];
    public readonly backgrounds: ParsedBackground[] = [];
    public readonly boons: ParsedBoon[] = [];
    public readonly classes: ParsedClass[] = [];
    public readonly classfeats: ParsedFeat[] = [];
    public readonly conditions: ParsedCondition[] = [];
    public readonly creatures: ParsedCreature[] = [];
    public readonly cults: ParsedCult[] = [];
    public readonly diseases: ParsedCondition[] = [];
    public readonly deities: ParsedDeity[] = [];
    public readonly feats: ParsedFeat[] = [];
    public readonly hazards: ParsedHazard[] = [];
    public readonly items: ParsedItem[] = [];
    public readonly itemsvariants: ParsedItem[] = [];
    public readonly languages: ParsedLanguage[] = [];
    public readonly life: ParsedLife[] = [];
    public readonly names: ParsedSpeciesNames[] = [];
    public readonly objects: ParsedDNDObject[] = [];
    public readonly optionalfeatures: ParsedOptionalFeature[] = [];
    public readonly rules: ParsedRule[] = [];
    public readonly skills: ParsedSkill[] = [];
    public readonly sources: ParsedSource[] = [];
    public readonly species: ParsedSpecies[] = [];
    public readonly spells: ParsedSpell[] = [];
    public readonly tables: ParsedTable[] = [];
    public readonly traps: ParsedHazard[] = [];
    public readonly vehicles: ParsedVehicle[] = [];

    public write(path: string): void {
        for (const key of Object.keys(this)) {
            const entries = (this as any)[key].sort(entrySort);
            write(`${path}${key}.json`, entries);
        }
    }

    public removeSources(sources: Set<string>): void {
        for (const key of Object.keys(this)) {
            const entries = (this as any)[key];
            const filtered = entries.filter((entry: any) => !sources.has(entry.source));
            (this as any)[key].splice(0, entries.length, ...filtered);
        }
    }
}
