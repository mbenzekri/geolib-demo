declare global {
    interface Element {
        mvc?: MVC;
    }
}
export declare abstract class MVC {
    private static NEXTID;
    readonly id: string;
    readonly template: HTMLTemplateElement;
    readonly fragment: DocumentFragment;
    readonly root: Element;
    abstract model: {
        [key: string]: any;
    };
    constructor(template: HTMLTemplateElement | string);
    destroy(): void;
    build(): void;
    byId(id: string): HTMLElement;
    elem<T>(name: string): T;
    prevDef(e: Event): void;
    handlers(): Map<string, Function>;
}
