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
import * as kleur from 'kleur';
import { getDeities } from './dnd/deities';
import { getCults } from './dnd/cults';
import { getBoons } from './dnd/boons';
import { ParsedDatabank } from './parsed';
import { getLife } from './dnd/life';

function parse(name: string, databank: Databank, stopwatch: StopwatchLogger): ParsedDatabank {
    const parsed = new ParsedDatabank();
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

    const cults = getCults(databank);
    stopwatch.log('Cults retrieved.');

    const boons = getBoons(databank);
    stopwatch.log('Boons retrieved.');

    const life = getLife(databank);
    stopwatch.log('Life retrieved.');

    parsed.items.push(...items);
    parsed.itemsvariants.push(...itemVariants);
    parsed.spells.push(...spells);
    parsed.conditions.push(...conditions);
    parsed.diseases.push(...diseases);
    parsed.deities.push(...deities);
    parsed.creatures.push(...creatures);
    parsed.classes.push(...classes);
    parsed.classfeats.push(...classFeats);
    parsed.rules.push(...rules);
    parsed.actions.push(...actions);
    parsed.feats.push(...feats);
    parsed.languages.push(...languages);
    parsed.names.push(...names);
    parsed.backgrounds.push(...backgrounds);
    parsed.tables.push(...tables);
    parsed.species.push(...species);
    parsed.sources.push(...sources);
    parsed.traps.push(...traps);
    parsed.hazards.push(...hazards);
    parsed.objects.push(...objects);
    parsed.vehicles.push(...vehicles);
    parsed.skills.push(...skills);
    parsed.cults.push(...cults);
    parsed.boons.push(...boons);
    parsed.life.push(...life);

    return parsed;
}

function main(): void {
    const stopwatch = new StopwatchLogger();

    const official = new OfficialDatabank();
    const partnered = new PartneredDatabank(official, { partnered: true, allowPHB2014: false });

    stopwatch.log('Loaded databanks');

    const parsedOfficial = parse('official', official, stopwatch);
    const parsedPartnered = parse('partnered', partnered, stopwatch);

    const officialSources = new Set(parsedOfficial.sources.map((source) => source.source));
    parsedPartnered.removeSources(officialSources);

    parsedOfficial.write('./generated/official/');
    parsedPartnered.write('./generated/partnered/');

    // In case homebrew content needs to be enabled, uncomment the following lines
    // const homebrew = new PartneredDatabank(official, { partnered: false, allowPHB2014: false });
    // const parsedHomebrew = parse('homebrew', homebrew, stopwatch);
    // parsedHomebrew.removeSources(officialSources)
    // parsedHomebrew.write("./generated/homebrew/")

    stopwatch.log('Data written to files');
    stopwatch.stop();
}

main();
