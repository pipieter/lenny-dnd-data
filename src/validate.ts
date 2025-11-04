import { Checker, createCheckers } from 'ts-interface-checker';
import interfacesTI from './interfaces-ti';

import { Action, VariantRule } from './interfaces';

const checkers = createCheckers(interfacesTI);

class Validator<T> {
    private readonly checker: Checker;

    constructor(checker: Checker) {
        this.checker = checker;
    }

    public validate(entries: readonly any[]): T[] {
        for (const entry of entries) {
            if (!this.checker.strictTest(entry)) {
                console.error(`Invalid entry: ${JSON.stringify(entry)}`);
                console.error();
                this.checker.strictCheck(entry); // throw error
            }
        }
        return entries as T[];
    }
}

export const ActionValidator = new Validator<Action>(checkers.Action);
export const VariantRuleValidator = new Validator<VariantRule>(checkers.VariantRule);
