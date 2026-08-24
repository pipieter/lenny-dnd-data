import { Deity } from '../../5etools-collector/types/deity';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, DescriptionType, parseAlignments, parseDescriptions, title } from '../parser';
import { getDeitiesUrl, getImageUrl } from '../urls';
import { joinStringsWithAnd } from '../util';

export interface ParsedDeity {
    name: string;
    source: string;
    subtitle: string;
    url: string;
    imgUrl: string | null;
    inlineDescription: Description[];
    description: Description[];
    // Deities do not handle reprinting in data.
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
    return data.deity.map((deity) => {
        return {
            name: deity.name,
            source: deity.source,
            subtitle: deity.title ? title(deity.title) : `${deity.pantheon} Deity`,
            url: getDeitiesUrl(deity.name, deity.source, deity.pantheon),
            imgUrl: deity.symbolImg ? getImageUrl(deity.symbolImg.href.path) : null,
            inlineDescription: parseDeityInlineDescriptions(deity),
            description: deity.entries ? parseDescriptions('', deity.entries) : [],
        };
    });
}
