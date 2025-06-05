import { Description, parseDescriptions } from './parser';
import { getRulesUrl } from './urls';

interface VariantRule {
    name: string;
    source: string;
    page: number;
    srd52: boolean;
    basicRules2024: boolean;
    ruleType: string;
    entries: Array<string | object>;
}

interface ParsedRule {
    name: string;
    source: string;
    url: string;
    ruleType: string;
    description: Description[];
}

function parseRuleType(rule: VariantRule): string {
    const type = rule.ruleType;
    const RuleTypes = new Map([
        ['C', 'Core'],
        ['V', 'Variant'],
        ['O', 'Optional'],
        ['VO', 'Variant Optional'],
    ]);

    return RuleTypes.get(type) ?? 'Unknown';
}

export function getRules(data: any): ParsedRule[] {
    return (data.variantrule as VariantRule[]).map((rule) => {
        const url = getRulesUrl(rule.name, rule.source);
        return {
            name: rule.name,
            source: rule.source,
            url,
            ruleType: parseRuleType(rule),
            description: parseDescriptions('', rule.entries, url),
        };
    });
}
