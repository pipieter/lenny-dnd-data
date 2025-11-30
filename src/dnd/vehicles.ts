import { capitalize, Description, DescriptionType, parseDescriptions, parseSizes } from '../parser';
import { getVehiclesUrl, getVehicleTokenUrl } from '../urls';
import { joinStringsWithAnd, joinStringsWithOr } from '../util';

interface Vehicle {
    name: string;
    source: string;
    page: number;
    srd: boolean;
    vehicleType: string;
    size?: string | string[];
    dimensions?: string[];
    terrain: string[];
    capCrew: number;
    capPassenger: number;
    capCargo?: number;
    cost?: number;
    pace?: number | object;
    speed?: number | object;
    ac?: number;
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    hp?: number | object;
    immune?: string[];
    conditionImmune?: string[];
    hull?: {
        ac: number;
        acFrom?: string[];
        hp: number;
        dt: number;
    };
    control?: {
        name: string;
        ac: number;
        hp: number;
        entries: string[];
    }[];
    movement: {
        name: string;
        ac: number;
        hp: number;
        hpNote: string;
        speed: {
            mode: string;
            entries: string[];
        }[];
    }[];
    weapon?: {
        name: string;
        crew?: number;
        ac?: number;
        hp?: number;
        count?: number;
        costs: object;
        entries: string[];
        action: {
            name: string;
            entries: string[];
        }[];
    }[];
    actionThresholds: object;
    action?: (string | any)[];
    trait: {
        name: string;
        entries: string[];
    }[];
    actionStation: {
        name: string;
        entries: string[];
    }[];
    reaction: {
        name: string;
        entries: string[];
    }[];
    entries: (string | any)[];
    tokenCredit?: string;
    hasToken: boolean;
    hasFluff?: boolean;
    hasFluffImages: boolean;
}

interface VehicleUpgrade {
    name: string;
    source: string;
    page: number;
    upgradeType: string[];
    entries: (string | any)[];
}

interface ParsedVehicle {
    name: string;
    source: string;
    subtitle: string;
    url: string;
    tokenUrl: string | null;
    creatureCapacity: string | null;
    cargoCapacity: string | null;
    travelPace: string | null;
    description: Description[];
}

function getVehiclePace(vehicle: Vehicle): string | null {
    const parts: string[] = [];

    if (vehicle.speed) {
        const speed = vehicle.speed;
        if (typeof speed === 'string' || typeof speed === 'number') {
            parts.push(`${speed} ft.`);
        } else if (typeof speed === 'object') {
            const speedParts: string[] = [];
            let note = null;
            for (const [k, v] of Object.entries(speed)) {
                if (k === 'note') {
                    note = v;
                    continue;
                }
                speedParts.push(`${k} ${v} ft.`);
            }

            let speedString = joinStringsWithOr(speedParts, false);
            if (note) speedString = `${speedString} ${note}`;
            parts.push(speedString);
        } else {
            throw `vehicle.speed has unsupported type: ${typeof speed} (${speed})`;
        }
    }

    if (vehicle.pace) {
        const pace = vehicle.pace;
        if (typeof pace === 'string' || typeof pace === 'number') {
            parts.push(`${pace} mph.`);
        } else if (typeof pace === 'object') {
            const paceParts: string[] = [];
            let note = null;
            for (const [k, v] of Object.entries(pace)) {
                if (k === 'note') {
                    note = v;
                    continue;
                }
                paceParts.push(`${k} ${v} mph.`);
            }

            let paceString = joinStringsWithOr(paceParts, false);
            if (note) paceString = `${paceString} ${note}`;
            parts.push(paceString);
        } else {
            throw `vehicle.speed has unsupported type: ${pace}`;
        }
    }

    if (parts.length === 0) return null;
    return parts.join('\n');
}

function getVehicleDescription(vehicle: Vehicle): Description[] {
    const description: Description[] = [];
    if (vehicle.entries) description.push(...parseDescriptions('', vehicle.entries));

    if (vehicle.action) description.push(...parseDescriptions('Actions', vehicle.action));

    if (vehicle.control)
        description.push(
            ...vehicle.control.flatMap((c) => parseDescriptions(`Control: ${c.name}`, c.entries))
        );

    if (vehicle.movement) {
        const movements = vehicle.movement.map((m) => {
            const speedText = m.speed
                .map((s) => `*${capitalize(s.mode)} speed:* ${s.entries.join('\n')}`)
                .join('\n\n');

            return {
                name: `Movement: ${m.name}`,
                type: DescriptionType.text,
                value: speedText,
            } as Description;
        });

        description.push(...movements);
    }

    if (vehicle.weapon)
        description.push(
            ...vehicle.weapon.flatMap((w) => parseDescriptions(`Weapon: ${w.name}`, w.entries))
        );

    return description;
}

function getVehicleCreatureCapacity(vehicle: Vehicle): string | null {
    const parts: string[] = [];

    if (vehicle.capCrew) parts.push(`${vehicle.capCrew} crew`);
    if (vehicle.capPassenger) {
        if (vehicle.capPassenger === 1) parts.push(`1 passenger`);
        else parts.push(`${vehicle.capPassenger} passengers`);
    }

    if (parts.length === 0) return null;
    return parts.join('\n');
}

function getVehicleDimensions(vehicle: Vehicle): string {
    if (!vehicle.dimensions || vehicle.dimensions.length === 0) return '';
    return `(${vehicle.dimensions.join(' by ')})`;
}

function getVehicleType(vehicle: Vehicle): string {
    const typeMap: Record<string, string> = {
        OBJECT: 'Object',
        SHIP: 'Ship',
        SPELLJAMMER: 'Spelljammer',
        INFWAR: 'Infernal War Machine',
        CREATURE: 'Creature',
        ELEMENTAL_AIRSHIP: 'Elemental Airship',
    };
    const type = typeMap[vehicle.vehicleType];
    if (type) return type;

    throw `Unsupported vehicle type in ${vehicle.name}: ${vehicle.vehicleType}`;
}

function getVehicleSubtitle(vehicle: Vehicle): string {
    const parts: string[] = [];
    if (vehicle.size) parts.push(parseSizes(vehicle.size));
    parts.push(getVehicleType(vehicle));
    if (vehicle.dimensions) parts.push(getVehicleDimensions(vehicle));

    return parts.join(' ');
}

function getVehicleUpgradeSubtitle(upgrade: VehicleUpgrade): string {
    const types: string[] = [];
    const typeMap: Record<string, string> = {
        'SHP:H': 'Ship Upgrade, Hull',
        'SHP:M': 'Ship Upgrade, Movement',
        'SHP:W': 'Ship Upgrade, Weapon',
        'SHP:F': 'Ship Upgrade, Figurehead',
        'SHP:O': 'Ship Upgrade, Miscellaneous',
        'IWM:W': 'Infernal War Machine Variant, Weapon',
        'IWM:A': 'Infernal War Machine Upgrade, Armor',
        'IWM:G': 'Infernal War Machine Upgrade, Gadget',
    };
    for (const upgradeType of upgrade.upgradeType) {
        const type = typeMap[upgradeType];
        if (!type)
            throw `Unsupported vehicle upgrade type in ${upgrade.name}: ${upgrade.upgradeType}`;
        types.push(type);
    }

    return joinStringsWithAnd(types, false);
}

// MAIN COMMAND
export function getVehicles(data: any): ParsedVehicle[] {
    const vehicles = (data.vehicle as Vehicle[]).map((v) => {
        return {
            name: v.name,
            source: v.source,
            subtitle: getVehicleSubtitle(v),
            url: getVehiclesUrl(v.name, v.source),
            tokenUrl: v.hasToken ? getVehicleTokenUrl(v.name, v.source) : null,
            creatureCapacity: getVehicleCreatureCapacity(v),
            cargoCapacity: v.capCargo ? `${v.capCargo} tons` : null,
            travelPace: getVehiclePace(v),
            description: getVehicleDescription(v),
        };
    });

    const vehicleUpgrades = (data.vehicleUpgrade as VehicleUpgrade[]).map((v) => {
        return {
            name: v.name,
            source: v.source,
            subtitle: getVehicleUpgradeSubtitle(v),
            url: getVehiclesUrl(v.name, v.source),
            tokenUrl: null,
            creatureCapacity: null,
            cargoCapacity: null,
            travelPace: null,
            description: v.entries ? parseDescriptions('', v.entries) : [],
        };
    });

    return [...vehicles, ...vehicleUpgrades];
}
