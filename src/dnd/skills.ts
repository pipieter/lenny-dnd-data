import { Databank } from '../data';
import { Description, parseAbilityScore, parseDescriptions } from '../parser';

export interface Skill {
    name: string;
    source: string;
    page: number;
    srd52?: boolean;
    srd?: boolean;
    basicRules?: boolean;
    reprintedAs?: string[];
    ability: string;
    entries: (string | any)[];
}

export interface ParsedSkill {
    name: string;
    source: string;
    ability: string;
    description: Description[];
}

export function getSkills(data: Databank): ParsedSkill[] {
    return data.skill.map((skill) => {
        return {
            name: skill.name,
            source: skill.source,
            ability: parseAbilityScore(skill.ability),
            description: skill.entries ? parseDescriptions('', skill.entries) : [],
        };
    });
}
