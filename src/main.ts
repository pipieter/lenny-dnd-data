import { writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './dnd/conditions';
import { Databank, loadData } from './data';
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
    const databank = new Databank();
    // Load spells
    databank.add('./5etools-src/data/spells/index.json');
    databank.add('./5etools-src/data/spells/fluff-index.json');
    databank.addSpellSource('./5etools-src/data/spells/sources.json');
    // Load items
    databank.add('./5etools-src/data/items.json');
    databank.add('./5etools-src/data/fluff-items.json');
    databank.add('./5etools-src/data/items-base.json');
    databank.add('./5etools-src/data/magicvariants.json');
    // Load conditions
    databank.add('./5etools-src/data/conditionsdiseases.json');
    databank.add('./5etools-src/data/fluff-conditionsdiseases.json');
    // Load Creatures
    databank.add('./5etools-src/data/bestiary/index.json');
    databank.add('./5etools-src/data/bestiary/fluff-index.json');
    // Load languages
    databank.add('./5etools-src/data/languages.json');
    databank.add('./5etools-src/data/fluff-languages.json');
    // Load classes
    databank.add('./5etools-src/data/class/index.json');
    // Load rules
    databank.add('5etools-src/data/variantrules.json');
    databank.add('5etools-src/data/generated/gendata-variantrules.json');
    // Load hazards
    databank.add('5etools-src/data/trapshazards.json');
    databank.add('5etools-src/data/fluff-trapshazards.json');
    // Load books and adventures
    databank.add('5etools-src/data/books.json');
    databank.add('5etools-src/data/adventures.json');
    // Load actions
    databank.add('5etools-src/data/actions.json');

    const stopwatch = new StopwatchLogger();

    const path = './5etools-src/data';
    const data = loadData(path);
    stopwatch.log('Loaded databanks');

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

    const rules = getRules(databank);
    stopwatch.log('Rules retrieved');

    const actions = getActions(data);
    stopwatch.log('Actions retrieved');

    const backgrounds = getBackgrounds(data);
    stopwatch.log('Backgrounds retrieved');

    const feats = getFeats(data);
    stopwatch.log('Feats retrieved');

    const languages = getLanguages(databank);
    stopwatch.log('Languages retrieved');

    const names = getNames(data);
    stopwatch.log('Names retrieved');

    const tables = getTables(data);
    stopwatch.log('Tables retrieved');

    const species = getSpecies(data);
    stopwatch.log('Species retrieved');

    const sources = getSources(databank);
    stopwatch.log('Sources retrieved');

    const { traps, hazards } = getTrapsAndHazards(databank);
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
