import { Databank } from '../data';
import { ReprintData, parseReprint } from '../parse/base';
import { cleanOptionalDNDText } from '../parse/clean';
import { Description, parseDescriptions } from '../parse/description';
import { getCultsBoonsUrl } from '../parse/urls';

export interface ParsedCult {
    name: string;
    source: string;
    url: string;
    type: string;
    goal: string | null;
    cultists: string | null;
    signatureSpells: string | null;
    description: Description[];
    reprint: ReprintData | null;
}

export function getCults(data: Databank): ParsedCult[] {
    return data.cult.map((cult) => ({
        name: cult.name,
        source: cult.source,
        url: getCultsBoonsUrl(cult.name, cult.source),
        type: cult.type,
        goal: cleanOptionalDNDText(cult.goal?.entry),
        cultists: cleanOptionalDNDText(cult.cultists?.entry),
        signatureSpells: cleanOptionalDNDText(cult.signatureSpells?.entry),
        description: parseDescriptions('', cult.entries),
        reprint: parseReprint(cult),
    }));
}
