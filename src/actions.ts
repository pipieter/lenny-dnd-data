import { Description, parseDescriptions, parseSingleTime } from './parser';
import { getActionsUrl } from './urls';
import { joinStringsWithOr } from './util';

interface Action {
    name: string;
    source: string;
    page: number;
    srd: boolean;
    basicRules: boolean;
    time: any[];
    entries: (string | any)[];
}

interface ParsedAction {
    name: string;
    source: string;
    url: string;
    time: string;
    description: Description[];
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
