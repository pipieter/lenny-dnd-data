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
            this.description = this.getDescriptions(data); // TODO Improve performance
        } else {
            this.subtitle = this.getSubtitle(data);
            this.summonedBySpell = data['summonedBySpell']
                ? parseCreatureSummonSpell(data['summonedBySpell'])
                : null;
            this.hasToken = data['hasToken'] || false;
        }

        const _copy = data['_copy'] || null;
        if (_copy) this.parentKey = getKey(_copy['name'], _copy['source']);
    }

    private getSubtitle(data: any): string | null {
        const sizeData = data['size'];
        const typeData = data['type'];

        const size = sizeData ? parseSizes(sizeData) : null;
        const type = typeData ? parseCreatureTypes(typeData) : null;

        if (!size && !type) return null;

        const text = size + ' ' + type;
        return text.trim();
    }

    private getDescriptions(data: any): Description[] | null {
        const entries = data['entries'] || null;
        if (!entries) return null;

        const filteredEntries = this.filterEntries(entries);
        const parsedDescriptions = parseDescriptions('', filteredEntries, this.url());
        let filteredDescriptions: Description[] = [];
        let totalTextLength = 0;
        parsedDescriptions.forEach((desc) => {
            const textLower = desc.text.toLowerCase();
            if (textLower.startsWith('\`\`\`')) return; // Ignore tables
            if (textLower.toLowerCase().includes(' table ')) return; // Ignore tables
            if (textLower.toLowerCase().includes('stat block')) return; // Ignore stat-related entries
            if (textLower.length > 1024 || totalTextLength > 1024) return; // Limit length

            filteredDescriptions.push(desc);
            totalTextLength = totalTextLength + textLower.length;
        });

        return filteredDescriptions;
    }

    private filterEntries(entries: any[]): any[] {
        // Creatures generally have way too many entries, impacting performance heavily. We pre-cut entries we may not need.
        let filteredEntries: any[] = [];

        entries.forEach((entry: any) => {
            if (entry['type'] !== 'entries') return; // Only 'entries' hold information we'd want to use.
            if (entry['name']) return; // Entries with names generally refer to races and books, not of use to us.

            filteredEntries.push(entry);
            if (filteredEntries.length >= 2) return; // Generally the first two entries are the actual descriptions of a creature.
        });

        return filteredEntries;
    }

    mergeWithFluff(fluffCreature: Creature) {
        this.description = fluffCreature.description;
    }

    inheritFrom(parent: Creature) {
        if (!this.parentKey) return;

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
        if (!this.hasToken) return null;

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
        if (!creature.parentKey) return;
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

    return creatureList;
}
