const fs = require('fs')
instrumentMap = new Map(Object.entries(require('./instrumentMap.json')))

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

                newArray = newArray.map((num) => { return toHex(num, { HIROMtoNormal: true }) })
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
                        currentSet.push(instrumentMap.get(index) + ` (${index})`)
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

    /**
     * @param {*} songId If left blank, returns all songs in the ROM. 
     */
    getSongLibrary(songId = undefined) {
        if (typeof songId === 'number') {
            return {
                index: toHex(songId),
                location: this.songPointers[songId],
                length: toHex(readLE(this.ROM.subarray(parseInt(this.songPointers[songId], 16), parseInt(this.songPointers[songId], 16) + 2))),
                instrumentsLocation: toHex(this.pointer.instrumentSets + 0x20 * songId),
                instrumentSet: this.instrumentSet[songId]
            }
        }

        let newArray = []
        for (let i = 0; i < this.songsInTotal; i++) {
            newArray.push({
                index: toHex(i),
                location: this.songPointers[i],
                length: toHex(readLE(this.ROM.subarray(parseInt(this.songPointers[i], 16), parseInt(this.songPointers[i], 16) + 2))),
                instrumentsLocation: toHex(this.pointer.instrumentSets + 0x20 * i),
                instrumentSet: this.instrumentSet[i]
            })
        }
        return newArray
    }

    /**
     * Returns a song's track (Buffer).
     */
    getTrack(songId) {
        let songLocation = this.songPointers[songId]
        let songLength = toHex(readLE(this.ROM.subarray(parseInt(this.songPointers[songId], 16), parseInt(this.songPointers[songId], 16) + 2)))

        return this.ROM.subarray(parseInt(songLocation, 16), parseInt(songLocation, 16) + parseInt(songLength, 16) + 2)
    }

    /**
     * Replaces **one** instrument from a track.
     * * songId must receive a number.
     * * Instrument paramethers can be either id **or** name of the desired instrument.
     */
    replaceInstrument(songId, oldInstrument, newInstrument) {
        let oldInstrumentName
        let newInstrumentName

        // Converts an instrument's name to it's index
        if (typeof oldInstrument === 'string' || typeof newInstrument === 'string') {
            let reverseMap = new Map()
            Array.from(instrumentMap).forEach(pair => {
                reverseMap.set(pair[1].toLowerCase(), pair[0])
            })
            oldInstrument = parseInt(reverseMap.get(oldInstrument.toLowerCase()), 16)
            newInstrument = parseInt(reverseMap.get(newInstrument.toLowerCase()), 16)
        }

        oldInstrumentName = instrumentMap.get(toHex(oldInstrument))
        newInstrumentName = instrumentMap.get(toHex(newInstrument))

        if (oldInstrumentName === undefined || newInstrumentName === undefined) {
            console.log("Instrument is not valid")
            return
        }

        if(songId < 0 || songId > this.songsInTotal) {
            console.log('Song index is not valid')
            return
        }

        let newSet = this.ROM.subarray(
            this.pointer.instrumentSets + (0x20 * songId),
            this.pointer.instrumentSets + (0x20 * songId) + 0x20
        )

        for (let i = 0, i2 = 0; i < 0x20; i = i + 2) {
            if (newSet[i] === 0x00) {
                continue
            }
            if (newSet[i] === oldInstrument) {
                newSet[i] = newInstrument

                this.instrumentSet[songId][i2] = instrumentMap.get(toHex(newInstrument)) + ` (${toHex(newInstrument)})`
                console.log(instrumentMap.get(toHex(oldInstrument)), 'was replaced by', instrumentMap.get(toHex(newInstrument)))

                return newSet
            }
            i2++
        }
    }

    compile(romPath) {
        fs.writeFileSync(romPath, this.ROM)
    }
}

let a = new SongHandler()

console.log(a.replaceInstrument(2, 'church organ', 'choir'))
console.log(a.replaceInstrument(2, 'piano', 'glockenspiel'))

a.compile(__dirname + '/ffcity.smc')

console.log(a.getSongLibrary(2))