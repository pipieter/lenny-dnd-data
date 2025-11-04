import { readJsonFile } from '../data';
import { Description, parseDescriptions } from '../parser';
import { getRulesUrl } from '../urls';
import { VariantRule } from '../interfaces';
import { VariantRuleValidator } from '../validate';

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

    if (!type) return 'Uncategorized';
    return RuleTypes.get(type) ?? 'Uncategorized';
}

function retrieveRules(): any[] {
    const sources = [
        '5etools-src/data/variantrules.json',
        '5etools-src/data/generated/gendata-variantrules.json', // Some rules are stored in an auto-generated file.
    ];
    return sources.flatMap((source) => readJsonFile(source).variantrule);
}

export function getRules(): ParsedRule[] {
    const rules = VariantRuleValidator.validate(retrieveRules());
    return rules.map((rule) => ({
        name: rule.name,
        source: rule.source,
        url: getRulesUrl(rule),
        ruleType: parseRuleType(rule),
        description: parseDescriptions('', rule.entries),
    }));
}
