import "./components"
import * as gl from "./components"
import * as ol from 'ol'
import * as ollayer from 'ol/layer'
import * as olsource from 'ol/source'
import * as olproj from 'ol/proj'
import * as olcontrol from 'ol/control'

// first create a simple OSM map 
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

// const cvsoptions = document.querySelector('gl-csvoptions')
// cvsoptions.addEventListener('change',(event: CustomEvent) => {
//     console.log(event.detail.value)
// })

// const styler = document.querySelector('gl-styler')
// styler.addEventListener('change',(event: CustomEvent) => {
//     console.log(event.detail.value)
// })

//const loader = document.querySelector('gl-loader') as gl.glGeofileLoader

//add a drop zone
const dropzone = document.getElementById('dropzone')
dropzone.addEventListener('change',(event: CustomEvent) => {
    const fileslist: any[] = event.detail.files
    //loader.files = fileslist[0]
    // loader.csvoptions = {separator:';',skip:0,header:true,lon:'lon',lat:'lat'}
    // loader.index(new CustomEvent('change'))
    for(const files of fileslist) {
        const gfviewer = document.createElement('gl-viewer') as gl.glGeofileViewer
        document.body.appendChild(gfviewer)
        gfviewer.files = files
        gfviewer.map = map
    }
})


