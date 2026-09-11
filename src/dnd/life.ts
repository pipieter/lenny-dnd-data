import { LifeBackground, LifeClass } from '../../5etools-collector/types/life';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';

export interface ParsedLife {
    class: Record<string, LifeClass>;
    background: Record<string, LifeBackground>;
    trinket: string[];
}

export function getLife(databank: Databank): ParsedLife[] {
    const classes = databank.lifeClass.map((c) => {
        const other: { [key: string]: string[] } = {};
        for (const key in c.other) {
            other[key] = c.other[key].map((o) => cleanDNDText(o));
        }
        const parsed = {
            name: c.name,
            source: c.source,
            reasons: c.reasons.map((r) => cleanDNDText(r)),
            other,
        };

        return [c.name, parsed]; // Tuple to later on convert to a dict.
    });

    const backgrounds = databank.lifeBackground.map((bg) => {
        const parsed = {
            name: bg.name,
            source: bg.source,
            reasons: bg.reasons.map((r) => cleanDNDText(r)),
        };
        return [bg.name, parsed]; // Tuple to later on convert to a dict.
    });

    const trinkets = databank.lifeTrinket.map((t) => cleanDNDText(t));

    // Due to how Databank works, we have to return this as an Array.
    return [
        {
            class: Object.fromEntries(classes),
            background: Object.fromEntries(backgrounds),
            trinket: trinkets,
        },
    ];
}
