import { purecss } from './pure-min'
import { glcss } from './styles'
import { Geofile, Shapefile, Geojson, Csv, CsvOptions, GeofileFeature } from 'geolib'
import { LitElement, html, css, property, customElement } from 'lit-element';
import * as ol from 'ol'
import * as ollayer from 'ol/layer'
import * as olsource from 'ol/source'
import * as olproj from 'ol/proj'
import * as olextent from 'ol/extent'
import * as olstyle from 'ol/style'
import * as olformat from 'ol/format'

type glFileStruct = { type: string, file: File, dbf?: File, index?: File }

declare module 'lit-element' {
    export interface LitElement {
        isdigit(event: KeyboardEvent): void
        byId<T = Element>(id: string): T
        byClass<T = Element>(clname: string): T
        byName<T = Element>(name: string): T
        byTag<T = Element>(tag: string): T
        byAttr<T = Element>(name: string, value?: any): T
        query<T = Element>(selector: string): T
        prevdef(e: Event): void
        bindback(dispatch?: boolean): void
        blink(elem: Element, millisec: number): void
    }
}


LitElement.prototype.query = function <T = Element>(selector: string): T {
    return this.shadowRoot.querySelector(selector) as T
}

LitElement.prototype.byTag = function <T = Element>(name: string): T {
    return this.query(`${name}`)
}
LitElement.prototype.byName = function <T = Element>(name: string): T {
    return this.query(`*[name="${name}"]`)
}

LitElement.prototype.byClass = function <T = Element>(clname: string): T {
    return this.query(`.${clname}`)
}

LitElement.prototype.byId = function <T = Element>(id: string): T {
    return this.query(`#${id}]`)
}

LitElement.prototype.byAttr = function <T = Element>(name: string, value?: any): T {
    return value ? this.query(`*[${name}="${value}"]`) : this.query(`*[${name}]`)
}

LitElement.prototype.prevdef = function (event: Event) {
    event.preventDefault()
    event.stopPropagation()
}

LitElement.prototype.isdigit = function (event: KeyboardEvent) {
    if ('0123456789'.indexOf(event.key) < 0) event.preventDefault()
}

 
LitElement.prototype.bindback = function (dispatch = true) {
    const tobindlist = this.shadowRoot.querySelectorAll('*[wayback]')
    for (const elem of Array.from(tobindlist)) {
        if (elem instanceof HTMLInputElement) {
            elem.addEventListener('change', (event: Event) => {
                let obj: any = this
                const name = elem.getAttribute('wayback')
                const old = obj[name]
                switch (true) {
                    case elem.type === 'checkbox' || elem.type === 'radio':
                        obj[name] = elem.checked
                        break
                    case elem.type === 'date' || elem.type === 'datetime-local':
                        obj[name] = elem.valueAsDate
                        break
                    case elem.type === 'number':
                        obj[name] = elem.valueAsNumber;
                        break
                    default:
                        obj[name] = elem.value
                        break
                }
                const value = obj[name]
                if (dispatch) this.dispatchEvent(new CustomEvent('change', {
                    detail: { target: this, name,value:obj[name], old }
                })) 
            })
        }
        if (elem instanceof HTMLSelectElement) {
            const handler = (event: Event) => {
                let obj: any = this
                const name = elem.getAttribute('wayback')
                const old = obj[name]
                obj[name] = elem.value
                if (dispatch) this.dispatchEvent(new CustomEvent('change', {
                    detail: { target: this, name,value:obj[name], old }
                })) 
            }
            elem.addEventListener('select', handler)
            elem.addEventListener('change', handler)
        }
    }
}


LitElement.prototype.blink = function(elem: Element, millisec: number) {
    elem.classList.add('blink')
    setTimeout(() => elem.classList.remove('blink'), millisec)
}

@customElement('gl-csvoptions')
export class glCsvOptions extends LitElement {
    @property({ attribute: false }) header = true
    @property({ attribute: false }) lon = 'lon'
    @property({ attribute: false }) lat = 'lat'
    @property({ attribute: false }) separator = ';'
    @property({ attribute: false }) skip = 0

    @property({ type: Object }) get value() {
        return { header: this.header, lon: this.lon, lat: this.lat, separator: this.separator, skip: this.skip }
    }

    static get styles() {
        return [purecss,glcss];
    }

    render() {
        return html`
        <form class="pure pure-form pure-form-aligned">
            <div class="pure-control-group">
                <label> separator</label>
                <select wayback="separator"  .value="${this.separator}" >
                    <option value=";"  > <b>;</b> semicolon </option>
                    <option value="," > <b>,</b> comma </option>
                    <option value="&#9;" > tab </option>
                    <option value=" " > space </option>
                </select>
            </div>
            <div class="pure-control-group">
                <label>header</label> 
                <input wayback="header" type="checkbox" ?checked="${this.header}" >
            </div>
            <div class="pure-control-group">
                <label>lon</label> 
                <input wayback="lon" type="text" .value="${this.lon}" >
            </div>
            <div class="pure-control-group">
                <label>lat</label> 
                <input wayback="lat" type="text" .value="${this.lat}" >
            </div>
            <div class="pure-control-group">
                <label>skip</label> 
                <input wayback="skip" type="number" .value="${this.skip.toString()}" @keypress="${this.isdigit}">
            </div>
        </form>
        `
    }
    firstUpdated() {
        this.bindback()
    }
}

@customElement('gl-dropzone')
export class glGeofileDropzone extends LitElement {

    static get styles() {
        return [purecss, glcss, css`
        .drop-area {
            position: absolute;
            top: 20px;
            left: 50px;
            border: 3px dashed #999;
            border-radius: 20px;
            font-family: sans-serif;
            margin: 10px auto;
            padding: 10px;
            z-index: 100000;
            background-color: white;
            text-align: center;
        }
        .highlight {
            border-color: rgb(0, 49, 128);
        }`];
    }
    render() {
        return html`
        <div>
            <form class="drop-area" @drop="${this.drop}" @dragenter="${this.highlight}" @dragover="${this.highlight}" @dragleave="${this.unhighlight}">
                <input type="file" id="fileElem" style="display:none" multiple accept="*/*" @change="${this.select}">
                <label for="fileElem">click to select file or <br> Drag/Drop some files</label>
            </form>
        </div>
        `
    }

    private handlefiles(files: File[]) {
        let event = new CustomEvent('change', {
            detail: {
                target: this,
                files: this.groupfiles(files)
            }
        });
        this.dispatchEvent(event);
    }

    private extension(filename: string) { return filename.replace(/^.*\./, '') }

    private name(filename: string) { return filename.replace(/\.[^.]*/, '') }

    private groupfiles(files: File[]) {

        const geoext = ['geojson', 'csv', 'shp']
        const map = new Map<string, glFileStruct>()

        files.filter(file => geoext.includes(this.extension(file.name)))
            .forEach(file => {
                const type = this.extension(file.name)
                map.set(file.name, { type, file })
            })
        files.filter(file => this.extension(file.name) === 'idx').
            forEach(index => {
                const exts = geoext.filter(ext => map.has(`${this.name(index.name)}.${ext}`))
                switch (exts.length) {
                    case 0: break
                    case 1: map.get(`${this.name(index.name)}.${exts[0]}`).index = index; break
                    default: throw Error(`ambiguous index file name association ${index.name} for extension ${exts.toString()} index ignored`)
                }
            })
        files.filter(file => this.extension(file.name) === 'dbf')
            .forEach(dbf => {
                if (map.has(`${this.name(dbf.name)}.shp`)) map.get(`${this.name(dbf.name)}.shp`).dbf = dbf
            })
        return Array.from(map.values())
    }

    private select(e: Event) {
        const files = Array.from((e.target as HTMLInputElement).files)
        this.handlefiles(files)
        this.prevdef(e)
    }

    private drop(e: DragEvent) {
        this.unhighlight(e)
        const files = Array.from(e.dataTransfer.files)
        this.handlefiles(files)
        this.prevdef(e)
    }
    private highlight(e: Event) {
        this.byClass('drop-area').classList.add('highlight')
        this.prevdef(e)
    }
    private unhighlight(e: Event) {
        this.byClass('drop-area').classList.remove('highlight')
        this.prevdef(e)
    }
}

@customElement('gl-styler')
export class glGeofileStyler extends LitElement {

    @property({ attribute: false, type: Number }) minscale = 0
    @property({ attribute: false, type: Number }) maxscale = 10000
    @property({ attribute: false, type: String }) color = '#3399CC'
    @property({ attribute: false }) get olstyle() { return this.define(this.color) }

    constructor(minscale = 0, maxscale = 10000, color = '#3399CC') {
        super()
    }

    static get styles() {
        return [purecss, glcss]
    }
    render() {
        return html`
        <form class="pure pure-form pure-form-aligned">
            <div class="pure-control-group">
                <label>Min scale</label>
                <input wayback="minscale" type="number" .value="${this.minscale.toString()}" @keypress="${this.isdigit}">
            </div>
            <div class="pure-control-group">
                <label>Max scale</label>
                <input wayback="maxscale" type="number" .value="${this.maxscale.toString()}" @keypress="${this.isdigit}">
            </div>
            <div class="pure-control-group">
                <label>Color</label>
                <input wayback="color" type="color" .value="${this.color}">
            </div>
        </form>`
    }

    firstUpdated() {
        this.bindback()
    }
    
    define(color: string): olstyle.Style[] {
        return [
            new olstyle.Style({
                image: new olstyle.Circle({
                    fill: new olstyle.Fill({
                        color: 'rgba(255,255,255,0.4)'
                    }),
                    stroke: new olstyle.Stroke({
                        color: color,
                        width: 1.25
                    }),
                    radius: 5
                }),
                fill: new olstyle.Fill({
                    color: 'rgba(255,255,255,0.4)'
                }),
                stroke: new olstyle.Stroke({
                    color: color,
                    width: 1.25
                })
            })]
    }
}

@customElement('gl-loader')
export class glGeofileLoader extends LitElement {

    @property({ attribute: false }) private _files: glFileStruct
    @property({ attribute: false }) private _csvoptions: CsvOptions
    @property({ attribute: false }) readonly geofile: Geofile
    get files() { return this._files}
    set files(files: glFileStruct) { this._files = files; this.create() }
    get csvoptions() { return this._csvoptions}
    set csvoptions(csvoptions: CsvOptions) { this._csvoptions = csvoptions; this.create() }
    private set _geofile(geofile: Geofile) { (this as any).geofile = geofile;}
    @property({ attribute: false }) get csvtooltip() {
        if (!this.csvoptions || !this._files ||  this._files.type !== 'csv') return ''
        const obj:any = this.csvoptions
        return Object.keys(obj).map(key => `\u2022 ${key} \u279C ${obj[key]} `).join('\n')
    }

    @property({ attribute: false, type: String }) private message = ''
    @property({ attribute: false, type: Number }) private _parsed = 0
    @property({ attribute: false, type: Number }) private _count = 0
    @property({ attribute: false, type: Number }) private _rate = 0
    @property({ attribute: false, reflect:true, type: String }) private _state: 'initial' | 'created' | 'loaded' | 'fail'

    get parsed() { return this._parsed }
    get count() { return this._count }
    get state() { return this._state }

    constructor(files: glFileStruct = null) {
        super()
        if (files) this.files = files
    }

    static get styles() {
        return [purecss, glcss, css`
        progress {
            padding: 0;
            border: 0;
            text-align: center
        }
        progress[value]::-webkit-progress-bar {
            border-radius: 2px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
        }
        progress::-moz-progress-bar {
            border-radius: 2px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
        }
        input[state=created] {
            background-color: lightblue !important;
        }
        input[state=fail]{
            background-color: pink !important;
        }
        input[state=loaded] {
            background-color: lightgreen !important;
        }
        `]
    }
    connectedCallback() {
        super.connectedCallback()
    }
    render() {
        return (this.files) ?
            html`
            <form class="pure pure-form pure-form-aligned">
                <div class="pure-control-group">
                    <label>Type</label>
                    <input type="text" readonly .value="${this.files.type} file"/>
                </div>
                <div class="pure-control-group">
                    <label>Name</label>
                    <input type="text" readonly .value="${this.files.file.name}"  .title="${this.csvtooltip}"/>
                </div>
                <div class="pure-control-group">
                    <label>Size</label>
                    <input type="text" readonly .value="${this.files.file.size.toString()} bytes"/>
                </div>
                <div class="pure-control-group">
                    <label name="progress">Parsed</label>
                    <progress class="pure-form-message-inline" type="text" readonly .value="${this.parsed}" .max="${this.files.file.size}"></progress>
                </div>
                <div class="pure-control-group">
                    <label>count</label>
                    <input type="text" readonly .value="${this._count.toString()} features">
                </div>
                <div class="pure-control-group">
                    <label>Rate</label>
                    <input type="text" readonly .value="${this._rate.toString()} obj/s">
                </div>
                <div class="pure-control-group">
                    <label>State</label>
                    <input type="text" readonly state="${this._state}" .value="${this._state}" .title="${this.message}"/>
                </div>
            </form>`
            : html`no file set`
    }

    private get progresscb() {
        const start = Date.now()
        return (p: { read: number, size: number, count: number }) => {
            this._count = p.count
            this._rate = Math.floor((p.count * 1000) / (Date.now() - start))
            this._parsed = p.read
        }
    }
    alert() {
        if (this.message) alert(this.message)
    }

    create() {
        // ATTENTION: geofile may be already created
        //            this method may be called after options change
        let geofile: Geofile = null
        const type = this.files ? this.files.type : 'unknown'
        switch (type) {
            case 'shp':
                geofile = new Shapefile(this.files.file.name, this.files.file, this.files.dbf)
                break;
            case 'geojson':
                geofile = new Geojson(this.files.file.name, this.files.file, this.files.index)
                break
            case 'csv':
                geofile = new Csv(this.files.file.name, this.files.file, this.csvoptions, this.files.index)
                break
        }
        this._geofile = geofile
        this._state = 'created'
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                target: this,
                value: this.state
            }
        }))
    }

    index() {
        if (this.geofile) {
            return this.geofile.buildIndexes([], this.progresscb).then(() => {
                this.blink(this.byTag('form'), 1000)
                this._state = 'loaded'
            })
        }
        return Promise.reject(Error(`index requested with no geofile `))
    }
    load() {
        if (this.geofile) {
            return this.geofile.load().then(() => {
                this.blink(this.byTag('form'), 2000)
                this._state = 'loaded'
            }).catch((e: Error) => {
                this._state = 'fail'
                this.message = `Load error for ${this.geofile.name} : ${e.stack}`
            })
        }
        return Promise.reject(Error(`load requested with no geofile `))
    }
    indexblob(): Blob {
        if (this.geofile && this.geofile.loaded) {
            return new Blob([this.geofile.getIndexBuffer()], { type: 'application/octet-stream' })
        }
        return null
    }
}

@customElement('gl-viewer')
export class glGeofileViewer extends LitElement {
    public map: ol.Map
    private _files: glFileStruct
    get files() { return this._files }
    set files(files: glFileStruct) {
        this._files = files
        if (this.loader) this.loader.files = files
        this.refresh()
    }
    private loader: glGeofileLoader
    private styler: glGeofileStyler
    private layer: ollayer.Layer

    @property({ attribute:false }) private notcsv = false
    @property({ attribute:false }) private collapsed = false
    @property({ attribute:false }) private hideload = true
    @property({ attribute:false }) private hideindex = true
    @property({ attribute:false }) private hideadd = true
    @property({ attribute:false }) private hideremove = true
    @property({ attribute:false }) private hidesave = true

    constructor(files?: glFileStruct, map?: ol.Map) {
        super()
        if (files) this.files = files
        if (map) this.map = map
    }

    firstUpdated() {
        this.loader = this.byTag('gl-loader')
        this.styler = this.byTag('gl-styler')
        this.loader.csvoptions = this.byTag<glCsvOptions>('gl-csvoptions').value
        if (this.files) this.loader.files = this.files
        this.refresh()
    }

    static get styles() {
        return [purecss, glcss, css`
        .pure-menu-list {
            float: right
        }
        fieldset {
            display: inline-block;
            vertical-align: top;
        }`]
    }

    render() {
        return html`
        <div>
            <div class="pure-menu pure-menu-horizontal" @click="${this.switch}">
                <a class="pure-menu-heading" href="">${this.files.file.name}</a>
                <ul class="pure-menu-list">
                    <li class="pure-menu-item"><a href="#" ?hidden="${this.hideload}"  @click="${this.load}" class="pure-menu-link">Load</a></li>
                    <li class="pure-menu-item"><a href="#" ?hidden="${this.hideindex}"  @click="${this.index}" class="pure-menu-link">Index</a></li>
                    <li class="pure-menu-item"><a href="#" ?hidden="${this.hideadd}"  @click="${this.addmap}" class="pure-menu-link">Add</a></li>
                    <li class="pure-menu-item"><a href="#" ?hidden="${this.hideremove}"  @click="${this.remmap}" class="pure-menu-link">Remove</a></li>
                    <li class="pure-menu-item"><a href="#" ?hidden="${this.hidesave}"  @click="${this.save}" class="pure-menu-link">Save</a></li>
                    <li class="pure-menu-item"><a href="#" @click="${this.drop}" class="pure-menu-link">Drop</a></li>
                </ul>
            </div>
            <form  ?hidden="${this.collapsed}" class="pure-form">
                <fieldset name="general"> <legend>Geofile:</legend><gl-loader  @change="${this.loaderchange}"></gl-loader></fieldset>
                <fieldset ?hidden="${this.notcsv}"><legend>Options</legend><gl-csvoptions @change="${this.csvchange}"></gl-csvoptions></fieldset>
                <fieldset><legend>Rendering</legend><gl-styler></gl-styler></fieldset>
            </form>
        </div>`
    }

    private refresh() {
        if (this.loader) {
            this.hideload = !(this.loader.state === 'created' && !!this._files.index)
            this.hideindex = !(this.loader.state === 'created' && !this._files.index)
            this.hideadd = !(this.loader.state === 'loaded' && !this.layer)
            this.hideremove = !(this.loader.state === 'loaded' && !!this.layer)
            this.hidesave = !(this.loader.state === 'loaded')
        }
        this.notcsv = !this.files || this.files.type !== 'csv'
    }

    csvchange(event: CustomEvent) {
        if (this.layer) this.remmap()
        this.loader.csvoptions = event.detail.target.value
        this.refresh()
    }
    loaderchange(event: Event) {
        this.refresh()
    }
    switch(event: Event) {
        this.collapsed = !this.collapsed
        this.prevdef(event)
    }

    load(event: Event) {
        this.loader.load()
        .then()
        .catch()
        .finally(() => this.refresh())
        this.prevdef(event)
    }

    index(event: Event) {
        this.loader.index()
        .then()
        .catch()
        .finally(() => this.refresh())
        this.prevdef(event)
    }

    addmap(event: Event) {
        let last_extent = olextent.createEmpty();
        const format = new olformat.GeoJSON();
        const geofile = this.loader.geofile
        const style = this.styler.olstyle
        const minscale = this.styler.minscale
        const maxscale = this.styler.maxscale

        // strategy is to redo all for each load
        const strategy = (extent: number[]) => {
            if ((source as any).loadedExtentsRtree_) (source as any).loadedExtentsRtree_.clear();
            return [extent];
        }

        // we define a loader for vector source
        // IMPORTANT minscale and maxscale is handled to avoid too much features loading
        const loader = (extent: olextent.Extent, resolution: null, proj: olproj.ProjectionLike) => {
            if (olextent.equals(extent, last_extent)) return;
            last_extent = extent
            const projname: string = (typeof proj === 'string') ? proj : proj.getCode()
            const scale = geofile.getScale(resolution, projname);
            if (projname !== geofile.proj) {
                extent = olproj.transformExtent(extent, proj, geofile.proj);
            }
            if ((!maxscale || (maxscale && scale < maxscale))
                && (!minscale || (minscale && scale >= minscale))) {
                geofile.bbox(extent, { targetProjection: projname })
                    .then((features: any) => {
                        source.clear(true);
                        source.addFeatures(features.map((f: object) => format.readFeature(f)));
                    });
            } else {
                source.clear(true);
            }
        };

        // source and layer created an added to map
        const source = new olsource.Vector({ useSpatialIndex: false, strategy, loader } as any)
        const mapproj = this.map.getView().getProjection().getCode()
        const minResolution = geofile.getResolution(minscale, mapproj)
        const maxResolution = geofile.getResolution(maxscale, mapproj)
        this.layer = new ollayer.Vector({
            renderMode: 'image', visible: true, source, style, minResolution, maxResolution
        } as any);
        this.map.addLayer(this.layer)

        this.refresh()
        this.prevdef(event)
    }

    remmap(event?: Event) {
        if (this.layer) {
            this.map.removeLayer(this.layer)
            this.layer = null
        }
        this.refresh()
        if (event) this.prevdef(event)
    }

    drop(event: Event) {
        this.remmap()
        this.parentElement.removeChild(this)
        this.refresh()
        this.prevdef(event)
    }

    save(event: Event) {
        const blob = this.loader.indexblob()
        const filename = this.files.file.name
        const ext = this.files.type
        this.download(blob, filename.replace(new RegExp(`${ext}$`), 'idx'))
        this.refresh()
        this.prevdef(event)
    }

    download(blob: Blob, filename: string) {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        document.body.removeChild(link);
    }


}
