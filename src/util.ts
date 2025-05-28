var commandExistsSync = require('command-exists').sync;

export function getPythonInstallation() {
    const choices = ['python', 'python3', 'py'];
    for (const choice of choices) {
        if (commandExistsSync(choice)) {
            return choice;
        }
    }
    throw 'Could not find Python installation on system.';
}
