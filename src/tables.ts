import { writeFileSync } from 'fs';
import { readJsonFile } from './data';
import { cleanDNDText, Table } from './parser';
import { getTablesUrl } from './urls';

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
}

interface ParsedTable {
    name: string;
    source: string;
    url: string;
    roll: string | null;
    table: Table; // TODO: Should be Description, for easy parsing.
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

    let tables: ParsedTable[] = gendata.table.map((table) => {
        return {
            name: table.name,
            source: table.source,
            url: getTablesUrl(table.name, table.source),
            roll: getTableRollExpression(table),
            table: {
                title: table.caption,
                headers: table.colLabels ?? null,
                rows: table.rows,
            },
            footnotes: getFootnotes(table)
        };
    });

    for (const tableGroup of gendata.tableGroup) {
        let items = tableGroup.tables.map((item) => {
            return {
                name: `${tableGroup.name} [${item.caption}]`,
                source: tableGroup.source,
                url: getTablesUrl(tableGroup.name, tableGroup.source),
                roll: getTableRollExpression(item),
                table: {
                    title: item.caption,
                    headers: item.colLabels ?? null,
                    rows: item.rows,
                },
                footnotes: getFootnotes(item)
            };
        });
        tables.push(...items);
    }

    return tables;
}

export function getTables(data: any): ParsedTable[] {
    let tables: ParsedTable[] = (data.table as TableData[]).map((table) => {
        return {
            name: table.name,
            source: table.source,
            url: getTablesUrl(table.name, table.source),
            roll: getTableRollExpression(table),
            table: {
                title: table.caption,
                headers: table.colLabels ?? null,
                rows: table.rows,
            },
            footnotes: getFootnotes(table)
        };
    });

    tables.push(...getGendataTables());
    return tables;
}
