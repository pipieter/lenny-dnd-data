import { mkdirSync, writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './dnd/conditions';
import { Databank, loadData, loadHomebrewData, mergeDatabanks } from './data';
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

function saveJsonFile(dest_folder: string, filename: string, data: any[]) {
    const path = `./generated/${dest_folder}`;
    mkdirSync(path, { recursive: true });
    writeFileSync(`${path}/${filename}.json`, JSON.stringify(data, null, 2), 'utf-8');
}

function generateFiles(
    data: Databank,
    allData: Databank,
    dest_folder: string,
    stopwatch: StopwatchLogger
) {
    const items = getItems(data, allData);
    stopwatch.log('Items retrieved');

    const itemVariants = getItemVariants(data, allData);
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

    const languages = getLanguages(data, allData);
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

    saveJsonFile(dest_folder, 'items', items);
    saveJsonFile(dest_folder, 'itemvariants', itemVariants);
    saveJsonFile(dest_folder, 'spells', spells);
    saveJsonFile(dest_folder, 'conditions', conditions);
    saveJsonFile(dest_folder, 'diseases', diseases);
    saveJsonFile(dest_folder, 'creatures', creatures);
    saveJsonFile(dest_folder, 'classes', classes);
    saveJsonFile(dest_folder, 'classfeats', classFeats);
    saveJsonFile(dest_folder, 'rules', rules);
    saveJsonFile(dest_folder, 'actions', actions);
    saveJsonFile(dest_folder, 'feats', feats);
    saveJsonFile(dest_folder, 'languages', languages);
    saveJsonFile(dest_folder, 'names', names);
    saveJsonFile(dest_folder, 'backgrounds', backgrounds);
    saveJsonFile(dest_folder, 'tables', tables);
    saveJsonFile(dest_folder, 'species', species);
    saveJsonFile(dest_folder, 'sources', sources);
    saveJsonFile(dest_folder, 'traps', traps);
    saveJsonFile(dest_folder, 'hazards', hazards);
    saveJsonFile(dest_folder, 'objects', objects);
    saveJsonFile(dest_folder, 'vehicles', vehicles);
    saveJsonFile(dest_folder, 'skills', skills);
    stopwatch.log(`Data written to generated/${dest_folder}`);
}

function main(): void {
    const stopwatch = new StopwatchLogger();

    stopwatch.logSubtitle('Loading databanks');
    const path = './5etools-src/data';
    const homebrewPath = './5etools-homebrew/data';

    const data = loadData(path);
    const homebrewData = loadHomebrewData(homebrewPath);
    const allData = mergeDatabanks(data, homebrewData);
    stopwatch.log('Loaded databanks');

    stopwatch.logSubtitle('Parsing official data');
    generateFiles(data, allData, 'official', stopwatch);
    stopwatch.logSubtitle('Parsing partnered data');
    generateFiles(homebrewData, allData, 'partnered', stopwatch);
    stopwatch.stop();
}

main();
