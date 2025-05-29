import { readJsonFile, getKey } from './data';
import {
    cleanUrl,
    Description,
    parseCreatureSummonSpell,
    parseCreatureTypes,
    parseDescriptions,
    parseSizes,
} from './parser';

const BASEPATH = '5etools-src/data/bestiary/';

interface JsonCreature {
    name: string;
    source: string;
    subtitle: string | null;
    summonedBySpell: string | null;

    tokenUrl: string | null;
    url: string;

    description: Description[] | null;
}

class Creature {
    name: string;
    source: string;
    subtitle: string | null = null;
    summonedBySpell: string | null = null;
    hasToken: boolean | null = null;

    description: Description[] | null = null;
    parentKey: string | null = null;

    constructor(data: any, isFluff: boolean) {
        this.name = data['name'];
        this.source = data['source'];

        if (isFluff) {
            const entries = data['entries'] || null;
            if (entries) {
                this.description = parseDescriptions('', this.filterEntries(entries), this.url());
            }
        } else {
            this.subtitle = this.getSubtitle(data);
            this.summonedBySpell = parseCreatureSummonSpell(data['summonedBySpell'] || '');
            this.hasToken = data['hasToken'] || false;
        }

        const _copy = data['_copy'] || null;
        if (_copy) {
            this.parentKey = getKey(_copy['name'], _copy['source']);
        }
    }

    private getSubtitle(data: any): string | null {
        const sizeData = data['size'];
        const typeData = data['type'];

        const size = sizeData ? parseSizes(sizeData) : null;
        const type = typeData ? parseCreatureTypes(typeData) : null;

        if (!size && !type) {
            return null;
        }

        const text = size + ' ' + type;
        return text.trim();
    }

    private filterEntries(entries: any[]): any[] {
        // Creatures generally have way too many entries, impacting performance heavily. We pre-cut entries we may not need.
        let filteredEntries: any[] = [];

        entries.forEach((entry: any) => {
            if (entry['type'] !== 'entries') {
                return; // Only 'entries' hold information we'd want to use.
            }

            if (entry['name']) {
                return; // Entries with names are generally not directly related to the creature, but rather to a book or it's race.
            }

            filteredEntries.push(entry);
            if (filteredEntries.length >= 2) {
                return; // Limit to 2 entries max, generally the first two entries are actual descriptions of a creature.
            }
        });

        return filteredEntries;
    }

    mergeWithFluff(fluffCreature: Creature) {
        this.description = fluffCreature.description;
    }

    inheritFrom(parent: Creature) {
        if (!this.parentKey) {
            return;
        }

        if (this.isFluff()) {
            this.description = this.description ?? parent.description;
            return;
        }

        this.subtitle = this.subtitle ?? parent.subtitle;
        this.summonedBySpell = this.summonedBySpell ?? parent.summonedBySpell;
    }

    isFluff() {
        return !this.subtitle && !this.summonedBySpell && !this.hasToken;
    }

    tokenUrl() {
        if (!this.hasToken) {
            return null;
        }

        const url = `https://5e.tools/img/bestiary/tokens/${this.source}/${this.name}.webp`;
        return cleanUrl(url);
    }

    url() {
        const url = `https://5e.tools/bestiary.html#${this.name}_${this.source}`;
        return cleanUrl(url);
    }
}

function loadCreaturesFromIndex(loadFluff: boolean): any {
    const file = loadFluff ? 'fluff-index.json' : 'index.json';
    const monsterKey = loadFluff ? 'monsterFluff' : 'monster';
    const indexPath = BASEPATH + file;
    const indexData = readJsonFile(indexPath);

    let creatures: { [key: string]: Creature } = {};
    for (const [source, sourceIndexFile] of Object.entries(indexData)) {
        const path = BASEPATH + sourceIndexFile;
        const data = readJsonFile(path);

        if (!data[monsterKey]) {
            console.warn(`${path} does not possess key ${monsterKey}`);
            continue;
        }

        data[monsterKey].forEach((creatureData: any) => {
            const creature = new Creature(creatureData, loadFluff);
            const key = getKey(creature.name, creature.source);
            creatures[key] = creature;
        });
    }

    return creatures;
}

export function getCreatures(): JsonCreature[] {
    const creatures = loadCreaturesFromIndex(false);
    const fluffCreatures = loadCreaturesFromIndex(true);

    function recursivelyInherit(creature: Creature, creaturesMap: { [key: string]: Creature }) {
        let current = creature;
        const visited = new Set<string>();
        while (current.parentKey && !visited.has(current.parentKey)) {
            visited.add(current.parentKey);
            const parent = creaturesMap[current.parentKey];
            if (!parent) break;
            current.inheritFrom(parent);
            current = parent;
        }
    }

    (Object.values(fluffCreatures) as Creature[]).forEach((creature: Creature) => {
        if (!creature.parentKey) {
            return;
        }
        recursivelyInherit(creature, fluffCreatures);
    });

    let creatureList: JsonCreature[] = [];
    (Object.values(creatures) as Creature[]).forEach((creature: Creature) => {
        recursivelyInherit(creature, creatures);

        const key = getKey(creature.name, creature.source);
        const fluffCreature = fluffCreatures[key];
        if (fluffCreature) creature.mergeWithFluff(fluffCreature);

        creatureList.push({
            name: creature.name,
            source: creature.source,
            subtitle: creature.subtitle,
            summonedBySpell: creature.summonedBySpell,
            tokenUrl: creature.tokenUrl(),
            url: creature.url(),
            description: creature.description,
        });
    });

    console.log(creatureList.length + ' creatures parsed.');
    return creatureList;
}
