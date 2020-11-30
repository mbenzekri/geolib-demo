import { Geofile, CsvOptions } from 'geolib';
import { LitElement } from 'lit-element';
import * as ol from 'ol';
import * as olstyle from 'ol/style';
declare type glFileStruct = {
    type: string;
    file: File;
    dbf?: File;
    index?: File;
};
declare module 'lit-element' {
    interface LitElement {
        isdigit(event: KeyboardEvent): void;
        byId<T = Element>(id: string): T;
        byClass<T = Element>(clname: string): T;
        byName<T = Element>(name: string): T;
        byTag<T = Element>(tag: string): T;
        byAttr<T = Element>(name: string, value?: any): T;
        query<T = Element>(selector: string): T;
        prevdef(e: Event): void;
        bindback(dispatch?: boolean): void;
        blink(elem: Element, millisec: number): void;
    }
}
export declare class glCsvOptions extends LitElement {
    header: boolean;
    lon: string;
    lat: string;
    separator: string;
    skip: number;
    get value(): {
        header: boolean;
        lon: string;
        lat: string;
        separator: string;
        skip: number;
    };
    static get styles(): import("lit-element").CSSResult[];
    render(): import("lit-element").TemplateResult;
    firstUpdated(): void;
}
export declare class glGeofileDropzone extends LitElement {
    static get styles(): import("lit-element").CSSResult[];
    render(): import("lit-element").TemplateResult;
    private handlefiles;
    private extension;
    private name;
    private groupfiles;
    private select;
    private drop;
    private highlight;
    private unhighlight;
}
export declare class glGeofileStyler extends LitElement {
    minscale: number;
    maxscale: number;
    color: string;
    get olstyle(): olstyle.Style[];
    constructor(minscale?: number, maxscale?: number, color?: string);
    static get styles(): import("lit-element").CSSResult[];
    render(): import("lit-element").TemplateResult;
    firstUpdated(): void;
    define(color: string): olstyle.Style[];
}
export declare class glGeofileLoader extends LitElement {
    private _files;
    private _csvoptions;
    readonly geofile: Geofile;
    get files(): glFileStruct;
    set files(files: glFileStruct);
    get csvoptions(): CsvOptions;
    set csvoptions(csvoptions: CsvOptions);
    private set _geofile(value);
    get csvtooltip(): string;
    private message;
    private _parsed;
    private _count;
    private _rate;
    private _state;
    get parsed(): number;
    get count(): number;
    get state(): "initial" | "created" | "loaded" | "fail";
    constructor(files?: glFileStruct);
    static get styles(): import("lit-element").CSSResult[];
    connectedCallback(): void;
    render(): import("lit-element").TemplateResult;
    private get progresscb();
    alert(): void;
    create(): void;
    index(): Promise<void>;
    load(): Promise<void>;
    indexblob(): Blob;
}
export declare class glGeofileViewer extends LitElement {
    map: ol.Map;
    private _files;
    get files(): glFileStruct;
    set files(files: glFileStruct);
    private loader;
    private styler;
    private layer;
    private notcsv;
    private collapsed;
    private hideload;
    private hideindex;
    private hideadd;
    private hideremove;
    private hidesave;
    constructor(files?: glFileStruct, map?: ol.Map);
    firstUpdated(): void;
    static get styles(): import("lit-element").CSSResult[];
    render(): import("lit-element").TemplateResult;
    private refresh;
    csvchange(event: CustomEvent): void;
    loaderchange(event: Event): void;
    switch(event: Event): void;
    load(event: Event): void;
    index(event: Event): void;
    addmap(event: Event): void;
    remmap(event?: Event): void;
    drop(event: Event): void;
    save(event: Event): void;
    download(blob: Blob, filename: string): void;
}
export {};
