abstract class FormattingStyle {
    public abstract link(str: string, link: string): string;
    public abstract bold(str: string): string;
    public abstract italics(str: string): string;
    public abstract underline(str: string): string;
}

class MarkdownStyle extends FormattingStyle {
    public link(str: string, link: string): string {
        return `[${str}](${link})`;
    }

    public bold(str: string): string {
        return `**${str}**`;
    }

    public italics(str: string): string {
        return `*${str}*`;
    }

    public underline(str: string): string {
        return `__${str}__`;
    }
}

class HTMLStyle extends FormattingStyle {
    public link(str: string, link: string): string {
        return `<a href='${link}'>${str}</a>`;
    }

    public bold(str: string): string {
        return `<b>${str}</b>`;
    }

    public italics(str: string): string {
        return `<i>${str}</i>`;
    }

    public underline(str: string): string {
        return `<u>${str}</u>`;
    }
}

class Styles extends FormattingStyle {
    private readonly markdown = new MarkdownStyle();
    private readonly html = new HTMLStyle();
    private current: FormattingStyle;

    constructor() {
        super();
        this.current = this.markdown;
    }

    public set(style: 'html' | 'markdown'): void {
        if (style === 'markdown') this.current = this.markdown;
        else if (style === 'html') this.current = this.html;
    }

    public link(str: string, link: string): string {
        return this.current.link(str, link);
    }

    public bold(str: string): string {
        return this.current.bold(str);
    }

    public italics(str: string): string {
        return this.current.italics(str);
    }

    public underline(str: string): string {
        return this.current.underline(str);
    }
}

export const styles = new Styles();
