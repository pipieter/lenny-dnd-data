import { Description, parseDescriptions, parseReprint, parseSingleTime, ReprintData } from '../parser';
import { joinStringsWithOr } from '../util';

import { getActionsUrl } from '../urls';
import { Databank } from '../data';
import { Unit } from '../../5etools-collector/types/base';

export interface ParsedAction {
    name: string;
    source: string;
    url: string | null;
    time: string | null;
    description: Description[];
    reprint: ReprintData | null;
}

function parseActionTime(times: Unit[] | undefined): string {
    if (!times) return 'Uncategorized';

    const results = times.map(parseSingleTime);
    return joinStringsWithOr(results);
}

export function getActions(data: Databank): ParsedAction[] {
    const actions = data.action;
    const parsed: ParsedAction[] = actions.map((action) => ({
        name: action.name,
        source: action.source,
        url: getActionsUrl(action.name, action.source),
        time: parseActionTime(action.time),
        description: parseDescriptions('', action.entries),
        reprint: parseReprint(action),
    }));

    return parsed;
}
