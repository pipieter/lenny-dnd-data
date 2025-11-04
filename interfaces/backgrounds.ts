// To parse this data:
//
//   import { Convert, Backgrounds } from "./file";
//
//   const backgrounds = Convert.toBackgrounds(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Backgrounds {
    _meta:      Meta;
    background: Background[];
}

export interface Meta {
    internalCopies: string[];
}

export interface Background {
    name:                            string;
    source:                          string;
    page:                            number;
    srd?:                            boolean;
    basicRules?:                     boolean;
    reprintedAs?:                    string[];
    skillProficiencies?:             SkillProficiency[];
    languageProficiencies?:          LanguageProficiency[];
    startingEquipment?:              StartingEquipment[];
    entries?:                        Array<FluffyEntry | string>;
    hasFluff?:                       boolean;
    srd52?:                          boolean;
    basicRules2024?:                 boolean;
    edition?:                        Edition;
    ability?:                        Ability[];
    feats?:                          { [key: string]: boolean }[];
    toolProficiencies?:              ToolProficiency[];
    hasFluffImages?:                 boolean;
    fromFeature?:                    FromFeature;
    _copy?:                          Copy;
    additionalSpells?:               AdditionalSpell[];
    additionalSources?:              Source[];
    skillToolLanguageProficiencies?: SkillToolLanguageProficiency[];
    prerequisite?:                   Prerequisite[];
    otherSources?:                   Source[];
    weaponProficiencies?:            WeaponProficiency[];
}

export interface Copy {
    name:   string;
    source: CopySource;
    _mod?:  Mod;
}

export interface Mod {
    entries: EntriesEntry[] | EntriesClass;
}

export interface EntriesEntry {
    mode:     Mode;
    index?:   number;
    items:    ItemsClass;
    replace?: ReplaceClass | string;
}

export interface ItemsClass {
    type:     ItemsType;
    name?:    string;
    page?:    number;
    entries?: string[];
    style?:   Style;
    items?:   PurpleItem[];
    data?:    ItemsData;
}

export interface ItemsData {
    isFeature: boolean;
}

export interface PurpleItem {
    type:  PurpleType;
    name:  Name;
    entry: string;
}

export enum Name {
    AbilityScores = "Ability Scores:",
    Athar = "Athar",
    BleakCabal = "Bleak Cabal",
    Doomguard = "Doomguard",
    Equipment = "Equipment:",
    Fated = "Fated",
    Feat = "Feat:",
    FraternityOfOrder = "Fraternity of Order",
    HandsOfHavoc = "Hands of Havoc",
    Harmonium = "Harmonium",
    HeraldsOfDust = "Heralds of Dust",
    Languages = "Languages:",
    LanguagesAndToolProficiencies = "Languages and Tool Proficiencies:",
    Mercykillers = "Mercykillers",
    MindSEye = "Mind's Eye",
    SkillProficiencies = "Skill Proficiencies:",
    SocietyOfSensation = "Society of Sensation",
    ToolProficiencies = "Tool Proficiencies:",
    ToolProficiency = "Tool Proficiency:",
    TranscendentOrder = "Transcendent Order",
    WeaponProficiencies = "Weapon Proficiencies:",
}

export enum PurpleType {
    Item = "item",
}

export enum Style {
    ListHangNotitle = "list-hang-notitle",
}

export enum ItemsType {
    Entries = "entries",
    Inset = "inset",
    List = "list",
    Section = "section",
    Table = "table",
}

export enum Mode {
    InsertArr = "insertArr",
    ReplaceArr = "replaceArr",
}

export interface ReplaceClass {
    index: number;
}

export interface EntriesClass {
    mode:     Mode;
    index?:   number;
    items:    FluffyItem[] | ItemsClass;
    replace?: ReplaceClass | string;
}

export interface FluffyItem {
    name:    string;
    type:    ItemsType;
    entries: Array<PurpleEntry | string>;
    data?:   ItemsData;
}

export interface PurpleEntry {
    type:       ItemsType;
    caption?:   string;
    colLabels?: string[];
    colStyles?: ColStyle[];
    rows?:      Array<string[]>;
    name?:      string;
    entries?:   string[];
}

export enum ColStyle {
    Col10 = "col-10",
    Col11 = "col-11",
    Col1TextCenter = "col-1 text-center",
    Col2TextCenter = "col-2 text-center",
    Col4 = "col-4",
    Col5 = "col-5",
    Col6 = "col-6",
    Col6TextCenter = "col-6 text-center",
    Col7 = "col-7",
    TextCenterCol2 = "text-center col-2",
}

export enum CopySource {
    PSA = "PSA",
    Phb = "PHB",
    Tdcsr = "TDCSR",
}

export interface Ability {
    choose: AbilityChoose;
}

export interface AbilityChoose {
    weighted: Weighted;
}

export interface Weighted {
    from:    From[];
    weights: number[];
}

export enum From {
    Cha = "cha",
    Con = "con",
    Dex = "dex",
    Int = "int",
    Str = "str",
    Wis = "wis",
}

export interface Source {
    source: AdditionalSourceSource;
    page:   number;
}

export enum AdditionalSourceSource {
    CoS = "CoS",
    Phb = "PHB",
}

export interface AdditionalSpell {
    expanded: Expanded;
}

export interface Expanded {
    s0?: string[];
    s1:  string[];
    s2:  string[];
    s3:  string[];
    s4:  string[];
    s5:  string[];
}

export enum Edition {
    One = "one",
}

export interface FluffyEntry {
    type:       ItemsType;
    style?:     Style;
    items?:     EntryItem[];
    name?:      string;
    entries?:   Array<TentacledEntry | string>;
    data?:      EntryData;
    page?:      number;
    id?:        string;
    caption?:   string;
    colLabels?: string[];
    colStyles?: string[];
    rows?:      Array<string[]>;
}

export interface EntryData {
    isFeature:           boolean;
    isAlternateFeature?: boolean;
}

export interface TentacledEntry {
    type:       ItemsType;
    colLabels?: string[];
    colStyles?: ColStyle[];
    rows?:      Array<Array<number | string>>;
    caption?:   string;
    name?:      string;
    page?:      number;
    entries?:   Array<StickyEntry | string>;
    style?:     Style;
    items?:     EntryItem[];
}

export interface StickyEntry {
    type:      ItemsType;
    caption:   string;
    colLabels: ColLabel[];
    colStyles: ColStyle[];
    rows:      Array<string[]>;
}

export enum ColLabel {
    D6 = "d6",
    PersonalityTrait = "Personality Trait",
    Trinket = "Trinket",
}

export interface EntryItem {
    type:     PurpleType;
    name:     Name;
    entries?: string[];
    entry?:   string;
}

export interface FromFeature {
    feats:             boolean;
    additionalSpells?: boolean;
}

export interface LanguageProficiency {
    anyStandard?:     number;
    primordial?:      boolean;
    choose?:          LanguageProficiencyChoose;
    dwarvish?:        boolean;
    "thieves' cant"?: boolean;
    draconic?:        boolean;
    undercommon?:     boolean;
    giant?:           boolean;
    any?:             number;
    other?:           boolean;
    elvish?:          boolean;
}

export interface LanguageProficiencyChoose {
    from:   string[];
    count?: number;
}

export interface Prerequisite {
    campaign: string[];
}

export interface SkillProficiency {
    insight?:           boolean;
    religion?:          boolean;
    history?:           boolean;
    survival?:          boolean;
    investigation?:     boolean;
    persuasion?:        boolean;
    nature?:            boolean;
    choose?:            LanguageProficiencyChoose;
    acrobatics?:        boolean;
    athletics?:         boolean;
    intimidation?:      boolean;
    deception?:         boolean;
    "animal handling"?: boolean;
    perception?:        boolean;
    performance?:       boolean;
    "sleight of hand"?: boolean;
    stealth?:           boolean;
    any?:               number;
    medicine?:          boolean;
    arcana?:            boolean;
}

export interface SkillToolLanguageProficiency {
    anyLanguage?: number;
    anyTool?:     number;
}

export interface StartingEquipment {
    _?: Array<Class | string>;
    a?: Array<AClass | string>;
    b?: Array<BClass | string>;
    A?: Array<AClass | string>;
    B?: B[];
    c?: C[];
    d?: C[];
}

export interface AClass {
    item?:          string;
    displayName?:   string;
    quantity?:      number;
    value?:         number;
    equipmentType?: EquipmentType;
    special?:       string;
}

export enum EquipmentType {
    InstrumentMusical = "instrumentMusical",
    SetGaming = "setGaming",
    ToolArtisan = "toolArtisan",
}

export interface B {
    value: number;
}

export interface Class {
    item?:          string;
    displayName?:   string;
    special?:       string;
    quantity?:      number;
    containsValue?: number;
    equipmentType?: EquipmentType;
    worthValue?:    number;
    value?:         number;
}

export interface BClass {
    special?:       string;
    equipmentType?: EquipmentType;
}

export interface C {
    special: string;
}

export interface ToolProficiency {
    "calligrapher's supplies"?: boolean;
    choose?:                    LanguageProficiencyChoose;
    anyArtisansTool?:           number;
    "herbalism kit"?:           boolean;
    "vehicles (land)"?:         boolean;
    "disguise kit"?:            boolean;
    anyGamingSet?:              number;
    "forgery kit"?:             boolean;
    "weaver's tools"?:          boolean;
    "thieves' tools"?:          boolean;
    "leatherworker's tools"?:   boolean;
    "vehicles (water)"?:        boolean;
    anyMusicalInstrument?:      number;
    "carpenter's tools"?:       boolean;
    "smith's tools"?:           boolean;
    "glassblower's tools"?:     boolean;
    "poisoner's kit"?:          boolean;
    "cartographer's tools"?:    boolean;
    "alchemist's supplies"?:    boolean;
    "tinker's tools"?:          boolean;
    "brewer's supplies"?:       boolean;
    "cook's utensils"?:         boolean;
    "vehicles (air)"?:          boolean;
    "navigator's tools"?:       boolean;
    "woodcarver's tools"?:      boolean;
    "painter's supplies"?:      boolean;
    "mason's tools"?:           boolean;
    "jeweler's tools"?:         boolean;
    "vehicles (space)"?:        boolean;
}

export interface WeaponProficiency {
    firearms: boolean;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toBackgrounds(json: string): Backgrounds {
        return cast(JSON.parse(json), r("Backgrounds"));
    }

    public static backgroundsToJson(value: Backgrounds): string {
        return JSON.stringify(uncast(value, r("Backgrounds")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Backgrounds": o([
        { json: "_meta", js: "_meta", typ: r("Meta") },
        { json: "background", js: "background", typ: a(r("Background")) },
    ], false),
    "Meta": o([
        { json: "internalCopies", js: "internalCopies", typ: a("") },
    ], false),
    "Background": o([
        { json: "name", js: "name", typ: "" },
        { json: "source", js: "source", typ: "" },
        { json: "page", js: "page", typ: 0 },
        { json: "srd", js: "srd", typ: u(undefined, true) },
        { json: "basicRules", js: "basicRules", typ: u(undefined, true) },
        { json: "reprintedAs", js: "reprintedAs", typ: u(undefined, a("")) },
        { json: "skillProficiencies", js: "skillProficiencies", typ: u(undefined, a(r("SkillProficiency"))) },
        { json: "languageProficiencies", js: "languageProficiencies", typ: u(undefined, a(r("LanguageProficiency"))) },
        { json: "startingEquipment", js: "startingEquipment", typ: u(undefined, a(r("StartingEquipment"))) },
        { json: "entries", js: "entries", typ: u(undefined, a(u(r("FluffyEntry"), ""))) },
        { json: "hasFluff", js: "hasFluff", typ: u(undefined, true) },
        { json: "srd52", js: "srd52", typ: u(undefined, true) },
        { json: "basicRules2024", js: "basicRules2024", typ: u(undefined, true) },
        { json: "edition", js: "edition", typ: u(undefined, r("Edition")) },
        { json: "ability", js: "ability", typ: u(undefined, a(r("Ability"))) },
        { json: "feats", js: "feats", typ: u(undefined, a(m(true))) },
        { json: "toolProficiencies", js: "toolProficiencies", typ: u(undefined, a(r("ToolProficiency"))) },
        { json: "hasFluffImages", js: "hasFluffImages", typ: u(undefined, true) },
        { json: "fromFeature", js: "fromFeature", typ: u(undefined, r("FromFeature")) },
        { json: "_copy", js: "_copy", typ: u(undefined, r("Copy")) },
        { json: "additionalSpells", js: "additionalSpells", typ: u(undefined, a(r("AdditionalSpell"))) },
        { json: "additionalSources", js: "additionalSources", typ: u(undefined, a(r("Source"))) },
        { json: "skillToolLanguageProficiencies", js: "skillToolLanguageProficiencies", typ: u(undefined, a(r("SkillToolLanguageProficiency"))) },
        { json: "prerequisite", js: "prerequisite", typ: u(undefined, a(r("Prerequisite"))) },
        { json: "otherSources", js: "otherSources", typ: u(undefined, a(r("Source"))) },
        { json: "weaponProficiencies", js: "weaponProficiencies", typ: u(undefined, a(r("WeaponProficiency"))) },
    ], false),
    "Copy": o([
        { json: "name", js: "name", typ: "" },
        { json: "source", js: "source", typ: r("CopySource") },
        { json: "_mod", js: "_mod", typ: u(undefined, r("Mod")) },
    ], false),
    "Mod": o([
        { json: "entries", js: "entries", typ: u(a(r("EntriesEntry")), r("EntriesClass")) },
    ], false),
    "EntriesEntry": o([
        { json: "mode", js: "mode", typ: r("Mode") },
        { json: "index", js: "index", typ: u(undefined, 0) },
        { json: "items", js: "items", typ: r("ItemsClass") },
        { json: "replace", js: "replace", typ: u(undefined, u(r("ReplaceClass"), "")) },
    ], false),
    "ItemsClass": o([
        { json: "type", js: "type", typ: r("ItemsType") },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "page", js: "page", typ: u(undefined, 0) },
        { json: "entries", js: "entries", typ: u(undefined, a("")) },
        { json: "style", js: "style", typ: u(undefined, r("Style")) },
        { json: "items", js: "items", typ: u(undefined, a(r("PurpleItem"))) },
        { json: "data", js: "data", typ: u(undefined, r("ItemsData")) },
    ], false),
    "ItemsData": o([
        { json: "isFeature", js: "isFeature", typ: true },
    ], false),
    "PurpleItem": o([
        { json: "type", js: "type", typ: r("PurpleType") },
        { json: "name", js: "name", typ: r("Name") },
        { json: "entry", js: "entry", typ: "" },
    ], false),
    "ReplaceClass": o([
        { json: "index", js: "index", typ: 0 },
    ], false),
    "EntriesClass": o([
        { json: "mode", js: "mode", typ: r("Mode") },
        { json: "index", js: "index", typ: u(undefined, 0) },
        { json: "items", js: "items", typ: u(a(r("FluffyItem")), r("ItemsClass")) },
        { json: "replace", js: "replace", typ: u(undefined, u(r("ReplaceClass"), "")) },
    ], false),
    "FluffyItem": o([
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: r("ItemsType") },
        { json: "entries", js: "entries", typ: a(u(r("PurpleEntry"), "")) },
        { json: "data", js: "data", typ: u(undefined, r("ItemsData")) },
    ], false),
    "PurpleEntry": o([
        { json: "type", js: "type", typ: r("ItemsType") },
        { json: "caption", js: "caption", typ: u(undefined, "") },
        { json: "colLabels", js: "colLabels", typ: u(undefined, a("")) },
        { json: "colStyles", js: "colStyles", typ: u(undefined, a(r("ColStyle"))) },
        { json: "rows", js: "rows", typ: u(undefined, a(a(""))) },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "entries", js: "entries", typ: u(undefined, a("")) },
    ], false),
    "Ability": o([
        { json: "choose", js: "choose", typ: r("AbilityChoose") },
    ], false),
    "AbilityChoose": o([
        { json: "weighted", js: "weighted", typ: r("Weighted") },
    ], false),
    "Weighted": o([
        { json: "from", js: "from", typ: a(r("From")) },
        { json: "weights", js: "weights", typ: a(0) },
    ], false),
    "Source": o([
        { json: "source", js: "source", typ: r("AdditionalSourceSource") },
        { json: "page", js: "page", typ: 0 },
    ], false),
    "AdditionalSpell": o([
        { json: "expanded", js: "expanded", typ: r("Expanded") },
    ], false),
    "Expanded": o([
        { json: "s0", js: "s0", typ: u(undefined, a("")) },
        { json: "s1", js: "s1", typ: a("") },
        { json: "s2", js: "s2", typ: a("") },
        { json: "s3", js: "s3", typ: a("") },
        { json: "s4", js: "s4", typ: a("") },
        { json: "s5", js: "s5", typ: a("") },
    ], false),
    "FluffyEntry": o([
        { json: "type", js: "type", typ: r("ItemsType") },
        { json: "style", js: "style", typ: u(undefined, r("Style")) },
        { json: "items", js: "items", typ: u(undefined, a(r("EntryItem"))) },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "entries", js: "entries", typ: u(undefined, a(u(r("TentacledEntry"), ""))) },
        { json: "data", js: "data", typ: u(undefined, r("EntryData")) },
        { json: "page", js: "page", typ: u(undefined, 0) },
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "caption", js: "caption", typ: u(undefined, "") },
        { json: "colLabels", js: "colLabels", typ: u(undefined, a("")) },
        { json: "colStyles", js: "colStyles", typ: u(undefined, a("")) },
        { json: "rows", js: "rows", typ: u(undefined, a(a(""))) },
    ], false),
    "EntryData": o([
        { json: "isFeature", js: "isFeature", typ: true },
        { json: "isAlternateFeature", js: "isAlternateFeature", typ: u(undefined, true) },
    ], false),
    "TentacledEntry": o([
        { json: "type", js: "type", typ: r("ItemsType") },
        { json: "colLabels", js: "colLabels", typ: u(undefined, a("")) },
        { json: "colStyles", js: "colStyles", typ: u(undefined, a(r("ColStyle"))) },
        { json: "rows", js: "rows", typ: u(undefined, a(a(u(0, "")))) },
        { json: "caption", js: "caption", typ: u(undefined, "") },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "page", js: "page", typ: u(undefined, 0) },
        { json: "entries", js: "entries", typ: u(undefined, a(u(r("StickyEntry"), ""))) },
        { json: "style", js: "style", typ: u(undefined, r("Style")) },
        { json: "items", js: "items", typ: u(undefined, a(r("EntryItem"))) },
    ], false),
    "StickyEntry": o([
        { json: "type", js: "type", typ: r("ItemsType") },
        { json: "caption", js: "caption", typ: "" },
        { json: "colLabels", js: "colLabels", typ: a(r("ColLabel")) },
        { json: "colStyles", js: "colStyles", typ: a(r("ColStyle")) },
        { json: "rows", js: "rows", typ: a(a("")) },
    ], false),
    "EntryItem": o([
        { json: "type", js: "type", typ: r("PurpleType") },
        { json: "name", js: "name", typ: r("Name") },
        { json: "entries", js: "entries", typ: u(undefined, a("")) },
        { json: "entry", js: "entry", typ: u(undefined, "") },
    ], false),
    "FromFeature": o([
        { json: "feats", js: "feats", typ: true },
        { json: "additionalSpells", js: "additionalSpells", typ: u(undefined, true) },
    ], false),
    "LanguageProficiency": o([
        { json: "anyStandard", js: "anyStandard", typ: u(undefined, 0) },
        { json: "primordial", js: "primordial", typ: u(undefined, true) },
        { json: "choose", js: "choose", typ: u(undefined, r("LanguageProficiencyChoose")) },
        { json: "dwarvish", js: "dwarvish", typ: u(undefined, true) },
        { json: "thieves' cant", js: "thieves' cant", typ: u(undefined, true) },
        { json: "draconic", js: "draconic", typ: u(undefined, true) },
        { json: "undercommon", js: "undercommon", typ: u(undefined, true) },
        { json: "giant", js: "giant", typ: u(undefined, true) },
        { json: "any", js: "any", typ: u(undefined, 0) },
        { json: "other", js: "other", typ: u(undefined, true) },
        { json: "elvish", js: "elvish", typ: u(undefined, true) },
    ], false),
    "LanguageProficiencyChoose": o([
        { json: "from", js: "from", typ: a("") },
        { json: "count", js: "count", typ: u(undefined, 0) },
    ], false),
    "Prerequisite": o([
        { json: "campaign", js: "campaign", typ: a("") },
    ], false),
    "SkillProficiency": o([
        { json: "insight", js: "insight", typ: u(undefined, true) },
        { json: "religion", js: "religion", typ: u(undefined, true) },
        { json: "history", js: "history", typ: u(undefined, true) },
        { json: "survival", js: "survival", typ: u(undefined, true) },
        { json: "investigation", js: "investigation", typ: u(undefined, true) },
        { json: "persuasion", js: "persuasion", typ: u(undefined, true) },
        { json: "nature", js: "nature", typ: u(undefined, true) },
        { json: "choose", js: "choose", typ: u(undefined, r("LanguageProficiencyChoose")) },
        { json: "acrobatics", js: "acrobatics", typ: u(undefined, true) },
        { json: "athletics", js: "athletics", typ: u(undefined, true) },
        { json: "intimidation", js: "intimidation", typ: u(undefined, true) },
        { json: "deception", js: "deception", typ: u(undefined, true) },
        { json: "animal handling", js: "animal handling", typ: u(undefined, true) },
        { json: "perception", js: "perception", typ: u(undefined, true) },
        { json: "performance", js: "performance", typ: u(undefined, true) },
        { json: "sleight of hand", js: "sleight of hand", typ: u(undefined, true) },
        { json: "stealth", js: "stealth", typ: u(undefined, true) },
        { json: "any", js: "any", typ: u(undefined, 0) },
        { json: "medicine", js: "medicine", typ: u(undefined, true) },
        { json: "arcana", js: "arcana", typ: u(undefined, true) },
    ], false),
    "SkillToolLanguageProficiency": o([
        { json: "anyLanguage", js: "anyLanguage", typ: u(undefined, 0) },
        { json: "anyTool", js: "anyTool", typ: u(undefined, 0) },
    ], false),
    "StartingEquipment": o([
        { json: "_", js: "_", typ: u(undefined, a(u(r("Class"), ""))) },
        { json: "a", js: "a", typ: u(undefined, a(u(r("AClass"), ""))) },
        { json: "b", js: "b", typ: u(undefined, a(u(r("BClass"), ""))) },
        { json: "A", js: "A", typ: u(undefined, a(u(r("AClass"), ""))) },
        { json: "B", js: "B", typ: u(undefined, a(r("B"))) },
        { json: "c", js: "c", typ: u(undefined, a(r("C"))) },
        { json: "d", js: "d", typ: u(undefined, a(r("C"))) },
    ], false),
    "AClass": o([
        { json: "item", js: "item", typ: u(undefined, "") },
        { json: "displayName", js: "displayName", typ: u(undefined, "") },
        { json: "quantity", js: "quantity", typ: u(undefined, 0) },
        { json: "value", js: "value", typ: u(undefined, 0) },
        { json: "equipmentType", js: "equipmentType", typ: u(undefined, r("EquipmentType")) },
        { json: "special", js: "special", typ: u(undefined, "") },
    ], false),
    "B": o([
        { json: "value", js: "value", typ: 0 },
    ], false),
    "Class": o([
        { json: "item", js: "item", typ: u(undefined, "") },
        { json: "displayName", js: "displayName", typ: u(undefined, "") },
        { json: "special", js: "special", typ: u(undefined, "") },
        { json: "quantity", js: "quantity", typ: u(undefined, 0) },
        { json: "containsValue", js: "containsValue", typ: u(undefined, 0) },
        { json: "equipmentType", js: "equipmentType", typ: u(undefined, r("EquipmentType")) },
        { json: "worthValue", js: "worthValue", typ: u(undefined, 0) },
        { json: "value", js: "value", typ: u(undefined, 0) },
    ], false),
    "BClass": o([
        { json: "special", js: "special", typ: u(undefined, "") },
        { json: "equipmentType", js: "equipmentType", typ: u(undefined, r("EquipmentType")) },
    ], false),
    "C": o([
        { json: "special", js: "special", typ: "" },
    ], false),
    "ToolProficiency": o([
        { json: "calligrapher's supplies", js: "calligrapher's supplies", typ: u(undefined, true) },
        { json: "choose", js: "choose", typ: u(undefined, r("LanguageProficiencyChoose")) },
        { json: "anyArtisansTool", js: "anyArtisansTool", typ: u(undefined, 0) },
        { json: "herbalism kit", js: "herbalism kit", typ: u(undefined, true) },
        { json: "vehicles (land)", js: "vehicles (land)", typ: u(undefined, true) },
        { json: "disguise kit", js: "disguise kit", typ: u(undefined, true) },
        { json: "anyGamingSet", js: "anyGamingSet", typ: u(undefined, 0) },
        { json: "forgery kit", js: "forgery kit", typ: u(undefined, true) },
        { json: "weaver's tools", js: "weaver's tools", typ: u(undefined, true) },
        { json: "thieves' tools", js: "thieves' tools", typ: u(undefined, true) },
        { json: "leatherworker's tools", js: "leatherworker's tools", typ: u(undefined, true) },
        { json: "vehicles (water)", js: "vehicles (water)", typ: u(undefined, true) },
        { json: "anyMusicalInstrument", js: "anyMusicalInstrument", typ: u(undefined, 0) },
        { json: "carpenter's tools", js: "carpenter's tools", typ: u(undefined, true) },
        { json: "smith's tools", js: "smith's tools", typ: u(undefined, true) },
        { json: "glassblower's tools", js: "glassblower's tools", typ: u(undefined, true) },
        { json: "poisoner's kit", js: "poisoner's kit", typ: u(undefined, true) },
        { json: "cartographer's tools", js: "cartographer's tools", typ: u(undefined, true) },
        { json: "alchemist's supplies", js: "alchemist's supplies", typ: u(undefined, true) },
        { json: "tinker's tools", js: "tinker's tools", typ: u(undefined, true) },
        { json: "brewer's supplies", js: "brewer's supplies", typ: u(undefined, true) },
        { json: "cook's utensils", js: "cook's utensils", typ: u(undefined, true) },
        { json: "vehicles (air)", js: "vehicles (air)", typ: u(undefined, true) },
        { json: "navigator's tools", js: "navigator's tools", typ: u(undefined, true) },
        { json: "woodcarver's tools", js: "woodcarver's tools", typ: u(undefined, true) },
        { json: "painter's supplies", js: "painter's supplies", typ: u(undefined, true) },
        { json: "mason's tools", js: "mason's tools", typ: u(undefined, true) },
        { json: "jeweler's tools", js: "jeweler's tools", typ: u(undefined, true) },
        { json: "vehicles (space)", js: "vehicles (space)", typ: u(undefined, true) },
    ], false),
    "WeaponProficiency": o([
        { json: "firearms", js: "firearms", typ: true },
    ], false),
    "Name": [
        "Ability Scores:",
        "Athar",
        "Bleak Cabal",
        "Doomguard",
        "Equipment:",
        "Fated",
        "Feat:",
        "Fraternity of Order",
        "Hands of Havoc",
        "Harmonium",
        "Heralds of Dust",
        "Languages:",
        "Languages and Tool Proficiencies:",
        "Mercykillers",
        "Mind's Eye",
        "Skill Proficiencies:",
        "Society of Sensation",
        "Tool Proficiencies:",
        "Tool Proficiency:",
        "Transcendent Order",
        "Weapon Proficiencies:",
    ],
    "PurpleType": [
        "item",
    ],
    "Style": [
        "list-hang-notitle",
    ],
    "ItemsType": [
        "entries",
        "inset",
        "list",
        "section",
        "table",
    ],
    "Mode": [
        "insertArr",
        "replaceArr",
    ],
    "ColStyle": [
        "col-10",
        "col-11",
        "col-1 text-center",
        "col-2 text-center",
        "col-4",
        "col-5",
        "col-6",
        "col-6 text-center",
        "col-7",
        "text-center col-2",
    ],
    "CopySource": [
        "PSA",
        "PHB",
        "TDCSR",
    ],
    "From": [
        "cha",
        "con",
        "dex",
        "int",
        "str",
        "wis",
    ],
    "AdditionalSourceSource": [
        "CoS",
        "PHB",
    ],
    "Edition": [
        "one",
    ],
    "ColLabel": [
        "d6",
        "Personality Trait",
        "Trinket",
    ],
    "EquipmentType": [
        "instrumentMusical",
        "setGaming",
        "toolArtisan",
    ],
};
