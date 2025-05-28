import { writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './conditions';
import { loadData } from './data';
import { getSpells } from './spells';
import { getCreatures } from './creatures';

function main(): void {
    const path = './5etools-src/data';
    const data = loadData(path);

    const spells = getSpells('./5etools-src/data/spells');
    const { conditions, diseases } = getConditionsStatusesAndDiseases(data);

    writeFileSync('./generated/spells.json', JSON.stringify(spells, null, 2), 'utf-8');
    writeFileSync('./generated/conditions.json', JSON.stringify(conditions, null, 2), 'utf-8');
    writeFileSync('./generated/diseases.json', JSON.stringify(diseases, null, 2), 'utf-8');

    const creatures = getCreatures();
    writeFileSync('./generated/creatures.json', JSON.stringify(creatures, null, 2), 'utf-8');
}

main();
