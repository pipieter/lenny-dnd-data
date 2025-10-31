// utils.js:4043 SortUtil.ascSortLower
export function ascSortLower(a: string, b: string) {
    a = a ? a.toLowerCase() : a;
    b = b ? b.toLowerCase() : b;
    if (b === a) return 0;
    return b < a ? 1 : -1;
}
