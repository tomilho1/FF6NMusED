const fs = require('fs')

function toHex(number, options = {}) {
    if (options.HIROMtoNormal) {
        number = number - 0xC00000
    }

    if (options.NormalToHIROM) {
        number = number + 0xC00000
    }

    number = number.toString(16).toUpperCase()
    if (number.length % 2 !== 0) {
        number = `0${number}`
    }
    return number
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

        this.songsInTotal = this.ROM[ptr_songsInTotal]

        this.songPointers = (() => {
            let songPointers = this.ROM.subarray(
                ptr_songPointers,
                ptr_songPointers + (this.songsInTotal * 0x03))
            {
                let newArray = []
                for (let i = 0; i < this.songsInTotal * 3; i = i + 0x03) {
                    newArray.push(songPointers.subarray(i, i + 0x03))
                }

                newArray = newArray.map((offset) => {
                    return readLE(offset)
                })

                newArray = newArray.map((num) => { return toHex(num, {HIROMtoNormal: true})})
                return newArray
            }
        })()

        this.instrumentSet = (() => {
            let instrumentsData = this.ROM.subarray(
                ptr_instrumentSets,
                ptr_instrumentSets + (this.songsInTotal * 0x20))

            let instrumentSets = []

            for (let i = 0; i < this.songsInTotal; i++) {
                let currentSong = instrumentsData.subarray(i * 0x20, i * 0x20 + 0x20)
                let currentSet = []
                for (let i = 0; i < 0x20; i = i + 2) {
                    if (currentSong[i] !== 0x00) {
                        let index = currentSong[i].toString(16).toUpperCase()

                        if (index.length < 2) {
                            index = `0${index}`
                        }
                        currentSet.push(instrumentMap.get(index))
                    }
                }
                instrumentSets.push(currentSet)
            }
            return instrumentSets
        })()

        this.pointer = {
            songsInTotal: ptr_songsInTotal,
            songPointers: ptr_songPointers,
            instrumentSets: ptr_instrumentSets
        }
    }

    getSongLibrary() {
        let newArray = []
        for (let i = 0; i < this.songsInTotal; i++) {
            newArray.push({
                index: toHex(i),
                location: this.songPointers[i],
                length: toHex(readLE(this.ROM.subarray(parseInt(this.songPointers[i], 16), parseInt(this.songPointers[i], 16) + 2))),
                instrumentsLocation: toHex(this.pointer.instrumentSets),
                instrumentSet: this.instrumentSet[i]
            })
        }
        return newArray
    }

    ripTrackData(songIndex) {
        let songLocation = this.songPointers[songIndex]
        let songLength = toHex(readLE(this.ROM.subarray(parseInt(this.songPointers[songIndex], 16), parseInt(this.songPointers[songIndex], 16) + 2)))

        return this.ROM.subarray(parseInt(songLocation, 16), parseInt(songLocation, 16) + parseInt(songLength, 16) + 2)
    }
}