import { Description, parseDescriptions } from './parser';
import { getVehiclesUrl, getVehicleTokenUrl } from './urls';

interface Vehicle {
    name: string;
    source: string;
    page: number;
    srd: boolean;
    vehicleType: string;
    size: string;
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
    url: string;
    tokenUrl: string | null;
    description: Description[];
}

export function getVehicles(data: any): ParsedVehicle[] {
    return (data.vehicle as Vehicle[]).map((v) => {
        const url = getVehiclesUrl(v.name, v.source)
        const tokenUrl = v.hasToken ? getVehicleTokenUrl(v.name, v.source) : null;
        const description = v.entries ? parseDescriptions('', v.entries) : [];

        return {
            name: v.name,
            source: v.source,
            url: url,
            tokenUrl: tokenUrl,
            description: description
        }
    });
}