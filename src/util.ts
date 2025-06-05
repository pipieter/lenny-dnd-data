import kleur = require('kleur');
var commandExistsSync = require('command-exists').sync;

export const BulletPoint = '\u2022'; // U+2022 •

export function getNumberSign(value: number, zeroReturnsPlus: boolean = false): string {
    if (value > 0) return '+';
    if (value < 0) return '-';
    return zeroReturnsPlus ? '+' : '';
}

export function getPythonInstallation() {
    const choices = ['python', 'python3', 'py'];
    for (const choice of choices) {
        if (commandExistsSync(choice)) {
            return choice;
        }
    }
    throw 'Could not find Python installation on system.';
}

export class StopwatchLogger {
    private startTime: number;
    private previousTime: number;

    constructor() {
        this.startTime = Date.now();
        this.previousTime = Date.now();
    }

    log(label: string) {
        const elapsedSeconds = (Date.now() - this.previousTime) / 1000;
        this.previousTime = Date.now();

        const color = this.getColor(elapsedSeconds);
        const elapsedStr = elapsedSeconds.toFixed(2).padStart(5, ' ');
        console.log(color(`+ ${elapsedStr}s | ${label} `));
    }

    private getColor(elapsedSeconds: number): (text: string) => string {
        if (elapsedSeconds >= 15) return kleur.bgRed;
        else if (elapsedSeconds >= 10) return kleur.red;
        else if (elapsedSeconds >= 5) return kleur.yellow;
        else return kleur.green;
    }

    stop() {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const elapsedStr = elapsedSeconds.toFixed(2).padStart(5, ' ');
        console.log(kleur.gray(`= ${elapsedStr}s | Total time elapsed`));
    }
}
