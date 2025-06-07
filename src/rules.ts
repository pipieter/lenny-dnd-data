import { readJsonFile } from './data';
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

function getGendataVariantRules(): ParsedRule[] {
    // Some rules are stored in an auto-generated file.
    const gendata_path = '5etools-src/data/generated/gendata-variantrules.json';
    const data = readJsonFile(gendata_path);

    return (data.variantrule as VariantRule[]).map((rule) => {
        return {
            name: rule.name,
            source: rule.source,
            url: getRulesUrl(rule.name, rule.source),
            ruleType: parseRuleType(rule),
            description: parseDescriptions('', rule.entries),
        };
    });
}

function getVariantRules(data: any): ParsedRule[] {
    return (data.variantrule as VariantRule[]).map((rule) => {
        return {
            name: rule.name,
            source: rule.source,
            url: getRulesUrl(rule.name, rule.source),
            ruleType: parseRuleType(rule),
            description: parseDescriptions('', rule.entries),
        };
    });
}

export function getRules(data: any): ParsedRule[] {
    let rules = [...getVariantRules(data), ...getGendataVariantRules()];
    return rules.sort((a, b) => a.name.localeCompare(b.name));
}
