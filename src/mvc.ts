const EVENTS = new Set([
    ...Object.getOwnPropertyNames(document).filter(k => k.startsWith("on")),
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(document))).filter(k => k.startsWith("on")),
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(window)).filter(k => k.startsWith("on"))
].filter(k => (document as any)[k] == null || typeof (document as any)[k] == "function"));

declare global {
    interface Element {
        mvc?: MVC
    }
}
export abstract class MVC {
    private static NEXTID = 0
    public readonly id: string
    public readonly template: HTMLTemplateElement
    public readonly fragment: DocumentFragment
    public readonly root: Element
    abstract model: { [key: string]: any }

    constructor(template: HTMLTemplateElement | string) {
        if (typeof template === 'string') {
            const elem = this.byId(template)
            if (elem instanceof HTMLTemplateElement)
                this.template = elem
            else
                throw Error(`id: ${template} not found as a template`)
        } else {
            this.template = template
        }
        this.id = `mvid_${MVC.NEXTID++}`
        this.fragment = document.importNode(this.template.content, true)
        this.root = this.fragment.firstElementChild
        this.root.mvc = this
    }
    destroy() {
        this.root.mvc = null
        const parent = this.root.parentElement
        parent.removeChild(this.root) 
    }
    build() {

        // walk DOM to bind event attributes 
        const methods = this.handlers()
        var all = this.root.querySelectorAll('*');
        for (const el of Array.from(all)) for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith('on') && methods.has(attr.nodeValue) && EVENTS.has(attr.name)) {
                // bind method to
                const event = attr.name.replace(/^on/, '')
                const method = methods.get(attr.nodeValue)
                el.addEventListener(event, method.bind(this))
                el.removeAttribute(attr.name)
            }
        }

        // walk the model to bind input changes to model  
        for (const prop in this.model) {
            for (const elem of Array.from(this.root.querySelectorAll(`*[name=${prop}]`))) {
                if (elem instanceof HTMLInputElement) {
                    elem.addEventListener('change', (ev: Event) => { this.model[prop] = ['checkbox', 'radio'].includes(elem.type) ? elem.checked : elem.value })
                    elem.addEventListener('keypress', (ev: Event) => { this.model[prop] = elem.value })
                }
            }
            this.model[prop] = this.model[prop]
        }

        // bind the model changes to the associated imput  
        const me = this
        this.model = new Proxy(this.model, {
            set: (obj: any, prop: string, val: any) => {
                obj[prop] = val;
                if (me.root) {
                    for (const elem of Array.from(me.root.querySelectorAll(`*[name=${prop}]`))) {
                        if (elem instanceof HTMLInputElement && ['checkbox', 'radio'].includes(elem.type)) elem.checked = val ? true : false
                        else if (elem instanceof HTMLInputElement) elem.value = val
                        else if (elem instanceof HTMLSpanElement) elem.innerHTML = val
                    }
                }
                return true;
            }
        })
    }

    byId(id: string): HTMLElement {
        return document.getElementById(id)
    }
    elem<T>(name: string): T {
        return this.root.querySelector(`*[name="${name}"]`) as unknown as T
    }

    prevDef(e: Event) {
        e.preventDefault()
        e.stopPropagation()
    }


    handlers(): Map<string, Function> {

        let properties = new Set<string>()
        let obj = this as any
        let root = this as any
        // walk prototype chain for properties stat
        do {

            Object.getOwnPropertyNames(obj)
                .filter(item => {
                    const desc = Object.getOwnPropertyDescriptor(obj, item)
                    return item.startsWith('do_') && desc && !desc.get && !desc.set
                })
                .map(item => properties.add(item))

        } while ((obj = Object.getPrototypeOf(obj)))

        const result = new Map<string, Function>()
        Array.from(properties.keys()).forEach(item =>
            (typeof root[item] === 'function') && result.set(item, root[item])
        )
        return result
    }
}