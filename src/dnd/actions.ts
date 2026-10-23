import { Unit } from '../../5etools-collector/types/internal/base';
import { Databank } from '../data';
import { ReprintData, parseReprint, parseUnit } from '../parse/base';
import { Description, parseDescriptions } from '../parse/description';
import { getActionsUrl } from '../parse/urls';
import { joinStringsWithOr } from '../util';

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

    const results = times.map(parseUnit);
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
