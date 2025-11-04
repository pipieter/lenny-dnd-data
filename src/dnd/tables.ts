import { readJsonFile } from '../data';
import {
    cleanDNDText,
    Description,
    DescriptionType,
    parseDescriptionFromTable,
    Table,
} from '../parser';
import { getTablesUrl } from '../urls';

interface TableGroup {
    name: string;
    type: string;
    tables: TableData[];
    source: string;
}

interface TableGendata {
    table: TableData[];
    tableGroup: TableGroup[];
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

    let firstLabel = cleanDNDText(table.colLabels[0]); // First header always holds the dice expression, if there is one.
    if (firstLabel.startsWith('1')) firstLabel = firstLabel.slice(1);
    const match = /^d\d+(\s*\+\s*d\d+)*$/.test(firstLabel);
    const diceNotation = firstLabel.replace(/\bd(\d+)/g, '1d$1'); // Replace dN with 1dN
    return match ? diceNotation : null;
}

function getTableGroupTableCaption(table: TableData, tableGroup: TableGroup): string {
    if (table.caption) return table.caption;

    // Some tablegroup tables do not have captions, in this case we grab the unique labels as a caption.
    let groupLabels = [];
    for (const groupTable of tableGroup.tables) {
        if (groupTable == table) continue;
        for (const label of groupTable.colLabels) {
            if (!/^d\d+$/.test(label)) groupLabels.push(label);
        }
    }

    let uniqueLabels = [];
    for (const label of table.colLabels) {
        if (/^d\d+$/.test(label)) continue;
        if (groupLabels.includes(label)) continue;
        uniqueLabels.push(label);
    }

    return uniqueLabels.join(' & ');
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
            table: parseDescriptionFromTable(table),
            footnotes: getFootnotes(table),
        };
    });

    for (const tableGroup of gendata.tableGroup) {
        let items = tableGroup.tables.map((table) => {
            return {
                name: `${tableGroup.name} [${getTableGroupTableCaption(table, tableGroup)}]`,
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
    let tables: ParsedTable[] = (data.table as TableData[]).map((table) => {
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

    // Change d100 roll values into ranges
    for (const table of tables) {
        if (!table.roll) continue;
        if (table.table.type != DescriptionType.table) continue;
        const tableValue = table.table.value as Table;
        for (const row of tableValue.rows) {
            if (typeof row[0] !== 'string') continue;
            const ranges = row[0].split(/-|–/);

            if (ranges[0] == '00') ranges[0] = '100';
            let min = parseInt(ranges[0]);
            let max = min;

            if (ranges.length > 1) {
                if (ranges[1] == '00') ranges[1] = '100';
                max = parseInt(ranges[1]);
            }

            row[0] = {
                type: 'range',
                min,
                max,
            };
        }
    }

    return tables;
}
