// To parse this data:
//
//   import { Convert, Actions } from "./file";
//
//   const actions = Convert.toActions(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Actions {
    action: Action[];
}

export interface Action {
    name:            string;
    source:          Source;
    page:            number;
    srd?:            boolean;
    basicRules?:     boolean;
    time?:           Array<TimeClass | string>;
    entries:         Array<PurpleEntry | string>;
    reprintedAs?:    Array<ReprintedAClass | string>;
    seeAlsoAction?:  string[];
    srd52?:          boolean;
    fromVariant?:    string;
    basicRules2024?: boolean;
}

export interface PurpleEntry {
    type:       Type;
    name?:      string;
    entries?:   Array<FluffyEntry | string>;
    caption?:   string;
    colLabels?: string[];
    colStyles?: string[];
    rows?:      Array<string[]>;
}

export interface FluffyEntry {
    type:       string;
    name?:      string;
    entries?:   string[];
    caption?:   string;
    colLabels?: string[];
    colStyles?: string[];
    rows?:      Array<string[]>;
    items?:     string[];
}

export enum Type {
    Entries = "entries",
    Inset = "inset",
    Table = "table",
}

export interface ReprintedAClass {
    uid: string;
    tag: string;
}

export enum Source {
    Dmg = "DMG",
    Phb = "PHB",
    Xge = "XGE",
    Xphb = "XPHB",
}

export interface TimeClass {
    number: number;
    unit:   Unit;
}

export enum Unit {
    Action = "action",
    Bonus = "bonus",
    Reaction = "reaction",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toActions(json: string): Actions {
        return cast(JSON.parse(json), r("Actions"));
    }

    public static actionsToJson(value: Actions): string {
        return JSON.stringify(uncast(value, r("Actions")), null, 2);
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
    "Actions": o([
        { json: "action", js: "action", typ: a(r("Action")) },
    ], false),
    "Action": o([
        { json: "name", js: "name", typ: "" },
        { json: "source", js: "source", typ: r("Source") },
        { json: "page", js: "page", typ: 0 },
        { json: "srd", js: "srd", typ: u(undefined, true) },
        { json: "basicRules", js: "basicRules", typ: u(undefined, true) },
        { json: "time", js: "time", typ: u(undefined, a(u(r("TimeClass"), ""))) },
        { json: "entries", js: "entries", typ: a(u(r("PurpleEntry"), "")) },
        { json: "reprintedAs", js: "reprintedAs", typ: u(undefined, a(u(r("ReprintedAClass"), ""))) },
        { json: "seeAlsoAction", js: "seeAlsoAction", typ: u(undefined, a("")) },
        { json: "srd52", js: "srd52", typ: u(undefined, true) },
        { json: "fromVariant", js: "fromVariant", typ: u(undefined, "") },
        { json: "basicRules2024", js: "basicRules2024", typ: u(undefined, true) },
    ], false),
    "PurpleEntry": o([
        { json: "type", js: "type", typ: r("Type") },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "entries", js: "entries", typ: u(undefined, a(u(r("FluffyEntry"), ""))) },
        { json: "caption", js: "caption", typ: u(undefined, "") },
        { json: "colLabels", js: "colLabels", typ: u(undefined, a("")) },
        { json: "colStyles", js: "colStyles", typ: u(undefined, a("")) },
        { json: "rows", js: "rows", typ: u(undefined, a(a(""))) },
    ], false),
    "FluffyEntry": o([
        { json: "type", js: "type", typ: "" },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "entries", js: "entries", typ: u(undefined, a("")) },
        { json: "caption", js: "caption", typ: u(undefined, "") },
        { json: "colLabels", js: "colLabels", typ: u(undefined, a("")) },
        { json: "colStyles", js: "colStyles", typ: u(undefined, a("")) },
        { json: "rows", js: "rows", typ: u(undefined, a(a(""))) },
        { json: "items", js: "items", typ: u(undefined, a("")) },
    ], false),
    "ReprintedAClass": o([
        { json: "uid", js: "uid", typ: "" },
        { json: "tag", js: "tag", typ: "" },
    ], false),
    "TimeClass": o([
        { json: "number", js: "number", typ: 0 },
        { json: "unit", js: "unit", typ: r("Unit") },
    ], false),
    "Type": [
        "entries",
        "inset",
        "table",
    ],
    "Source": [
        "DMG",
        "PHB",
        "XGE",
        "XPHB",
    ],
    "Unit": [
        "action",
        "bonus",
        "reaction",
    ],
};
