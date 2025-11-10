import { writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './dnd/conditions';
import { loadData } from './data';
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
import { getSkills } from './skills';

function main(): void {
    const stopwatch = new StopwatchLogger();

    const path = './5etools-src/data';
    const data = loadData(path);
    stopwatch.log('Loaded databanks');

    const items = getItems(data);
    stopwatch.log('Items retrieved');

    const itemVariants = getItemVariants(data);
    stopwatch.log('Items variant retrieved');

    const spells = getSpells('./5etools-src/data/spells');
    stopwatch.log('Spells retrieved');

    const { conditions, diseases } = getConditionsStatusesAndDiseases(data);
    stopwatch.log('Conditions & Diseases retrieved');

    const creatures = getCreatures();
    stopwatch.log('Creatures retrieved');

    const { classes, classFeats } = getClassesAndClassFeats();
    stopwatch.log('Classes & ClassFeats retrieved');

    const rules = getRules();
    stopwatch.log('Rules retrieved');

    const actions = getActions(data);
    stopwatch.log('Actions retrieved');

    const backgrounds = getBackgrounds(data);
    stopwatch.log('Backgrounds retrieved');

    const feats = getFeats(data);
    stopwatch.log('Feats retrieved');

    const languages = getLanguages(data);
    stopwatch.log('Languages retrieved');

    const names = getNames(data);
    stopwatch.log('Names retrieved');

    const tables = getTables(data);
    stopwatch.log('Tables retrieved');

    const species = getSpecies(data);
    stopwatch.log('Species retrieved');

    const sources = getSources(data);
    stopwatch.log('Sources retrieved');

    const { traps, hazards } = getTrapsAndHazards(data);
    stopwatch.log('Traps & Hazards retrieved');

    const objects = getObjects(data);
    stopwatch.log('Objects retrieved');

    const vehicles = getVehicles(data);
    stopwatch.log('Vehicles retrieved.');

    const skills = getSkills(data);
    stopwatch.log('Skills retrieved.');

    writeFileSync('./generated/items.json', JSON.stringify(items, null, 2), 'utf-8');
    writeFileSync('./generated/itemsvariants.json', JSON.stringify(itemVariants, null, 2), 'utf-8');
    writeFileSync('./generated/spells.json', JSON.stringify(spells, null, 2), 'utf-8');
    writeFileSync('./generated/conditions.json', JSON.stringify(conditions, null, 2), 'utf-8');
    writeFileSync('./generated/diseases.json', JSON.stringify(diseases, null, 2), 'utf-8');
    writeFileSync('./generated/creatures.json', JSON.stringify(creatures, null, 2), 'utf-8');
    writeFileSync('./generated/classes.json', JSON.stringify(classes, null, 2), 'utf-8');
    writeFileSync('./generated/classfeats.json', JSON.stringify(classFeats, null, 2), 'utf-8');
    writeFileSync('./generated/rules.json', JSON.stringify(rules, null, 2), 'utf-8');
    writeFileSync('./generated/actions.json', JSON.stringify(actions, null, 2), 'utf-8');
    writeFileSync('./generated/feats.json', JSON.stringify(feats, null, 2), 'utf-8');
    writeFileSync('./generated/languages.json', JSON.stringify(languages, null, 2), 'utf-8');
    writeFileSync('./generated/names.json', JSON.stringify(names, null, 2), 'utf-8');
    writeFileSync('./generated/backgrounds.json', JSON.stringify(backgrounds, null, 2), 'utf-8');
    writeFileSync('./generated/tables.json', JSON.stringify(tables, null, 2), 'utf-8');
    writeFileSync('./generated/species.json', JSON.stringify(species, null, 2), 'utf-8');
    writeFileSync('./generated/sources.json', JSON.stringify(sources, null, 2), 'utf-8');
    writeFileSync('./generated/traps.json', JSON.stringify(traps, null, 2), 'utf-8');
    writeFileSync('./generated/hazards.json', JSON.stringify(hazards, null, 2), 'utf-8');
    writeFileSync('./generated/objects.json', JSON.stringify(objects, null, 2), 'utf-8');
    writeFileSync('./generated/vehicles.json', JSON.stringify(vehicles, null, 2), 'utf-8');
    writeFileSync('./generated/skills.json', JSON.stringify(skills, null, 2), 'utf-8');

    stopwatch.log('Data written to files');
    stopwatch.stop();
}

main();
