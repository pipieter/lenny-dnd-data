import { Description, parseDescriptions, parseSingleTime } from '../parser';
import { joinStringsWithOr } from '../util';

import interfacesTI from '../interfaces-ti';
import { CheckerT, createCheckers } from 'ts-interface-checker';
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

/*
interface Action {
    name: string;
    source: string;
    page: number;
    srd: boolean;
    basicRules: boolean;
    time: any[];
    entries: (string | any)[];
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
*/

export function getActions(data: any): ParsedAction[] {
    console.log(Object.keys(data));
    console.log(data.action);
    console.log(ActionChecker);
    const actions = validate<Action>(data.action, ActionChecker);
    const parsed: ParsedAction[] = actions.map((action) => ({
        name: action.name,
        source: action.source,
        url: getActionsUrl(action),
        time: parseActionTime(action.time),
        description: parseDescriptions('', action.entries),
    }));
    // TODO rewrite
    return parsed;
}
