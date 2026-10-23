import { handleCopy } from '../5etools-conversion/copy';
import { DeityBase } from '../../5etools-collector/types/deity';
import { Databank } from '../data';
import { parseAlignments } from '../parse/base';
import { cleanDNDText } from '../parse/clean';
import { Description, DescriptionType, parseDescriptions } from '../parse/description';
import { getDeitiesUrl, getEntryImageUrl } from '../parse/urls';
import { joinStringsWithAnd, title } from '../util';

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

function parseDeityInlineDescriptions(deity: DeityBase): Description[] {
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
    return data.deity.flatMap((deity) => {
        deity = handleCopy(deity, data.deity);
        return {
            name: deity.name,
            source: deity.source,
            subtitle: deity.title ? title(deity.title) : `${deity.pantheon} Deity`,
            url: getDeitiesUrl(deity.name, deity.source, deity.pantheon),
            imgUrl: getEntryImageUrl(deity.symbolImg),
            inlineDescription: parseDeityInlineDescriptions(deity),
            description: parseDescriptions('', deity.entries ?? []),
        };
    });
}
