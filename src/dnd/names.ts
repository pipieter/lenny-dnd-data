import { Databank } from '../data';

interface SpeciesNameTableEntry {
    min: number;
    max: number;
    result: string;
}

interface SpeciesNameTable {
    option: string;
    table: SpeciesNameTableEntry[];
}

export interface SpeciesName {
    name: string;
    source: string;
    tables: SpeciesNameTable[];
}

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
                // Remove any text inside parentheses
                return entry.result.replace(/\s*\(.*?\)\s*/g, '').trim();
            });

            // FEMALE
            if (option.includes('female')) {
                species.tables.female.push(...table);

                // MALE
            } else if (option.includes('male')) {
                species.tables.male.push(...table);

                // GENDERLESS
            } else if (['child', 'general', 'virtue'].some((o) => option.includes(o))) {
                species.tables.female.push(...table);
                species.tables.male.push(...table);

                // FAMILY
            } else if (['clan', 'family'].some((o) => option.includes(o))) {
                species.tables.family.push(...table);

                // UNSUPPORTED
            } else {
                throw `Unsupported name option in ${species.name} species: '${option}'`;
            }
        }

        result.push(species);
    }

    return result;
}
