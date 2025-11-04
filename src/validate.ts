import { CheckerT } from 'ts-interface-checker';

export function validate<T>(entries: readonly any[], checker: CheckerT<T>): T[] {
    for (const entry of entries) {
        if (!checker.strictTest(entry)) {
            throw TypeError(`Entry did not match interface: '${entry}'!`);
        }
    }

    return entries as T[];
}
