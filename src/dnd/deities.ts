import { Databank } from '../data';
import { Description, parseDescriptions } from '../parser';
import { getDeitiesUrl, getImageUrl } from '../urls';

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
    symbolImg?: DeitySymbolImg;
    entries?: string[];
}

interface DeitySymbolImg {
    type: string;
    href: {
        type: string;
        path: string;
    };
    credit: string;
    width: number;
    height: number;
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
            imgUrl: d.symbolImg ? getImageUrl(d.symbolImg.href.path) : null,
            inlineDescription: [], // TODO
            description: d.entries ? parseDescriptions('', d.entries) : [],
        };
    });
}
