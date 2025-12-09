import { Databank } from '../data';
import { Description, parseDescriptions } from '../parser';
import { getDeitiesUrl } from '../urls';

export interface Deity {
    name: string;
    source: string;
    pantheon: string;
    alignment: string[];
    category: string;
    title?: string;
    worshipers?: string;
    plane?: string;
    domains: string[];
    province: string;
    symbol: string;
    symbolImg: any; // TODO
    entries?: string[];
}

interface ParsedDeity {
    name: string;
    source: string;
    subtitle: string;
    url: string;
    imgUrl: string | null;
    inlineDescription: Description[];
    description: Description[];
}

export function getDeities(data: Databank): ParsedDeity[] {
    return data.deity.map((d) => {
        return {
            name: d.name,
            source: d.source,
            subtitle: d.title ?? `${d.pantheon} Deity`,
            url: getDeitiesUrl(d.name, d.source),
            imgUrl: null, // TODO
            inlineDescription: [], // TODO
            description: d.entries ? parseDescriptions('', d.entries) : [],
        };
    });
}
