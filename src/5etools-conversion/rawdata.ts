import { readFileSync } from 'fs';
import { join } from 'path';
import * as vm from 'vm';
import { capitalize } from '../parser';

/**
 * Interface for getting hardcoded 5e-tools data from javascript files.
 */
class RawData {
    private parser: any; // parser.js Parser.

    constructor() {
        const parserPath = join(__dirname, '..', '..', '5etools-src', 'js', 'parser.js');
        const parserCode = readFileSync(parserPath, 'utf8');
        const sandbox = {
            globalThis: {} as any,
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            Parser: undefined as any,
        };

        sandbox.globalThis = sandbox;
        vm.runInNewContext(parserCode, sandbox, { filename: parserPath });
        this.parser = sandbox.Parser;
    }

    /**
     * Resolves the display name or abbreviation for a given source.
     * If the source could not be resolved, this returns the backend source instead.
     */
    getSourceDisplayName(sourceId: string): string {
        return this.parser?.SOURCE_JSON_TO_ABV?.[sourceId] || sourceId;
    }

    getObjectSizeName(size: string | undefined | null): string | null {
        // Single exception, see render.js:9078
        if (size === 'V') return 'Variable size';
        return this.getSizeName(size);
    }

    getSizeName(size: string | undefined | null): string | null {
        if (!size) return null;
        return this.parser?.SIZE_ABV_TO_FULL?.[size] || size;
    }

    getDamageName(damage: string | undefined | null): string | null {
        if (!damage) return null;

        const name = this.parser?.DMGTYPE_JSON_TO_FULL?.[damage] || damage;
        return capitalize(name);
    }

    getSpellSchoolName(school: string | undefined | null): string | null {
        if (!school) return null;
        return this.parser?.SP_SCHOOL_ABV_TO_FULL?.[school] || school;
    }

    getSkillAbility(skill: string | undefined | null): string | null {
        if (!skill) return null;
        return this.parser?.SKILL_TO_ATB_ABV?.[skill] || null;
    }

    getAbilityName(ability: string | undefined | null): string | null {
        if (!ability) return null;
        return this.parser?.ATB_ABV_TO_FULL?.[ability] || ability;
    }

    getAlignmentName(alignment: string | undefined | null): string | null {
        if (!alignment) return null;
        return this.parser?._ALIGNMENT_ABV_TO_FULL?.[alignment] || alignment;
    }

    getAdvantageName(advantage: string | undefined | null): string | null {
        if (!advantage) return null;

        const map = new Map([
            ['adv', 'Advantage'],
            ['dis', 'Disadvantage'],
        ]);

        return map.get(advantage) || null;
    }

    getSpecialSpeedTypes(): string[] {
        const nonSpecial = ['walk'];

        const modes: string[] = this.parser.SPEED_MODES;
        const special = modes.filter((mode) => !nonSpecial.includes(mode));
        return special;
    }
}

export const rawData = new RawData();
