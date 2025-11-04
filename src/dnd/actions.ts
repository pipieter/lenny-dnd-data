import { DNDData, ParsedDNDData } from '../interfaces';
import { parseDescriptions, parseSingleTime } from '../parser';
import { getActionsUrl } from '../urls';
import { joinStringsWithOr } from '../util';

interface Action extends DNDData {
    time: any[];
}

interface ParsedAction extends ParsedDNDData {
    time: string;
}

function parseActionTime(times: any[]): string {
    if (!times) return 'Uncategorized';

    let results: string[] = [];
    for (const time of times) {
        const text = typeof time === 'string' ? time : parseSingleTime(time);
        if (!text) throw new Error(`Unsupported action-time ${JSON.stringify(time)}`);
        results.push(text);
    }

    return joinStringsWithOr(results);
}

export function getActions(data: any): ParsedAction[] {
    return (data.action as Action[]).map((action) => {
        return {
            name: action.name,
            source: action.source,
            url: getActionsUrl(action.name, action.source),
            time: parseActionTime(action.time),
            description: parseDescriptions('', action.entries),
        };
    });
}
