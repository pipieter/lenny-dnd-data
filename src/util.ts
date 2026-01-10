import { getKey } from './data';
import { title } from './parser';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import kleur = require('kleur');

export function entrySort(a: any, b: any): number {
    // Sort entries list by keys, primarily used to patch OS-discrepancies.
    const keyA = getKey(a.name, a.source);
    const keyB = getKey(b.name, b.source);
    return keyA.localeCompare(keyB, 'en', {
        sensitivity: 'base',
        numeric: true,
    });
}

export function getNumberSign(value: number, zeroReturnsPlus: boolean = false): string {
    if (value > 0) return '+';
    if (value < 0) return '-';
    return zeroReturnsPlus ? '+' : '';
}

function joinStringsWith(concatWord: string, values: string[], capitalize: boolean): string {
    if (capitalize) values = values.map(title);

    if (values.length === 0) {
        return '';
    }

    if (values.length === 1) {
        return values[0];
    }

    const commas = values.slice(0, values.length - 1);
    const last = values[values.length - 1];
    return commas.join(', ') + ` ${concatWord} ` + last;
}

export function joinStringsWithOr(values: string[], capitalize: boolean = true): string {
    return joinStringsWith('or', values, capitalize);
}

export function joinStringsWithAnd(values: string[], capitalize: boolean = true): string {
    return joinStringsWith('and', values, capitalize);
}

export class StopwatchLogger {
    private startTime: number;
    private previousTime: number;

    constructor() {
        this.startTime = Date.now();
        this.previousTime = Date.now();
    }

    log(label: string, color?: kleur.Color) {
        const elapsedSeconds = (Date.now() - this.previousTime) / 1000;
        this.previousTime = Date.now();

        if (!color) color = this.getColor(elapsedSeconds);
        const elapsedStr = elapsedSeconds.toFixed(2).padStart(5, ' ');
        console.log(color(`+ ${elapsedStr}s | ${label} `));
    }

    private getColor(elapsedSeconds: number): kleur.Color {
        if (elapsedSeconds >= 5) return kleur.bgRed;
        else if (elapsedSeconds >= 3) return kleur.red;
        else if (elapsedSeconds >= 1) return kleur.yellow;
        else return kleur.green;
    }

    stop() {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const elapsedStr = elapsedSeconds.toFixed(2).padStart(5, ' ');
        console.log(kleur.gray(`= ${elapsedStr}s | Total time elapsed`));
    }
}
