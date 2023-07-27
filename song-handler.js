const fs = require('fs')
const { off } = require('process')
const ROM = fs.readFileSync(__dirname + '/ff3.smc')

function toHex(offset, mode = 'default') {
    if (mode === 'HIROMtoNormal') {
        offset = offset - 0xC00000
    }

    if (mode === 'NormalToHIROM') {
        offset = offset + 0xC00000
    }

    offset = offset.toString(16).toUpperCase()

    if (offset.length % 2 !== 0) {
        offset = `0${offset}`
    }

    return offset
}

instrumentMap = new Map(Object.entries(require('./intrumentMap.json')))

class SongHandler {
    static ROM

    constructor(
        romPath = __dirname + '/ff3.smc',
        ptr_songsInTotal = 0x053C5E,
        ptr_songPointers = 0x053E96,
        ptr_instrumentSets = 0x053F95,
    ) {
        this.ROM = fs.readFileSync(romPath)

        this.songsInTotal = ROM[ptr_songsInTotal]

        this.songPointers = (() => {
            let songPointers = ROM.subarray(
                ptr_songPointers,
                ptr_songPointers + (this.songsInTotal * 0x03))
            {
                let newArray = []
                for (let i = 0; i < this.songsInTotal * 3; i = i + 0x03) {
                    newArray.push(songPointers.subarray(i, i + 0x03))
                }
                newArray = newArray.map((offset) => {
                    return offset = (offset[0] | (offset[1] << 8) | (offset[2] << 16))
                })
                newArray = newArray.map((num) => { return toHex(num, 'HIROMtoNormal') })
                return newArray
            }
        })()

        this.instrumentSet = (() => {
            let instrumentsData = ROM.subarray(
                ptr_instrumentSets,
                ptr_instrumentSets + (this.songsInTotal * 0x20))

            let instrumentSets = []

            for (let i = 0; i < this.songsInTotal; i++) {
                let currentSong = instrumentsData.subarray(i * 0x20, i * 0x20 + 0x20)
                let a = []
                for (let i = 0; i < 0x20; i = i + 2) {
                    if (currentSong[i] !== 0x00) {
                        let index = currentSong[i].toString(16).toUpperCase()

                        if (index.length < 2) {
                            index = `0${index}`
                        }
                        a.push(instrumentMap.get(index))
                    }
                }
                instrumentSets.push(a)
            }
            return instrumentSets
        })()

        this.pointer = {
            songsInTotal: ptr_songsInTotal,
            songPointers: ptr_songPointers,
            instrumentSets: ptr_instrumentSets
        }
    }

    getMap() {
        let newArray = []
        for (let i = 0; i < this.songsInTotal; i++) {
            newArray.push({
                index: `$${toHex(i)}`,
                location: this.songPointers[i],
                instrumentsLocation: toHex(this.pointer.instrumentSets),
                instrumentSet: this.instrumentSet[i]
            })
        }
        return newArray
    }
}

console.log(new SongHandler().getMap())