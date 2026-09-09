import { handleCopy } from '../5etools-conversion/copy';
import { Vehicle, VehicleUpgrade } from '../../5etools-collector/types/vehicle';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import {
    Description,
    DescriptionType,
    ReprintData,
    capitalize,
    parseDescriptions,
    parseReprint,
    parseSizes,
    parseVehicleUpgradeType,
} from '../parser';
import { getVehicleTokenUrl, getVehiclesUrl } from '../urls';
import { joinStringsWithAnd, joinStringsWithOr } from '../util';

export interface ParsedVehicle {
    name: string;
    source: string;
    subtitle: string;
    url: string;
    tokenUrl: string | null;
    creatureCapacity: string | null;
    cargoCapacity: string | null;
    travelPace: string | null;
    description: Description[];
    reprint: ReprintData | null;
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
                if (typeof v === 'boolean') continue;

                if (k === 'note') {
                    note = v;
                    continue;
                }

                if (typeof v === 'object' && v !== null) {
                    const val = (v as any).number;
                    const cond = (v as any).condition ? ` ${(v as any).condition}` : '';
                    speedParts.push(`${k} ${val} ft.${cond}`);
                } else {
                    speedParts.push(`${k} ${v} ft.`);
                }
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
    const result = parts.join('\n');
    return cleanDNDText(result);
}

function getVehicleDescription(vehicle: Vehicle): Description[] {
    const description: Description[] = [];
    if (vehicle.entries) description.push(...parseDescriptions('', vehicle.entries));

    if (vehicle.action) description.push(...parseDescriptions('Actions', vehicle.action));

    if (vehicle.control)
        description.push(...vehicle.control.flatMap((c) => parseDescriptions(`Control: ${c.name}`, c.entries)));

    if (vehicle.movement) {
        const movements = vehicle.movement.map((m) => {
            const speedText = m.speed.map((s) => `*${capitalize(s.mode)} speed:* ${s.entries.join('\n')}`).join('\n\n');

            return {
                name: `Movement: ${m.name}`,
                type: DescriptionType.text,
                value: speedText,
            } as Description;
        });

        description.push(...movements);
    }

    if (vehicle.weapon)
        description.push(...vehicle.weapon.flatMap((w) => parseDescriptions(`Weapon: ${w.name}`, w.entries)));

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
    if (!vehicle.vehicleType) throw `Undefined vehicle-type in ${vehicle.name} (${vehicle.source})`;
    // TODO adjust 5e-collector to have this typeMap.
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

function getVehicleUpgradeSubtitle(upgrade: VehicleUpgrade, data: Databank): string {
    const types: string[] = upgrade.upgradeType.map((upgradeType: string) => {
        return parseVehicleUpgradeType(upgradeType, upgrade.source, data);
    });

    return joinStringsWithAnd(types, false);
}

// MAIN COMMAND
export function getVehicles(data: Databank): ParsedVehicle[] {
    const vehicles = data.vehicle.map((v) => {
        v = handleCopy(v, data.vehicle);
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
            reprint: parseReprint(v),
        };
    });

    const vehicleUpgrades = data.vehicleUpgrade.map((v) => {
        return {
            name: v.name,
            source: v.source,
            subtitle: getVehicleUpgradeSubtitle(v, data),
            url: getVehiclesUrl(v.name, v.source),
            tokenUrl: null,
            creatureCapacity: null,
            cargoCapacity: null,
            travelPace: null,
            description: v.entries ? parseDescriptions('', v.entries) : [],
            reprint: parseReprint(v),
        };
    });

    return [...vehicles, ...vehicleUpgrades];
}
