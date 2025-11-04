import { DNDDataWithToken, ParsedDNDDataWithToken } from '../interfaces';
import { parseDescriptions, parseSizes } from '../parser';
import { getObjectsUrl, getObjectTokenUrl } from '../urls';

interface Object extends DNDDataWithToken{
    size: string[];
    objectType: string; // Seemingly not used by 5e.tools, always shows 'object'.
    ac: number;
    hp: number;
    speed?: number;
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    immune?: string[];
    conditionImmune?: string[];
    actionEntries: (string | object)[];
    altArt?: object[];
    token?: {
        name: string;
        source: string;
    };
}

interface ParsedObject extends ParsedDNDDataWithToken {}

function getObjectSubtitle(obj: Object): string {
    return `${parseSizes(obj.size)} object`;
}

function parseObjectTokenURL(obj: Object): string | null {
    if (obj.token) {
        // If obj.token is given, token is inherited from another object.
        return getObjectTokenUrl(obj.token.name, obj.token.source);
    }
    if (obj.hasToken) {
        return getObjectTokenUrl(obj.name, obj.source);
    }
    return null;
}

export function getObjects(data: any): ParsedObject[] {
    return (data.object as Object[]).map((obj) => {
        return {
            name: obj.name,
            source: obj.source,
            subtitle: getObjectSubtitle(obj),
            url: getObjectsUrl(obj.name, obj.source),
            tokenUrl: parseObjectTokenURL(obj),
            description: obj.entries ? parseDescriptions('', obj.entries) : [],
        };
    });
}
