import { Rule } from '../../5etools-collector/types/rule';
import { Databank } from '../data';
import { Description, ReprintData, parseDescriptions, parseReprint } from '../parser';
import { getRulesUrl } from '../urls';
import { Variables } from '../variables';

export interface ParsedRule {
    name: string;
    source: string;
    url: string | null;
    ruleType: string;
    description: Description[];
    reprint: ReprintData | null;
}

function parseRuleType(rule: Rule): string {
    return Variables.getRuleType(rule.ruleType) ?? 'Uncategorized';
}

export function getRules(databank: Databank): ParsedRule[] {
    const rules: ParsedRule[] = databank.variantrule.map((rule) => ({
        name: rule.name,
        source: rule.source,
        url: getRulesUrl(rule.name, rule.source),
        ruleType: parseRuleType(rule),
        description: parseDescriptions('', rule.entries),
        reprint: parseReprint(rule),
    }));

    // The descriptions of senses are very meta, thus we treat them as rules.
    const senses: ParsedRule[] = databank.sense.map((sense) => ({
        name: sense.name,
        source: sense.source,
        url: null, // There is no dedicated info page for senses.
        ruleType: 'Sense',
        description: parseDescriptions('', sense.entries),
        reprint: parseReprint(sense),
    }));

    return [...rules, ...senses];
}
