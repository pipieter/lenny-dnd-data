import { existsSync, lstatSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './dnd/conditions';
import { Databank, OfficialDatabank, PartneredDatabank } from './data';
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
import { dirname, join } from 'path';
import kleur = require('kleur');

// Clear the contents of a directory
function clearDirectory(path: string) {
    if (!existsSync(path)) return;

    const files = readdirSync(path);
    for (const file of files) {
        const fullPath = join(path, file);
        const stats = lstatSync(fullPath);
        if (stats.isDirectory()) continue;
        if (!existsSync(fullPath)) continue;
        unlinkSync(fullPath);
    }
}

function write(path: string, contents: any) {
    const directory = dirname(path);
    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(contents, null, 2), 'utf-8');
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

    write(`./generated/${name}/items.json`, items);
    write(`./generated/${name}/itemsvariants.json`, itemVariants);
    write(`./generated/${name}/spells.json`, spells);
    write(`./generated/${name}/conditions.json`, conditions);
    write(`./generated/${name}/diseases.json`, diseases);
    write(`./generated/${name}/creatures.json`, creatures);
    write(`./generated/${name}/classes.json`, classes);
    write(`./generated/${name}/classfeats.json`, classFeats);
    write(`./generated/${name}/rules.json`, rules);
    write(`./generated/${name}/actions.json`, actions);
    write(`./generated/${name}/feats.json`, feats);
    write(`./generated/${name}/languages.json`, languages);
    write(`./generated/${name}/names.json`, names);
    write(`./generated/${name}/backgrounds.json`, backgrounds);
    write(`./generated/${name}/tables.json`, tables);
    write(`./generated/${name}/species.json`, species);
    write(`./generated/${name}/sources.json`, sources);
    write(`./generated/${name}/traps.json`, traps);
    write(`./generated/${name}/hazards.json`, hazards);
    write(`./generated/${name}/objects.json`, objects);
    write(`./generated/${name}/vehicles.json`, vehicles);
    write(`./generated/${name}/skills.json`, skills);
}

function main(): void {
    const stopwatch = new StopwatchLogger();

    // Clear the contents of the generated directory
    clearDirectory('./generated/official');
    clearDirectory('./generated/homebrew');
    clearDirectory('./generated/partnered');
    clearDirectory('./generated');

    const official = new OfficialDatabank();
    const partnered = new PartneredDatabank({ partnered: true, allowPHB2014: false });
    const homebrew = new PartneredDatabank({ partnered: false, allowPHB2014: false });

    stopwatch.log('Loaded databanks');

    generate('official', official, stopwatch);
    generate('partnered', partnered, stopwatch);
    generate('homebrew', homebrew, stopwatch);

    stopwatch.log('Data written to files');
    stopwatch.stop();
}

main();
