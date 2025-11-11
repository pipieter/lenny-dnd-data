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

function saveJsonFile(destFolder: string, filename: string, data: any[]) {
    const path = `./generated/${destFolder}`;
    mkdirSync(path, { recursive: true });
    writeFileSync(`${path}/${filename}.json`, JSON.stringify(data, null, 2), 'utf-8');
}

function generateFiles(
    data: Databank,
    allData: Databank,
    destFolder: string,
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

    saveJsonFile(destFolder, 'items', items);
    saveJsonFile(destFolder, 'itemvariants', itemVariants);
    saveJsonFile(destFolder, 'spells', spells);
    saveJsonFile(destFolder, 'conditions', conditions);
    saveJsonFile(destFolder, 'diseases', diseases);
    saveJsonFile(destFolder, 'creatures', creatures);
    saveJsonFile(destFolder, 'classes', classes);
    saveJsonFile(destFolder, 'classfeats', classFeats);
    saveJsonFile(destFolder, 'rules', rules);
    saveJsonFile(destFolder, 'actions', actions);
    saveJsonFile(destFolder, 'feats', feats);
    saveJsonFile(destFolder, 'languages', languages);
    saveJsonFile(destFolder, 'names', names);
    saveJsonFile(destFolder, 'backgrounds', backgrounds);
    saveJsonFile(destFolder, 'tables', tables);
    saveJsonFile(destFolder, 'species', species);
    saveJsonFile(destFolder, 'sources', sources);
    saveJsonFile(destFolder, 'traps', traps);
    saveJsonFile(destFolder, 'hazards', hazards);
    saveJsonFile(destFolder, 'objects', objects);
    saveJsonFile(destFolder, 'vehicles', vehicles);
    saveJsonFile(destFolder, 'skills', skills);
    stopwatch.log(`Data written to generated/${destFolder}`);
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
