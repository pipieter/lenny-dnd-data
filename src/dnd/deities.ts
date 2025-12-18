import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, DescriptionType, parseAlignments, parseDescriptions, title } from '../parser';
import { getDeitiesUrl, getImageUrl } from '../urls';
import { joinStringsWithAnd } from '../util';

export interface Deity {
    name: string;
    source: string;
    pantheon: string;
    alignment?: string[];
    category?: string;
    title?: string;
    worshipers?: string;
    plane?: string;
    domains?: string[];
    province?: string;
    symbol?: string;
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

function parseDeityInlineDescriptions(deity: Deity): Description[] {
    const descriptions: Description[] = [];

    descriptions.push({ name: 'Pantheon', type: DescriptionType.text, value: deity.pantheon });
    if (deity.alignment) {
        const alignments = joinStringsWithAnd(parseAlignments(deity.alignment));
        descriptions.push({ name: 'Alignment', type: DescriptionType.text, value: alignments });
    }
    if (deity.domains) {
        const domains = joinStringsWithAnd(deity.domains);
        descriptions.push({ name: 'Domains', type: DescriptionType.text, value: domains });
    }
    if (deity.category) {
        descriptions.push({ name: 'Category', type: DescriptionType.text, value: deity.category });
    }
    if (deity.province) {
        descriptions.push({ name: 'Province', type: DescriptionType.text, value: deity.province });
    }
    if (deity.symbol) {
        descriptions.push({
            name: 'Symbol',
            type: DescriptionType.text,
            value: cleanDNDText(deity.symbol),
        });
    }

    return descriptions;
}

export function getDeities(data: Databank): ParsedDeity[] {
    return data.deity.map((d) => {
        return {
            name: d.name,
            source: d.source,
            subtitle: d.title ? title(d.title) : `${d.pantheon} Deity`,
            url: getDeitiesUrl(d.name, d.source, d.pantheon),
            imgUrl: d.symbolImg ? getImageUrl(d.symbolImg.href.path) : null,
            inlineDescription: parseDeityInlineDescriptions(d),
            description: d.entries ? parseDescriptions('', d.entries) : [],
        };
    });
}
