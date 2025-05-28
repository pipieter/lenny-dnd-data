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
                this.description = parseDescriptions('', entries, this.url());
            }
        } else {
            const size = parseSizes(data['size'] || '');
            const type = parseCreatureTypes(data['type'] || '');
            // TODO ALIGNMENT SUPPORT
            this.subtitle = size + ' ' + type;
            this.summonedBySpell = parseCreatureSummonSpell(data['summonedBySpell'] || '');
            this.hasToken = data['hasToken'] || false;
        }

        const _copy = data['_copy'] || null;
        if (_copy) {
            this.parentKey = getKey(_copy['name'], _copy['source']);
        }
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
        console.log('###### ' + path + ' ######');
        const data = readJsonFile(path);

        if (!data[monsterKey]) {
            console.warn(`${path} does not possess key ${monsterKey}`);
            continue;
        }

        data[monsterKey].forEach((creatureData: any) => {
            const creature = new Creature(creatureData, loadFluff);
            const key = getKey(creature.name, creature.source);
            console.log('- ' + key);
            creatures[key] = creature;
        });
    }

    return creatures;
}

export function getCreatures(): Creature[] {
    const creatures = loadCreaturesFromIndex(false);
    const fluffCreatures = loadCreaturesFromIndex(true);

    (Object.values(fluffCreatures) as Creature[]).forEach((creature: Creature) => {
        console.log('- fluff inherit - ' + getKey(creature.name, creature.source));
        if (!creature.parentKey) {
            return;
        }

        const parent = creatures[creature.parentKey ?? ''];
        if (parent) creature.inheritFrom(parent);
    });

    let creatureList: Creature[] = [];
    (Object.values(creatures) as Creature[]).forEach((creature: Creature) => {
        console.log('- base inherit - ' + getKey(creature.name, creature.source));
        if (!creature.parentKey) {
            return;
        }

        const parent = creatures[creature.parentKey ?? ''];
        if (parent) creature.inheritFrom(parent);

        const key = getKey(creature.name, creature.source);
        const fluffCreature = fluffCreatures[key];
        if (fluffCreature) creature.mergeWithFluff(fluffCreature);

        creatureList.push(creature);
    });

    return creatureList;
}
