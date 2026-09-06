import { readFileSync } from 'fs';
import { capitalize } from './parser';

class CollectorVariables {
    private data: any;

    constructor(path: string) {
        this.data = JSON.parse(readFileSync(path).toString());
    }

    getOptionalFeatureTypeFullName(optFeatType: string): string {
        return this.data.optionalFeatureTypeFullNames[optFeatType] || optFeatType;
    }

    getObjectSizeName(size: string | undefined | null): string | null {
        // Single exception, see render.js:9078
        if (size === 'V') return 'Variable size';
        return this.getSizeName(size);
    }

    getSizeName(size: string | undefined | null): string | null {
        if (!size) return null;
        return this.data?.sizeNames[size] || size;
    }

    getDamageName(damage: string | undefined | null): string | null {
        if (!damage) return null;

        const name = this.data.damageNames[damage] || damage;
        return capitalize(name);
    }

    getFeatCategoryName(category: string): string {
        return this.data.featCategoryNames[category] || category;
    }

    getVehicleUpgradeType(upgrade: string): string {
        return this.data.vehicleUpgradeTypes[upgrade] || upgrade;
    }

    getSpellSchoolName(school: string | undefined | null): string | null {
        if (!school) return null;
        return this.data.spellSchoolNames[school] || school;
    }

    getSkillAbility(skill: string | undefined | null): string | null {
        if (!skill) return null;
        return this.data.skillAbilities[skill] || null;
    }

    getAbilityName(ability: string | undefined | null): string | null {
        if (!ability) return null;
        return this.data.abilityNames[ability] || ability;
    }

    getAlignmentName(alignment: string | undefined | null): string | null {
        if (!alignment) return null;
        return this.data.alignmentNames[alignment] || alignment;
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
        return this.data.specialSpeedTypes;
    }
}

export const Variables = new CollectorVariables('./5etools-collector/data/variables.json');
