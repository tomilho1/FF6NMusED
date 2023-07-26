const fs = require('fs')
const ROM = fs.readFileSync(__dirname + '/ff3.smc')

function toNormalOffset(offset) {
    switch (offset.slice(0, 1)) {
        case "C":
            return offset.replace("C", "0")
        case "D":
            return offset.replace("D", "1")
        case "E":
            return offset.replace("E", "2")
        default:
            return offset
    }
}

instrumentMap = new Map(Object.entries(require('./intrumentMap.json')))

const songsInTotal = ROM[0x053C5E]

let songPointers = ROM.subarray(0x053E96, 0x053E96 + (songsInTotal * 0x03))
{
    let newArray = []
    for (let i = 0; i < songsInTotal * 3; i = i + 0x03) {
        newArray.push(songPointers.subarray(i, i + 0x03))
    }
    newArray = newArray.map((offset) => {
        return offset = (offset[0] | (offset[1] << 8) | (offset[2] << 16))
    })
    newArray = newArray.map((offset) => {
        return toNormalOffset(offset.toString(16).toUpperCase())
    })
    songPointers = newArray
}

let songInstruments = ROM.subarray(0x053F95, 0x053F95 + (songsInTotal * 0x20))


let songMap = []

for (let i = 0; i < songsInTotal; i++) {
    let songIdx = i.toString(16).toLocaleUpperCase();
    if (songIdx.length < 2) { songIdx = `0${songIdx}` }
    else { songIdx = `${songIdx}` }

    let instrumentsData = songInstruments.subarray(i * 0x20, i*0x20 + 0x020)

    let songLocation = songPointers[i]
    let intrumentsLocation = songInstruments[i]

    let instrumentSet = []

    for (let i = 0; i < instrumentsData.length; i = i + 2) {
        if (instrumentsData[i] !== 0x00) {
            let index = instrumentsData[i].toString(16).toUpperCase()

            if (index.length < 2) {
                index = `0${index}`
            }

            instrumentSet.push(instrumentMap.get(index))
        }
    }

    songMap.push({
        index: songIdx,
        songLocation: songLocation,
        instrumentLocation: intrumentsLocation,
        instruments: instrumentSet
    })
}

console.log(songMap)