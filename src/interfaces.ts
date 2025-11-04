export interface DNDData {
    name: string;
    source: string;
    page: number;
    srd?: boolean;
    srd52?: boolean;
    basicRules?: boolean;
    entries: (string | any)[];
    hasFluff?: boolean;
    hasFluffImages?: boolean;
}

export interface DNDDataWithToken extends DNDData {
    tokenUrl: string | null;
    tokenCredit?: string;
    hasToken?: boolean;
}

export interface ParsedData {
    name: string;
    source: string;
    subtitle?: string;
    url: string;
    tokenUrl?: string;
    description: (string | object)[];
}