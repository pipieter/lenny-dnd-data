import { Description, parseDescriptions, parseSingleTime } from '../parser';
import { getActionsUrl } from '../urls';
import { joinStringsWithOr } from '../util';

import interfacesTI from '../interfaces-ti';
import { Checker, CheckerT, createCheckers } from 'ts-interface-checker';
import { validate } from '../validate';

const { ActionChecker } = createCheckers(interfacesTI) as {
    ActionChecker: CheckerT<Action>;
};

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
    const actions = validate<Action>(data.action, ActionChecker);
    // TODO rewrite
    return [];
}
