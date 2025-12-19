import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, parseDescriptions } from '../parser';

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
    type: string;
    ability: string | null;
    signatureSpells: string | null;
    description: Description[];
}

export function getBoons(databank: Databank): ParsedBoon[] {
    const boons = databank.boon.map((boon) => {
        const name = boon.name;
        const source = boon.source;
        const type = boon.type;
        const ability = boon.ability ? cleanDNDText(boon.ability.entry) : null;
        const signatureSpells = boon.signatureSpells ? cleanDNDText(boon.signatureSpells.entry) : null;
        const description = parseDescriptions('', boon.entries);

        return {
            name,
            source,
            type,
            ability,
            signatureSpells,
            description,
        };
    });

    return boons;
}
