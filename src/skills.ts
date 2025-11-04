import { ParsedAction } from './actions';
import { parseAbilityScore, parseDescriptions } from './parser';

interface Skill {
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

interface ParsedSkill extends ParsedAction {
    url: null; // Skills do not have 5e.tools pages
    time: null; // Not applicable to skills
    ability: string;
}

export function getSkills(data: any): ParsedSkill[] {
    return (data.skill as Skill[]).map((skill) => {
        return {
            name: skill.name,
            source: skill.source,
            url: null,
            time: null,
            ability: parseAbilityScore(skill.ability),
            description: skill.entries ? parseDescriptions('', skill.entries) : [],
        };
    });
}
