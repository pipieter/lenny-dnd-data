interface TimeUnit {
    number: number;
    unit: string;
}

interface DescriptionEntries {
    type: 'entries';
    name: string;
    entries: Description[];
}

type Description = string | DescriptionEntries;
type Time = string | TimeUnit;

interface Action {
    name: string;
    source: string;
    page: number;
    srd?: boolean;
    basicRules?: boolean;
    time?: Time[];
    seeAlsoAction?: string[];
}
