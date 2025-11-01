import { Description, parseDescriptions, parseSizes } from './parser';
import { getVehiclesUrl, getVehicleTokenUrl } from './urls';

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
    speed?: {
        walk: number;
        swim: number;
        note: string;
    };
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
    };
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
    action: (string | any)[];
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

// CAPACITY
function getVehicleCreatureCapacity(vehicle: Vehicle): string | null {
    const parts: string[] = [];

    if (vehicle.capCrew) parts.push(`${vehicle.capCrew} crew`);
    if (vehicle.capPassenger) parts.push(`${vehicle.capPassenger} passengers`);

    if (parts.length === 0) return null;
    return parts.join(", ")
}

// SUBTITLE PARSING
function getVehicleDimensions(vehicle: Vehicle): string {
    if (!vehicle.dimensions || vehicle.dimensions.length === 0) return "";
    return `(${vehicle.dimensions.join(" by ")})`;
}

function getVehicleType(vehicle: Vehicle): string {
    const typeMap: Record<string, string> = {
        OBJECT: 'Object',
        SHIP: 'Ship',
        SPELLJAMMER: 'Spelljammer',
        INFWAR: 'Infernal War Machine',
        CREATURE: 'Creature',
    };
    const type = typeMap[vehicle.vehicleType];
    if (type) return type;

    throw `Unsupported vehicle type: ${vehicle.vehicleType}`;
}

function getVehicleSubtitle(vehicle: Vehicle): string {
    const parts: string[] = [];
    if (vehicle.size) parts.push(parseSizes(vehicle.size));
    parts.push(getVehicleType(vehicle));
    if (vehicle.dimensions) parts.push(getVehicleDimensions(vehicle));

    return parts.join(" ");
}

// MAIN COMMAND
export function getVehicles(data: any): ParsedVehicle[] {
    return (data.vehicle as Vehicle[]).map((v) => {
        const subtitle = getVehicleSubtitle(v);
        const url = getVehiclesUrl(v.name, v.source);
        const tokenUrl = v.hasToken ? getVehicleTokenUrl(v.name, v.source) : null;
        const creatureCapacity = getVehicleCreatureCapacity(v);
        const cargoCapacity = v.capCargo ? `${v.capCargo} tons` : null;
        const description = v.entries ? parseDescriptions('', v.entries) : [];

        return {
            name: v.name,
            source: v.source,
            subtitle,
            url,
            tokenUrl,
            creatureCapacity,
            cargoCapacity,
            travelPace: null, // TODO Parse pace & speed.
            description,
        };
    });
}
