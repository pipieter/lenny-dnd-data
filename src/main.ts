import { writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './conditions';
import { loadData } from './data';
import { getSpells } from './spells';
import { getCreatures } from './creatures';
import { StopwatchLogger } from './util';
import { getClasses } from './classes';
import { getItems } from './items';
import { getRules } from './rules';
import { getActions } from './actions';
import { getFeats } from './feats';

function main(): void {
    const stopwatch = new StopwatchLogger();

    const path = './5etools-src/data';
    const data = loadData(path);
    stopwatch.log('Loaded databanks');

    const items = getItems(data);
    stopwatch.log('Items retrieved');

    const spells = getSpells('./5etools-src/data/spells');
    stopwatch.log('Spells retrieved');

    const { conditions, diseases } = getConditionsStatusesAndDiseases(data);
    stopwatch.log('Conditions & Diseases retrieved');

    const creatures = getCreatures();
    stopwatch.log('Creatures retrieved');

    const classes = getClasses();
    stopwatch.log('Classes retrieved');

    const rules = getRules(data);
    stopwatch.log('Rules retrieved');

    const actions = getActions(data);
    stopwatch.log('Actions retrieved');

    const feats = getFeats(data);
    stopwatch.log('Feats retrieved');

    writeFileSync('./generated/items.json', JSON.stringify(items, null, 2), 'utf-8');
    writeFileSync('./generated/spells.json', JSON.stringify(spells, null, 2), 'utf-8');
    writeFileSync('./generated/conditions.json', JSON.stringify(conditions, null, 2), 'utf-8');
    writeFileSync('./generated/diseases.json', JSON.stringify(diseases, null, 2), 'utf-8');
    writeFileSync('./generated/creatures.json', JSON.stringify(creatures, null, 2), 'utf-8');
    writeFileSync('./generated/classes.json', JSON.stringify(classes, null, 2), 'utf-8');
    writeFileSync('./generated/rules.json', JSON.stringify(rules, null, 2), 'utf-8');
    writeFileSync('./generated/actions.json', JSON.stringify(actions, null, 2), 'utf-8');
    writeFileSync('./generated/feats.json', JSON.stringify(feats, null, 2), 'utf-8');

    stopwatch.log('Data written to files');
    stopwatch.stop();
}

main();
