import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, parseDescriptions, parseReprint, ReprintData } from '../parser';
import { getCultsBoonsUrl } from '../urls';

export interface ParsedBoon {
    name: string;
    source: string;
    url: string;
    type: string;
    ability: string | null;
    signatureSpells: string | null;
    description: Description[];
    reprint: ReprintData | null;
}

export function getBoons(data: Databank): ParsedBoon[] {
    return data.boon.map((boon) => {
        return {
            name: boon.name,
            source: boon.source,
            url: getCultsBoonsUrl(boon.name, boon.source),
            type: boon.type,
            ability: boon.ability ? cleanDNDText(boon.ability.entry) : null,
            signatureSpells: boon.signatureSpells ? cleanDNDText(boon.signatureSpells.entry) : null,
            description: parseDescriptions('', boon.entries),
            reprint: parseReprint(boon),
        };
    });
}
