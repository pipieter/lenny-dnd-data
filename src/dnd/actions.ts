import { Description, parseDescriptions, parseSingleTime } from '../parser';
import { joinStringsWithOr } from '../util';

import interfacesTI from '../interfaces-ti';
import { createCheckers } from 'ts-interface-checker';
import { validate } from '../validate';
import { getActionsUrl } from '../urls';
import { Action, Time } from '../interfaces';

const checkers = createCheckers(interfacesTI);
const ActionChecker = checkers.Action;

interface ParsedAction {
    name: string;
    source: string;
    url: string;
    time: string;
    description: Description[];
}

function parseActionTime(times: Time[] | undefined): string {
    if (!times) return 'Uncategorized';

    const results: string[] = [];
    for (const time of times) {
        const text = typeof time === 'string' ? time : parseSingleTime(time);
        if (!text) throw new Error(`Unsupported action-time ${JSON.stringify(time)}`);
        results.push(text);
    }

    return joinStringsWithOr(results);
}

export function getActions(data: any): ParsedAction[] {
    const actions = validate<Action>(data.action, ActionChecker);
    const parsed: ParsedAction[] = actions.map((action) => ({
        name: action.name,
        source: action.source,
        url: getActionsUrl(action),
        time: parseActionTime(action.time),
        description: parseDescriptions('', action.entries),
    }));

    return parsed;
}
