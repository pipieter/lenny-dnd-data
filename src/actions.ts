import { Description, parseDescriptions, title } from './parser';
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
    if (!times) return 'Unknown';
    let results: string[] = [];

    for (const time of times) {
        if (typeof time === 'string') {
            results.push(time);
            continue;
        }

        if (time.number && time.unit) {
            if (time.unit === 'bonus') time.unit = 'bonus action';
            const text = title(`${time.number} ${time.unit}`);
            results.push(text);
            continue;
        }

        throw `Unsupported Action-Time ${time}`;
    }

    return joinStringsWithOr(results);
}

export function getActions(data: any): ParsedAction[] {
    return (data.action as Action[]).map((action) => {
        console.log(action.name);

        return {
            name: action.name,
            source: action.source,
            url: getActionsUrl(action.name, action.source),
            time: parseActionTime(action.time),
            description: parseDescriptions('', action.entries),
        };
    });
}
