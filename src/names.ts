interface NameTableEntry {
    min: number;
    max: number;
    result: string;
}

interface NameTable {
    option: string;
    table: NameTableEntry[];
}

interface RaceNames {
    name: string;
    source: string;
    tables: NameTable[];
}

interface ParsedNames {
    name: string;
    source: string;
    tables: {
        female: string[];
        male: string[];
        family: string[];
    };
}

export function getNames(data: any): ParsedNames[] {
    let result: ParsedNames[] = [];
    for (let namesList of data.name as RaceNames[]) {
        const race: ParsedNames = {
            name: namesList.name,
            source: namesList.source,
            tables: {
                female: [],
                male: [],
                family: [],
            },
        };

        for (let nameTable of namesList.tables) {
            const option = nameTable.option.toLowerCase();
            const table = nameTable.table.map((entry: { result: string }) => {
                // Remove any text inside parentheses
                return entry.result.replace(/\s*\(.*?\)\s*/g, '').trim();
            });

            // FEMALE
            if (option.includes('female')) {
                race.tables.female.push(...table);

                // MALE
            } else if (option.includes('male')) {
                race.tables.male.push(...table);

                // GENDERLESS
            } else if (['child', 'general'].some((o) => option.includes(o))) {
                race.tables.female.push(...table);
                race.tables.male.push(...table);

                // FAMILY
            } else if (['clan', 'family', 'virtue'].some((o) => option.includes(o))) {
                race.tables.family.push(...table);

                // UNSUPPORTED
            } else {
                throw `Unsupported name option in ${race.name} race: '${option}'`;
            }
        }

        result.push(race);
    }

    return result;
}
