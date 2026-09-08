import { cleanDNDText } from '../clean';
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
        goal: cult.goal ? cleanDNDText(cult.goal.entry) : null,
        cultists: cult.cultists ? cleanDNDText(cult.cultists.entry) : null,
        signatureSpells: cult.signatureSpells ? cleanDNDText(cult.signatureSpells.entry) : null,
        description: parseDescriptions('', cult.entries),
        reprint: parseReprint(cult),
    }));
}
