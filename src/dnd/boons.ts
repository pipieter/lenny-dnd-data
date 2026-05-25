import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, parseDescriptions, parseReprint, ReprintData } from '../parser';
import { getCultsBoonsUrl } from '../urls';

export interface Boon {
    name: string;
    source: string;
    type: string;
    ability?: any;
    signatureSpells?: any;
    entries: any[];
}

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

export function getBoons(databank: Databank): ParsedBoon[] {
    const boons = databank.boon.map((boon) => {
        const name = boon.name;
        const source = boon.source;
        const url = getCultsBoonsUrl(boon.name, boon.source);
        const type = boon.type;
        const ability = boon.ability ? cleanDNDText(boon.ability.entry) : null;
        const signatureSpells = boon.signatureSpells ? cleanDNDText(boon.signatureSpells.entry) : null;
        const description = parseDescriptions('', boon.entries);
        const reprint = parseReprint(boon);

        return {
            name,
            source,
            url,
            type,
            ability,
            signatureSpells,
            description,
            reprint,
        };
    });

    return boons;
}
