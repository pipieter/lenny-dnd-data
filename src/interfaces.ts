export interface UID {
    uid: string;
    tag: string;
}

export interface DescriptionEntries {
    type: 'entries';
    name?: string;
    entries: Description[];
}

export interface DescriptionList {
    type: 'list';
    items: string[];
}

export interface DescriptionTable {
    type: 'table';
    caption: string;
    colLabels: string[];
    colStyles: string[];
    rows: string[][];
}

export interface DescriptionInset {
    type: 'inset';
    name: string;
    entries: Description[];
}

export type Description =
    | string
    | DescriptionEntries
    | DescriptionList
    | DescriptionTable
    | DescriptionInset;

export interface Range {
    type: 'range';
    min: number;
    max: number;
}

export interface TimeUnit {
    unit: 'action' | 'bonus' | 'reaction' | 'minute' | 'round' | 'hour';
    number: number;
}

export type Time = string | TimeUnit;

export interface Action {
    name: string;
    source: string;
    page: number;
    srd?: boolean;
    srd52?: boolean;
    basicRules?: boolean;
    basicRules2024?: boolean;
    fromVariant?: string;
    time?: Time[];
    seeAlsoAction?: string[];
    entries: Description[];
    reprintedAs?: (string | UID)[];
}
