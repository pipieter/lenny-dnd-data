import { getKey, readJsonFile } from './data';
import { Description, parseDescriptions } from './parser';

const BASEPATH = '5etools-src/data/class/';

interface PaginatedDescriptions {
    [level: number]: Description[];
}

class ClassFeature {
    name: string;
    source: string;
    level: number;

    classKey: string;
    subclassKey: string | null = null;
    descriptions: Description[] | null = null;

    constructor(data: any) {
        this.name = data['name'];
        this.source = data['source'];
        this.level = data['level'];

        this.classKey = getKey(data['className'], data['classSource']);
        if (data['subclassShortName'] && data['subclassSource']) {
            this.subclassKey = getKey(data['subclassShortName'], data['subclassSource']);
        }

        if (data['entries']) {
            this.descriptions = parseDescriptions('', data['entries'], '');
        }
    }
}

class CharacterClass {
    name: string;
    source: string;

    baseInfo: Description[] | null = null;
    subclassUnlockLevel: number = 0;

    levelResources: PaginatedDescriptions | null = null;
    levelFeatures: PaginatedDescriptions | null = null;
    subclassLevelFeatures: { [subclass: string]: PaginatedDescriptions } | null = null;

    constructor(data: any) {
        this.name = data['name'];
        this.source = data['source'];
    }
}

export function getClasses(): CharacterClass[] {
    const indexPath = BASEPATH + '/index.json';
    let result: CharacterClass[] = [];

    const indexData = readJsonFile(indexPath);
    for (const [className, classIndexFile] of Object.entries(indexData)) {
        const path = BASEPATH + classIndexFile;
        const data = readJsonFile(path);

        let features: { [key: string]: ClassFeature } = {};
        data['classFeature'].forEach((featureData: any) => {
            const feature = new ClassFeature(featureData);
            const key = getKey(feature.name, feature.source);
            features[key] = feature;
        });

        let subclassFeatures: { [key: string]: ClassFeature } = {};
        data['subclassFeature'].forEach((featureData: any) => {
            const feature = new ClassFeature(featureData);
            const key = getKey(feature.name, feature.source);
            subclassFeatures[key] = feature;
        });

        let classes: { [key: string]: CharacterClass } = {};
        data['class'].forEach((classData: any) => {
            const characterClass = new CharacterClass(classData);
            const key = getKey(characterClass.name, characterClass.source);
            classes[key] = characterClass;

            result.push(characterClass);
        });
    }

    return result;
}
