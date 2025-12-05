import { Description, parseDescriptions, parseSingleTime } from '../parser';
import { joinStringsWithOr } from '../util';

import { getActionsUrl } from '../urls';
import { Databank } from '../data';

export interface Action {
    name: string;
    source: string;
    time?: any[];
    entries: any[];
}

interface ParsedAction {
    name: string;
    source: string;
    url: string | null;
    time: string | null;
    description: Description[];
}

function parseActionTime(times: any[] | undefined): string {
    if (!times) return 'Uncategorized';

    const results: string[] = [];
    for (const time of times) {
        const text = typeof time === 'string' ? time : parseSingleTime(time);
        if (!text) throw new Error(`Unsupported action-time ${JSON.stringify(time)}`);
        results.push(text);
    }

    return joinStringsWithOr(results);
}

export function getActions(data: Databank): ParsedAction[] {
    const actions: Action[] = data.action;
    const parsed: ParsedAction[] = actions.map((action) => ({
        name: action.name,
        source: action.source,
        url: getActionsUrl(action.name, action.source),
        time: parseActionTime(action.time),
        description: parseDescriptions('', action.entries),
    }));

    return parsed;
}
