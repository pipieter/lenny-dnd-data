export interface UID {
    uid: string;
    tag: string;
}

export interface AdditionalSource {
    source: string;
    page: number;
}

export interface HRef {
    type: 'internal';
    path: string;
    hash?: string;
}

export interface ListItem {
    type: 'item';
    name: string;
    entry?: string;
    entries?: string[];
}

export interface TableCell {
    type: 'cell';
    width: number;
    entry: string;
}

export interface TableRow {
    type: 'row';
    style: string;
    row: string[];
}

export interface GenTables {
    tableInclude: boolean;
}

export interface TableData {
    genTables: GenTables;
}

export interface DescriptionEntries {
    type: 'entries';
    name?: string;
    page?: number;
    source?: string;
    entries: Description[];
}

export interface DescriptionList {
    type: 'list';
    name?: string;
    style?: string;
    columns?: number;
    items: (string | ListItem)[];
}

export interface DescriptionTable {
    type: 'table';
    caption?: string;
    colLabels: string[];
    colStyles: string[];
    rows: ((string | number | Description | TableCell)[] | TableRow)[];
    footnotes?: string[];
    isNameGenerator?: boolean;
    data?: TableData;
    srd52?: boolean;
    basicRules2024?: boolean;
}

export interface DescriptionInset {
    type: 'inset';
    name: string;
    page?: number;
    source?: string;
    entries: Description[];
}

export interface DescriptionInsetReadaloud {
    type: 'insetReadaloud';
    page: number;
    entries: Description[];
}

export interface DescriptionQuote {
    type: 'quote';
    by: string;
    from?: string;
    skipMarks?: boolean;
    entries: Description[];
}

export interface DescriptionStatblock {
    type: 'statblock';
    name: string;
    source: string;
    page: number;
    tag: string;
}

export interface DescriptionInline {
    type: 'inline';
    entries: Description[];
}

export interface DescriptionLink {
    type: 'link';
    href: HRef;
    text: string;
}

export interface DescriptionImage {
    type: 'image';
    href: HRef;
    title?: string;
    width?: number;
    height?: number;
    credit?: string;
    altText?: string;
}

export interface DescriptionSection {
    type: 'section';
    name: string;
    entries: Description[];
}

export type Description =
    | string
    | DescriptionEntries
    | DescriptionList
    | DescriptionTable
    | DescriptionInset
    | DescriptionInsetReadaloud
    | DescriptionQuote
    | DescriptionStatblock
    | DescriptionInline
    | DescriptionLink
    | DescriptionImage
    | DescriptionSection;

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

export interface VariantRule {
    name: string;
    source: string;
    page?: number;
    additionalSources?: AdditionalSource[];
    type?: string;
    srd?: boolean;
    srd52?: boolean;
    basicRules2024?: boolean;
    ruleType?: 'C' | 'O' | 'V' | 'VO';
    entries: Description[];
    reprintedAs?: (string | UID)[];
}
