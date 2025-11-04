export interface DNDData {
    name: string;
    source: string;
    page: number;
    srd?: boolean;
    srd52?: boolean;
    basicRules?: boolean;
    basicRules2024?: boolean;
    reprintedAs?: string[];
    entries: (string | any)[];
    hasFluff?: boolean;
    hasFluffImages?: boolean;
}

export interface DNDDataWithToken extends DNDData {
    tokenCredit?: string;
    hasToken?: boolean;
}

export interface ParsedDNDData {
    name: string;
    source: string;
    subtitle?: string | null;
    url: string;
    description: Description[];
}

export interface ParsedDNDDataWithToken extends ParsedDNDData {
    tokenUrl: string | null;
}

export enum DescriptionType {
    text = 'text',
    table = 'table',
    hr = 'hr',
}

export interface Description {
    name: string;
    type: DescriptionType;
    value: string | Table;
}

export interface Range {
    type: 'range';
    min: number;
    max: number;
}

export interface Table {
    title: string;
    headers: string[] | null;
    rows: (string | Range)[][];
}
