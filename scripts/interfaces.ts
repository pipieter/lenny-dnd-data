import { main as generate, CLIOptions } from 'quicktype';

const BasePath = './5etools-src/data/';
const ExportPath = './interfaces/';

async function createInterfaceFile(jsons: string | string[], out: string): Promise<void> {
    if (typeof jsons === 'string') {
        jsons = [jsons];
    }

    const options: Partial<CLIOptions> = {};
    //options.lang = 'ts';
    options.out = `${ExportPath}${out}`;
    options.src = jsons.map((json) => `${BasePath}${json}`);

    await generate(options);
}

async function main() {
    await createInterfaceFile('actions.json', 'actions.ts');
    await createInterfaceFile('backgrounds.json', 'backgrounds.ts');
}

main();
