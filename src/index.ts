import { Geofile,Shapefile,Csv,Geojson } from 'geolib'
import * as ol from 'ol'
import * as ollayer from 'ol/layer'
import * as olsource from 'ol/source'
import * as olproj from 'ol/proj'
import * as olextent from 'ol/extent'
import * as olstyle from 'ol/style'
import * as olformat from 'ol/format'
import * as olcontrol from 'ol/control'

let dropArea = document.getElementById('drop-area')
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
})

function preventDefaults(e: Event) {
    e.preventDefault()
    e.stopPropagation()
}
;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
})

;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
})

function highlight() {
    dropArea.classList.add('highlight')
}

function unhighlight() {
    dropArea.classList.remove('highlight')
}
dropArea.addEventListener('drop', handleDrop, false)

function handleDrop(e: DragEvent) {
    let droppedfiles = e.dataTransfer.files
    const files: File[] =[]
    for (let i=0;i < droppedfiles.length; i++) files.push(droppedfiles.item(i))
    const litems = files.map(file => `<li>file "${file.name}" dropped is ${file.size} bytes</li>`) 
    const ul = document.getElementById('filelist')
    ul.innerHTML = litems.join('')
    handleFiles(files)
}
let start = Date.now()
function onprogress(p: {read:number, size:number, count: number}) {
    if (p.count === 0) { start = Date.now()}
    const pelem = document.getElementById('progress')
    const percent = Math.floor(100 * p.read / p.size)
    pelem.innerHTML =`loaded ${p.count} features for ${percent}% of file [bytes:${p.read} size:${p.size}]<br/> throughput =${Math.floor((p.count * 1000) / (Date.now() -start))} o/s`
}
function handleFiles(files: File[]) {
    let geofile: Geofile = null
    for(const file of files) {
        const ext = file.name.replace(/^.*\./,'')
        switch (ext) {
            case 'shp': 
                const dbf = files.find(f => f.name.endsWith('.dbf'))
                geofile = dbf ? new Shapefile(file.name,file,dbf) : new Shapefile(file.name,file) 
                break;
            case 'geojson':
                geofile = new Geojson(file.name,file)
                break
            case 'csv':
                geofile = new Csv(file.name,file,{header:true,lonlat:['lon','lat'],separator:';' })
                break
        }
        if (geofile) break
    }
    if (geofile) {
        const data = document.getElementById('data')
        geofile.buildIndexes([], onprogress).then( _ => {
           data.innerHTML = `Loaded ${geofile.count} feature from ${geofile.name}`
           addToMap(geofile,map,0,10000,null)
        }).catch((e:Error) => {
            data.innerHTML = `Load error for ${geofile.name} : ${e.stack}`
        })
    }
}
const defstyle = [
    new olstyle.Style({
        image: new olstyle.Circle({
            fill: new olstyle.Fill({
                color: 'rgba(255,255,255,0.4)'
            }),
            stroke: new olstyle.Stroke({
                color: '#3399CC',
                width: 1.25
            }),
            radius: 5
        }),
        fill: new olstyle.Fill({
            color: 'rgba(255,255,255,0.4)'
        }),
        stroke: new olstyle.Stroke({
            color: '#3399CC',
            width: 1.25
        })
    })
];
function addToMap(geofile: Geofile, map: ol.Map, minscale:number, maxscale: number, style: olstyle.Style[]) {
    let last_extent = olextent.createEmpty();
    const format = new olformat.GeoJSON();
    /** default style definition */
    style = style || defstyle
    // we define a loader for vector source
    const loader = (extent: olextent.Extent, resolution: null, proj: olproj.ProjectionLike) => {
        if (olextent.equals(extent, last_extent)) return;
        last_extent = extent
        const projname:string = (proj as any).getCode()
        const scale = geofile.getScale(resolution, projname);
        extent = (proj === geofile.proj) ? extent : olproj.transformExtent(extent, proj, geofile.proj);
        if ((!maxscale || (maxscale && scale < maxscale)) && (!minscale || (minscale && scale >= minscale))) {
            geofile.bbox(extent, { targetProjection: projname })
                .then((features) => {
                source.clear(true);
                source.addFeatures(features.map(f => format.readFeature(f)));
            });
        } else {
            source.clear(true);
        }
    };
    const strategy = (extent: number[]) => { 
        if ((source as any).loadedExtentsRtree_) (source as any).loadedExtentsRtree_.clear();
        return [extent];
    }
    const minResolution = geofile.getResolution(minscale, map.getView().getProjection().getCode())
    const maxResolution = geofile.getResolution(maxscale, map.getView().getProjection().getCode())

    const source = new olsource.Vector({ useSpatialIndex: false, strategy, loader } as any);
    // layer created an added to map
    const vlayer = new ollayer.Vector({
        renderMode: 'image',visible: true,source, style, minResolution, maxResolution
    } as any);
    map.addLayer(vlayer);
}


const map = new ol.Map({
    target: 'map',
    layers: [
        new ollayer.Tile({
            source: new olsource.OSM()
        })
    ],
    view: new ol.View({
        center: olproj.fromLonLat([2.920823,50.549929]),
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

