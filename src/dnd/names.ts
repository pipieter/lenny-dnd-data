import { Databank } from '../data';

export interface ParsedSpeciesNames {
    name: string;
    source: string;
    tables: {
        female: string[];
        male: string[];
        family: string[];
    };
}

export function getNames(data: Databank): ParsedSpeciesNames[] {
    const result: ParsedSpeciesNames[] = [];
    for (const namesList of data.name) {
        const species: ParsedSpeciesNames = {
            name: namesList.name,
            source: namesList.source,
            tables: {
                female: [],
                male: [],
                family: [],
            },
        };

        for (const nameTable of namesList.tables) {
            const option = nameTable.option.toLowerCase();
            const table = nameTable.table.map((entry: { result: string }) => {
                return entry.result.replace(/\s*\(.*?\)\s*/g, '').trim(); // Remove any text inside parentheses
            });

            if (option.includes('female')) {
                species.tables.female.push(...table);
            } else if (option.includes('male')) {
                species.tables.male.push(...table);
            } else if (['child', 'general', 'virtue'].some((o) => option.includes(o))) {
                // These aren't gender specific, and are thus pushed to both tables.
                species.tables.female.push(...table);
                species.tables.male.push(...table);
            } else if (['clan', 'family'].some((o) => option.includes(o))) {
                species.tables.family.push(...table);
            } else {
                throw `Unsupported name option in ${species.name} species: '${option}'`;
            }
        }

        result.push(species);
    }

    return result;
}
