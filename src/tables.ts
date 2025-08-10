import { writeFileSync } from 'fs';
import { readJsonFile } from './data';
import { cleanDNDText, Description, parseDescriptionFromTable, Table } from './parser';
import { getTablesUrl } from './urls';
import { table } from 'console';

interface TableGendata {
    table: TableData[];
    tableGroup: {
        name: string;
        type: string;
        tables: TableData[];
        source: string;
    }[];
}

interface TableData {
    name: string;
    source: string;
    caption: string;
    colLabels: string[];
    rows: any[];
    footnotes?: string[];
    chapter?: any;
}

interface ParsedTable {
    name: string;
    source: string;
    url: string;
    roll: string | null;
    table: Description;
    footnotes: string[] | null;
}

function getFootnotes(table: TableData): string[] | null {
    if (!table.footnotes) return null;
    return table.footnotes.map((note) => {
        return cleanDNDText(note, false);
    });
}

function getTableRollExpression(table: TableData): string | null {
    if (!table.colLabels) return null;

    const firstHeader = table.colLabels[0]; // First header always holds the dice expression, if there is one.
    const match = /^d\d+$/.test(firstHeader);
    return match ? `1${firstHeader}` : null;
}

function getGendataTables(): ParsedTable[] {
    // Some tables are stored in an auto-generated file.
    const gendataPath = '5etools-src/data/generated/gendata-tables.json';
    const gendata: TableGendata = readJsonFile(gendataPath);

    let tables: ParsedTable[] = gendata.table
        .filter((table) => {
            // Tables with chapters are used for decorational purposes within books, and can't be looked up.
            // Example: https://5e.tools/book.html#ps-a,5,appendix%3A%20planeswalkers%20and%20the%20multiverse,0 (table with images and location descriptions)
            if (!table.chapter) return table;
        })
        .map((table) => {
            return {
                name: table.name,
                source: table.source,
                url: getTablesUrl(table.name, table.source),
                roll: getTableRollExpression(table),
                table: parseDescriptionFromTable(table),
                footnotes: getFootnotes(table),
            };
        });

    for (const tableGroup of gendata.tableGroup) {
        let items = tableGroup.tables
            .filter((table) => {
                if (!table.chapter) return table; // See line 58
            })
            .map((table) => {
                return {
                    name: `${tableGroup.name} [${table.caption}]`,
                    source: tableGroup.source,
                    url: getTablesUrl(tableGroup.name, tableGroup.source),
                    roll: getTableRollExpression(table),
                    table: parseDescriptionFromTable(table),
                    footnotes: getFootnotes(table),
                };
            });
        tables.push(...items);
    }

    return tables;
}

export function getTables(data: any): ParsedTable[] {
    let tables: ParsedTable[] = (data.table as TableData[])
        .filter((table) => {
            if (!table.chapter) return table; // See line 58
        })
        .map((table) => {
            return {
                name: table.name,
                source: table.source,
                url: getTablesUrl(table.name, table.source),
                roll: getTableRollExpression(table),
                table: parseDescriptionFromTable(table),
                footnotes: getFootnotes(table),
            };
        });

    tables.push(...getGendataTables());
    return tables;
}
