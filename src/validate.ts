import { Checker } from 'ts-interface-checker';

export function validate<T>(entries: readonly any[], checker: Checker): T[] {
    for (const entry of entries) {
        if (!checker.strictTest(entry)) {
            console.error(`Invalid entry: ${JSON.stringify(entry)}`);
            checker.strictCheck(entry); // throw error
        }
    }

    return entries as T[];
}
