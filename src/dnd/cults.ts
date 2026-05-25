import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, parseDescriptions, parseReprint, ReprintData } from '../parser';
import { getCultsBoonsUrl } from '../urls';

export interface Cult {
    name: string;
    source: string;
    type: string;
    goal?: any;
    cultists?: any;
    signatureSpells?: any;
    entries: any[];
    reprintedAs: any[];
}

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

export function getCults(databank: Databank): ParsedCult[] {
    const cults: ParsedCult[] = [];

    for (const cult of databank.cult) {
        const name = cult.name;
        const source = cult.source;
        const url = getCultsBoonsUrl(cult.name, cult.source);
        const type = cult.type;
        const goal = cult.goal ? cleanDNDText(cult.goal.entry) : null;
        const cultists = cult.cultists ? cleanDNDText(cult.cultists.entry) : null;
        const signatureSpells = cult.signatureSpells ? cleanDNDText(cult.signatureSpells.entry) : null;
        const description = parseDescriptions('', cult.entries);
        const reprint = parseReprint(cult);

        cults.push({
            name,
            source,
            url,
            type,
            goal,
            cultists,
            signatureSpells,
            description,
            reprint,
        });
    }

    return cults;
}
