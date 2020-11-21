import { Calculator } from './calculator'
console.log(`Hello World from index.ts ! total =${ (new Calculator()).add(1,1)}`);

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
    let files = e.dataTransfer.files
    const ul = document.getElementById('filelist')
    const litems = [] 
    files
    for (let i=0;i < files.length; i++) {
        const file = files.item(i) 
        litems.push(`<li>file "${file.name}" dropped is ${file.size} bytes</li>`)
    }
    ul.innerHTML = litems.join('')
    // handleFiles([...files])
}
// function handleFiles(files) {
//     for(const file of files) {
//         const ext = file.name.replace(/^.*\./,'')
//         let geofile = null
//         switch (ext) {
//             case 'shp': 
//                 const dbf = files.find(f => f.name.endsWith('.dbf'))
//                 geofile = dbf ? new Shapefile(f.name,file,dbf) : new Shapefile(f.name,file) 
//                 break;
//             case 'geojson':break
//                 geofile = new Geojson(f.name,file)
//                 break
//             case 'csv':break
//                 geofile = new Csv(f.name,file)
//                 break
//         }
//         if (geofile) break
//     }
//     if (geofile) {
//         const data = document.getElementById('data')
//         geofile.buildIndexes([]).then( _ => {
//            data.innerHTML = `Loaded ${geofile.count} feature from ${geofile.name}`
//         }).catch(e => {
//             data.innerHTML = `Load error for ${geofile.name} : ${err.stack}`
//         })
//     }
// }