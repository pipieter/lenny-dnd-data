import { cleanOptionalDNDText } from '../clean';
import { Databank } from '../data';
import { Description, ReprintData, parseDescriptions, parseReprint } from '../parser';
import { getCultsBoonsUrl } from '../urls';

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
