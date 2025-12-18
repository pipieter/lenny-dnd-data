import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, parseDescriptions } from '../parser';

export interface Cult {
    name: string;
    source: string;
    type: string;
    goal?: any;
    cultists?: any;
    signatureSpells?: any;
    entries: any[];
}

export interface ParsedCult {
    name: string;
    source: string;
    type: string;
    goal: string | null;
    cultists: string | null;
    signatureSpells: string | null;
    description: Description[];
}

export function getCults(databank: Databank): ParsedCult[] {
    const cults: ParsedCult[] = [];

    for (const cult of databank.cult) {
        const name = cult.name;
        const source = cult.source;
        const type = cult.type;
        const goal = cult.goal ? cleanDNDText(cult.goal.entry) : null;
        const cultists = cult.cultists ? cleanDNDText(cult.cultists.entry) : null;
        const signatureSpells = cult.signatureSpells ? cleanDNDText(cult.signatureSpells.entry) : null;
        const description = parseDescriptions('', cult.entries);

        cults.push({
            name,
            source,
            type,
            goal,
            cultists,
            signatureSpells,
            description,
        });
    }

    return cults;
}
