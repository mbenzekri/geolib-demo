import { Geofile, GeofileFeature, Shapefile, Csv, Geojson } from 'geolib/dist'
import { MVC } from './mvc'
import * as ol from 'ol'
import * as ollayer from 'ol/layer'
import * as olsource from 'ol/source'
import * as olproj from 'ol/proj'
import * as olextent from 'ol/extent'
import * as olstyle from 'ol/style'
import * as olformat from 'ol/format'
import * as olcontrol from 'ol/control'


function blink(elem: Element,millisec:number) {
    elem.classList.add('blink')
    setTimeout(() => elem.classList.remove('blink'),millisec)
}

class MVCDropzone extends MVC {
    model = {}
    droparea: Element
    constructor() {
        super('dropzone')
        this.build()
    }

    build() {
        super.build()
        this.droparea = this.elem('droparea')
    }

    private handle(files: File[]) {
        const type = ['geojson', 'csv', 'shp'].find(ext => files.some(file => file.name.endsWith(ext)))
        const mvc = new MVCGeofile(files)
        document.body.appendChild(mvc.fragment)   
    }

    private do_drop(e: DragEvent) {
        this.do_unhighlight(e)
        const files = Array.from(e.dataTransfer.files)
        this.handle(files)
        e.preventDefault()
        e.stopPropagation()
    }

    private do_highlight(e: Event) {
        this.droparea.classList.add('highlight')
        e.preventDefault()
        e.stopPropagation()
    }

    private do_unhighlight(e: Event) {
        this.droparea.classList.remove('highlight')
        e.preventDefault()
        e.stopPropagation()
    }
    private do_files(e: Event) {
        const files = Array.from((e.target as HTMLInputElement).files)
        this.handle(files)
        e.preventDefault()
        e.stopPropagation()
    }
}

class MVCGeofile extends MVC {
    files: File[]
    geofile: Geofile
    start: number
    progress: HTMLProgressElement
    layer: ollayer.Layer
    model = {
        type: null as string,
        name: null as string,
        size: null as number,
        count: null as number,
        rate: null as number,
        loaded: false,
        header: true,
        lon: 'lon',
        lat: 'lat',
        separator: ';',
        skip: 0,
        color: '#3399CC',
        minscale: 0,
        maxscale: 10000,
    }

    constructor(files: File[]) {
        super('geoform')
        this.files = files
        this.build()
        const mainfile = files.find(file => ['geojson', 'shp', 'csv'].some(ext => file.name.endsWith(`.${ext}`)))
        this.model.type = mainfile ? mainfile.name.replace(/^.*\./, '') : 'unknown'
        this.model.name = mainfile ? mainfile.name.replace(/\.[^\.]*$/, '') : '<none>'
        this.model.size = mainfile ? mainfile.size : 0
        this.progress = this.elem<HTMLProgressElement>('progress') 
        this.progress.value=0
        this.progress.max = this.model.size
    }

    do_isdigit(event: KeyboardEvent) {
        if ('0123456789'.indexOf(event.key) < 0) event.preventDefault()
    }
    do_switch(event: Event) {
        const elem = this.elem<HTMLElement>('panel')
        elem.hidden =  ! elem.hidden
        event.preventDefault()
        event.stopPropagation()
    }
    do_index(event: Event) {
        this.setbuttons('index')
        this.createGeofile()
        if (this.geofile) {
            this.start = Date.now()
            this.geofile.buildIndexes([], this.onprogress).then(() => {
                this.model.count = this.geofile.count
                this.model.loaded = true
                blink(this.elem('general'),2000)
                this.setbuttons()
            }).catch((e: Error) => {
                this.setbuttons()
                alert(`Load error for ${this.geofile.name} : ${e.stack}`)
            })
        }
        event.preventDefault()
        event.stopPropagation()
    }

    do_show(event: Event) {
        this.setbuttons('show')
        let last_extent = olextent.createEmpty();
        const format = new olformat.GeoJSON();
        const style = this.defstyle(this.model.color)

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
            const projname: string = (proj as any).getCode()
            const scale = this.geofile.getScale(resolution, projname);
            extent = (proj === this.geofile.proj) ? extent : olproj.transformExtent(extent, proj, this.geofile.proj);
            if ((!this.model.maxscale || (this.model.maxscale && scale < this.model.maxscale))
                && (!this.model.minscale || (this.model.minscale && scale >= this.model.minscale))) {
                this.geofile.bbox(extent, { targetProjection: projname })
                    .then((features: any) => {
                        source.clear(true);
                        source.addFeatures(features.map((f: GeofileFeature) => format.readFeature(f)));
                    });
            } else {
                source.clear(true);
            }
        };

        // source created with the provided loader/strategy
        const source = new olsource.Vector({ useSpatialIndex: false, strategy, loader } as any)

        // layer created an added to map
        const minResolution = this.geofile.getResolution(this.model.minscale, map.getView().getProjection().getCode())
        const maxResolution = this.geofile.getResolution(this.model.maxscale, map.getView().getProjection().getCode())
        const vlayer = new ollayer.Vector({
            renderMode: 'image', visible: true, source, style, minResolution, maxResolution
        } as any);
        this.layer = vlayer
        map.addLayer(vlayer)
        event.preventDefault()
        event.stopPropagation()

        this.setbuttons()
    }
    do_hide() {
        this.setbuttons('hide')
        if (this.layer) {
            map.removeLayer(this.layer)
            this.layer.dispose()
            this.layer = null
        }
        this.setbuttons()
        event.preventDefault()
        event.stopPropagation()

    }

    do_drop(event: Event) {
        this.setbuttons('drop')
        this.do_hide()
        this.destroy()
        this.setbuttons()
        event.preventDefault()
        event.stopPropagation()
    }

    do_save(event: Event) {
        this.setbuttons('save')
        const array = this.geofile.getIndexBuffer()
        this.setbuttons()
        event.preventDefault()
        event.stopPropagation()
    }

    private createGeofile() {
        let geofile: Geofile = null
        const files = this.files
        switch (this.model.type) {
            case 'shp':
                const shp = files.find(f => f.name.endsWith('.shp'))
                const dbf = files.find(f => f.name.endsWith('.dbf'))
                geofile = dbf ? new Shapefile(shp.name, shp, dbf) : new Shapefile(shp.name, shp)
                break;
            case 'geojson':
                const gjs = files.find(f => f.name.endsWith('.geojson'))
                geofile = new Geojson(gjs.name, gjs)
                break
            case 'csv':
                const csv = files.find(f => f.name.endsWith('.csv'))
                geofile = new Csv(csv.name, csv, {
                    header: this.model.header,
                    lonlat: [this.model.lon, this.model.lat],
                    separator: this.model.separator,
                    skip: this.model.skip
                })
                break
        }
        this.geofile = geofile
    }

    onprogress = (p: { read: number, size: number, count: number }) => {
        if (p.count === 0) { this.start = Date.now() }
        this.model.count = p.count
        this.model.loaded = false
        this.model.rate = Math.floor((p.count * 1000) / (Date.now() - this.start))
        this.progress.max = this.model.size
        this.progress.value = p.read
    }
    defstyle(color: string) {
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
    setbuttons(processing?: string) {
        let names =['index','show','hide','save', 'drop']
        names.forEach(name => this.elem<HTMLInputElement>(name).disabled = true)
        switch (true) {
            case (!this.geofile) : names = ['index']; break
            case (!this.layer) : names = ['show','save','drop']; break
            default : names = ['hide','save','drop']; break
        }
        names.forEach(name => this.elem<HTMLInputElement>(name).disabled = false);
        if (processing) this.elem<HTMLInputElement>(processing).disabled = true
    }
}

const dropzone = new MVCDropzone()
document.body.appendChild(dropzone.fragment)

const map = new ol.Map({
    target: 'map',
    layers: [
        new ollayer.Tile({
            source: new olsource.OSM()
        })
    ],
    view: new ol.View({
        center: olproj.fromLonLat([2.920823, 50.549929]),
        zoom: 14
    })
});


const scale = new olcontrol.ScaleLine({
    units: 'metric',
    bar: true,
    steps: 4,
    text: true,
    minWidth: 140,
});

map.addControl(scale)

