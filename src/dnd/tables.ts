import { TableData, TableGroup } from '../../5etools-collector/types/table';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { DescriptionTable, DescriptionType, ReprintData, parseDescriptionFromTable, parseReprint } from '../parser';
import { getTablesUrl } from '../urls';

export interface ParsedTable {
    name: string;
    source: string;
    url: string;
    roll: string | null;
    table: DescriptionTable;
    footnotes: string[] | null;
    reprint: ReprintData | null;
}

function getFootnotes(table: TableData): string[] | null {
    if (!table.footnotes) return null;
    return table.footnotes.map((note) => {
        if (typeof note !== 'string') throw 'Unsupported table footnote - footnote is not a string.';
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
    if (!table.colLabels) return '';
    if (!tableGroup.tables) return '';

    // Some tablegroup tables do not have captions, in this case we grab the unique labels as a caption.
    const groupLabels = [];
    for (const groupTable of tableGroup.tables) {
        if (groupTable == table) continue;
        if (!groupTable.colLabels) continue;
        for (const label of groupTable.colLabels) {
            if (!/^d\d+$/.test(label)) groupLabels.push(label);
        }
    }

    const uniqueLabels = [];
    for (const label of table.colLabels) {
        if (/^d\d+$/.test(label)) continue;
        if (groupLabels.includes(label)) continue;
        uniqueLabels.push(label);
    }

    return uniqueLabels.join(' & ');
}

function tableRollValuesToRanges(table: ParsedTable): ParsedTable {
    if (!table.roll) return table;
    if (table.table.type != DescriptionType.table) return table;

    for (const row of table.table.table.rows) {
        if (typeof row[0] !== 'string') continue;
        const ranges = row[0].split(/-|–/);

        if (ranges[0] == '00') ranges[0] = '100';
        const min = parseInt(ranges[0]);
        let max = min;

        if (!min) {
            // In certain tables, like 'Choose Languages; Standard Languages' there are default values in the rollable table.
            // We want to mark these with 'null', so a rollable table understands that this is a value related to the table,
            // but not a result we can actually roll.
            // Choose Languages; Standard Languages - https://5e.tools/tables.html#choose%20languages%3b%20standard%20languages_xphb
            row[0] = null;
            continue;
        }

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

    return table;
}

export function getTables(data: Databank): ParsedTable[] {
    const tables: ParsedTable[] = data.table.map((table) => {
        const parsed = {
            name: table.name,
            source: table.source,
            url: getTablesUrl(table.name, table.source),
            roll: getTableRollExpression(table),
            table: parseDescriptionFromTable(table),
            footnotes: getFootnotes(table),
            reprint: parseReprint(table),
        };

        return tableRollValuesToRanges(parsed);
    });

    tables.push(
        ...data.tableGroup.flatMap((tableGroup) => {
            if (!tableGroup.tables) return [];
            return tableGroup.tables.map((table) => {
                const parsed = {
                    name: `${tableGroup.name} [${getTableGroupTableCaption(table, tableGroup)}]`,
                    source: tableGroup.source,
                    url: getTablesUrl(tableGroup.name, tableGroup.source),
                    roll: getTableRollExpression(table),
                    table: parseDescriptionFromTable(table),
                    footnotes: getFootnotes(table),
                    reprint: parseReprint(tableGroup),
                };

                return tableRollValuesToRanges(parsed);
            });
        })
    );

    return tables;
}
