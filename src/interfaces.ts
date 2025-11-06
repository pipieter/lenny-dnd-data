/**  Base entry of a 5e.tools object. These values are expected in any used object. */
interface BaseObject {
    name: string;
    source: string;
    page?: number;
    srd?: boolean;
    srd52?: boolean;
    basicRules?: boolean;
    basicRules2024?: boolean;
    reprintedAs?: (string | UID)[];
    additionalSources?: AdditionalSource[];
    otherSources?: AdditionalSource[];
}

export interface UID {
    uid: string;
    tag: string;
}

export interface AdditionalSource {
    source: string;
    page?: number;
}

export interface HRef {
    type: 'internal';
    path: string;
    hash?: string;
}

//region Descriptions

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

export interface EntryEntries {
    type: 'entries';
    name?: string;
    page?: number;
    source?: string;
    entries: Entry[];
}

export interface EntryList {
    type: 'list';
    name?: string;
    style?: string;
    columns?: number;
    items: (string | ListItem)[];
}

export interface EntryTable {
    type: 'table';
    caption?: string;
    colLabels: string[];
    colStyles: string[];
    rows: ((string | number | Entry | TableCell)[] | TableRow)[];
    footnotes?: string[];
    isNameGenerator?: boolean;
    data?: TableData;
    srd52?: boolean;
    basicRules2024?: boolean;
}

export interface EntryInset {
    type: 'inset';
    name: string;
    page?: number;
    source?: string;
    entries: Entry[];
}

export interface EntryInsetReadaloud {
    type: 'insetReadaloud';
    page: number;
    entries: Entry[];
}

export interface EntryQuote {
    type: 'quote';
    by: string;
    from?: string;
    skipMarks?: boolean;
    entries: Entry[];
}

export interface EntryStatblock {
    type: 'statblock';
    name: string;
    source: string;
    page: number;
    tag: string;
}

export interface EntryInline {
    type: 'inline';
    entries: Entry[];
}

export interface EntryLink {
    type: 'link';
    href: HRef;
    text: string;
}

export interface EntryImage {
    type: 'image';
    href: HRef;
    title?: string;
    width?: number;
    height?: number;
    credit?: string;
    altText?: string;
}

export interface EntrySection {
    type: 'section';
    name: string;
    entries: Entry[];
}

export type Entry =
    | string
    | EntryEntries
    | EntryList
    | EntryTable
    | EntryInset
    | EntryInsetReadaloud
    | EntryQuote
    | EntryStatblock
    | EntryInline
    | EntryLink
    | EntryImage
    | EntrySection;

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

//region Raw data interfaces

export interface Action extends BaseObject {
    entries: Entry[];
    time?: Time[];
    fromVariant?: string;
    seeAlsoAction?: string[];
}

export interface VariantRule extends BaseObject {
    type?: string;
    ruleType?: 'C' | 'O' | 'V' | 'VO';
    entries: Entry[];
}

export interface Language extends BaseObject {
    typicalSpeakers?: string[];
    script?: string;
    type?: string;
    origin?: string;
    entries?: Entry[];
    hasFluffImages?: boolean;
    fonts?: string[];
    dialects?: string[];
}

export interface LanguageFluff extends BaseObject {
    images: EntryImage[];
}
