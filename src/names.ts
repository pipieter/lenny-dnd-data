interface NameTableEntry {
    min: number;
    max: number;
    result: string;
}

interface NameTable {
    option: string;
    table: NameTableEntry[]
}

interface RaceNames {
    name: string;
    source: string;
    tables: NameTable[]
}

interface ParsedNames {
    name: string;
    source: string;
    tables: {
        option: string;
        names: string[];
    }[];
}

export function getNames(data: any): ParsedNames[] {
    let result: ParsedNames[] = [];
    for (let namesList of data.name as RaceNames[]) {
        const race: ParsedNames = {
            name: namesList.name,
            source: namesList.source,
            tables: []
        };

         for (let nameTable of namesList.tables) {
            const tableData = {
                option: nameTable.option,
                names: [] as string[]
            };

            for (let nameEntry of nameTable.table) {
                tableData.names.push(nameEntry.result);
            }

            race.tables.push(tableData);
        }
        
        result.push(race)
    }

    return result;
}
