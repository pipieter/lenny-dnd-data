import { Fluff } from '../../5etools-collector/types/fluff';
import { Databank } from '../data';
import { Description, parseDescriptions, parseImageUrl, parseObjectSizes, parseReprint, ReprintData } from '../parser';
import { getObjectsUrl, getObjectTokenUrl } from '../urls';

export interface DNDObject {
    name: string;
    source: string;
    page: number;
    reprintedAs?: string[];
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
    entries: (string | object)[];
    actionEntries?: (string | object)[];
    tokenCredit?: string;
    altArt?: object[];
    token?: {
        name: string;
        source: string;
    };
    hasToken?: boolean;
    hasFluffImages?: boolean;
}

export interface ParsedDNDObject {
    name: string;
    source: string;
    subtitle: string;
    url: string;
    tokenUrl: string | null;
    description: Description[];
    image: string | null;
    reprint: ReprintData | null;
}

function getObjectSubtitle(obj: DNDObject): string {
    return `${parseObjectSizes(obj.size)} object`;
}

function parseObjectTokenURL(obj: DNDObject): string | null {
    if (obj.token) {
        // If obj.token is given, token is inherited from another object.
        return getObjectTokenUrl(obj.token.name, obj.token.source);
    }
    if (obj.hasToken) {
        return getObjectTokenUrl(obj.name, obj.source);
    }
    return null;
}

function getObjectImage(obj: DNDObject, data: Databank): string | null {
    const fluff = data.search<Fluff>('objectFluff', obj.name, obj.source);
    if (fluff?.images) {
        return parseImageUrl(fluff.images);
    }
    return null;
}

export function getObjects(data: Databank): ParsedDNDObject[] {
    return data.object.map((obj) => {
        const descriptions = [];
        if (obj.entries) descriptions.push(...parseDescriptions('', obj.entries));
        if (obj.actionEntries) descriptions.push(...parseDescriptions('', obj.actionEntries));

        return {
            name: obj.name,
            source: obj.source,
            subtitle: getObjectSubtitle(obj),
            url: getObjectsUrl(obj.name, obj.source),
            tokenUrl: parseObjectTokenURL(obj),
            description: descriptions,
            image: getObjectImage(obj, data),
            reprint: parseReprint(obj),
        };
    });
}
