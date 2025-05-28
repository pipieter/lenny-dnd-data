import { writeFileSync } from 'fs';
import { getConditionsStatusesAndDiseases } from './conditions';
import { loadData } from './data';
import { getCreatures } from './creatures';

function main(): void {
    const data = loadData('./5etools-src/data');

    const { conditions, diseases } = getConditionsStatusesAndDiseases(data);
    writeFileSync('./generated/conditions.json', JSON.stringify(conditions, null, 2), 'utf-8');
    writeFileSync('./generated/diseases.json', JSON.stringify(diseases, null, 2), 'utf-8');

    const creatures = getCreatures();
    writeFileSync('./generated/creatures.json', JSON.stringify(creatures, null, 2), 'utf-8');
}

main();
