import { Databank } from '../data';
import { Description, parseDescriptions } from '../parser';
import { getRulesUrl } from '../urls';

export interface Rule {
    name: string;
    source: string;
    type?: string;
    ruleType?: 'C' | 'O' | 'V' | 'VO';
    entries: any[];
}

export interface ParsedRule {
    name: string;
    source: string;
    url: string | null;
    ruleType: string;
    description: Description[];
}

function parseRuleType(rule: any): string {
    const type = rule.ruleType;
    const RuleTypes = new Map([
        ['C', 'Core'],
        ['V', 'Variant'],
        ['O', 'Optional'],
        ['VO', 'Variant Optional'],
    ]);

    if (!type) return 'Uncategorized';
    return RuleTypes.get(type) ?? 'Uncategorized';
}

export function getRules(databank: Databank): ParsedRule[] {
    const rules: ParsedRule[] = databank.variantrule.map((rule) => ({
        name: rule.name,
        source: rule.source,
        url: getRulesUrl(rule.name, rule.source),
        ruleType: parseRuleType(rule),
        description: parseDescriptions('', rule.entries),
    }));

    // The descriptions of senses are very meta, thus we treat them as rules.
    const senses: ParsedRule[] = databank.sense.map((sense) => ({
        name: sense.name,
        source: sense.source,
        url: null, // There is no dedicated info page for senses.
        ruleType: 'Sense',
        description: parseDescriptions('', sense.entries),
    }));

    return [...rules, ...senses];
}
