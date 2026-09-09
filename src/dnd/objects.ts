import { DNDObject } from '../../5etools-collector/types/object';
import { Databank } from '../data';
import { Description, ReprintData, parseDescriptions, parseObjectSizes, parseReprint } from '../parser';
import { getFluffImageUrl, getObjectTokenUrl, getObjectsUrl } from '../urls';
import { findFluff } from '../util';

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
    return `${parseObjectSizes(obj.size ?? [])} object`;
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

export function getObjects(data: Databank): ParsedDNDObject[] {
    return data.object.map((obj) => {
        const fluff = findFluff(obj, data.objectFluff);
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
            image: getFluffImageUrl(fluff),
            reprint: parseReprint(obj),
        };
    });
}
