import { getConditionsStatusesAndDiseases } from './dnd/conditions';
import { Databank, OfficialDatabank, PartneredDatabank, write } from './data';
import { getSpells } from './dnd/spells';
import { getCreatures } from './dnd/creatures';
import { StopwatchLogger } from './util';
import { getClassesAndClassFeats } from './dnd/classes';
import { getItems, getItemVariants } from './dnd/items';
import { getRules } from './dnd/rules';
import { getActions } from './dnd/actions';
import { getFeats } from './dnd/feats';
import { getLanguages } from './dnd/languages';
import { getNames } from './dnd/names';
import { getBackgrounds } from './dnd/backgrounds';
import { getTables } from './dnd/tables';
import { getSpecies } from './dnd/species';
import { getSources } from './dnd/sources';
import { getTrapsAndHazards } from './dnd/hazards';
import { getObjects } from './dnd/objects';
import { getVehicles } from './dnd/vehicles';
import { getSkills } from './dnd/skills';
import * as kleur from 'kleur';
import { getDeities } from './dnd/deities';
import { createHash } from 'crypto';

const filteredData = new Set<string>(); // Stores hashes of data that has been written to files already.
export function filter(contents: object[]): object[] {
    const filtered: object[] = [];

    for (const content of contents) {
        const hash = createHash('sha256')
            .update(JSON.stringify(content, Object.keys(content).sort()))
            .digest('hex');

        if (filteredData.has(hash)) continue;
        filteredData.add(hash);
        filtered.push(content);
    }

    return filtered;
}

function generate(name: string, databank: Databank, stopwatch: StopwatchLogger) {
    stopwatch.log(`Generating ${name}`, kleur.cyan);

    const items = getItems(databank);
    stopwatch.log('Items retrieved');

    const itemVariants = getItemVariants(databank);
    stopwatch.log('Items variant retrieved');

    const spells = getSpells(databank);
    stopwatch.log('Spells retrieved');

    const { conditions, diseases } = getConditionsStatusesAndDiseases(databank);
    stopwatch.log('Conditions & Diseases retrieved');

    const creatures = getCreatures(databank);
    stopwatch.log('Creatures retrieved');

    const { classes, classFeats } = getClassesAndClassFeats(databank);
    stopwatch.log('Classes & ClassFeats retrieved');

    const deities = getDeities(databank);
    stopwatch.log('Deities retrieved');

    const rules = getRules(databank);
    stopwatch.log('Rules retrieved');

    const actions = getActions(databank);
    stopwatch.log('Actions retrieved');

    const backgrounds = getBackgrounds(databank);
    stopwatch.log('Backgrounds retrieved');

    const feats = getFeats(databank);
    stopwatch.log('Feats retrieved');

    const languages = getLanguages(databank);
    stopwatch.log('Languages retrieved');

    const names = getNames(databank);
    stopwatch.log('Names retrieved');

    const tables = getTables(databank);
    stopwatch.log('Tables retrieved');

    const species = getSpecies(databank);
    stopwatch.log('Species retrieved');

    const sources = getSources(databank);
    stopwatch.log('Sources retrieved');

    const { traps, hazards } = getTrapsAndHazards(databank);
    stopwatch.log('Traps & Hazards retrieved');

    const objects = getObjects(databank);
    stopwatch.log('Objects retrieved');

    const vehicles = getVehicles(databank);
    stopwatch.log('Vehicles retrieved.');

    const skills = getSkills(databank);
    stopwatch.log('Skills retrieved.');

    write(`./generated/${name}/items.json`, filter(items));
    write(`./generated/${name}/itemsvariants.json`, filter(itemVariants));
    write(`./generated/${name}/spells.json`, filter(spells));
    write(`./generated/${name}/conditions.json`, filter(conditions));
    write(`./generated/${name}/diseases.json`, filter(diseases));
    write(`./generated/${name}/deities.json`, filter(deities));
    write(`./generated/${name}/creatures.json`, filter(creatures));
    write(`./generated/${name}/classes.json`, filter(classes));
    write(`./generated/${name}/classfeats.json`, filter(classFeats));
    write(`./generated/${name}/rules.json`, filter(rules));
    write(`./generated/${name}/actions.json`, filter(actions));
    write(`./generated/${name}/feats.json`, filter(feats));
    write(`./generated/${name}/languages.json`, filter(languages));
    write(`./generated/${name}/names.json`, filter(names));
    write(`./generated/${name}/backgrounds.json`, filter(backgrounds));
    write(`./generated/${name}/tables.json`, filter(tables));
    write(`./generated/${name}/species.json`, filter(species));
    write(`./generated/${name}/sources.json`, filter(sources));
    write(`./generated/${name}/traps.json`, filter(traps));
    write(`./generated/${name}/hazards.json`, filter(hazards));
    write(`./generated/${name}/objects.json`, filter(objects));
    write(`./generated/${name}/vehicles.json`, filter(vehicles));
    write(`./generated/${name}/skills.json`, filter(skills));
}

function main(): void {
    const stopwatch = new StopwatchLogger();

    const official = new OfficialDatabank();
    const partnered = new PartneredDatabank(official, { partnered: true, allowPHB2014: false });
    const homebrew = new PartneredDatabank(official, { partnered: false, allowPHB2014: false });

    stopwatch.log('Loaded databanks');

    generate('official', official, stopwatch);
    generate('partnered', partnered, stopwatch);
    generate('homebrew', homebrew, stopwatch);

    stopwatch.log('Data written to files');
    stopwatch.stop();
}

main();
