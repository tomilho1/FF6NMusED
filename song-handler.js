const fs = require('fs')
const ROM = fs.readFileSync(__dirname + '/ff3.smc')

function toHex(offset, options = {}) {
    if (options.HIROMtoNormal) {
        offset = offset - 0xC00000
    }

    if (options.NormalToHIROM) {
        offset = offset + 0xC00000
    }

    offset = offset.toString(16).toUpperCase()

    if (offset.length % 2 !== 0) {
        offset = `0${offset}`
    }

    return offset
}

function readLE(buffer) {
    let sum = 0;
    for (let i = buffer.byteLength - 1; i >= 0; i--) {
        sum = (sum << 8) + buffer[i]
    }
    return sum
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

                console.log(newArray[0])

                newArray = newArray.map((offset) => {
                    return readLE(offset)
                })

                console.log(newArray[0])

                newArray = newArray.map((num) => { return toHex(num, {HIROMtoNormal: true})})
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