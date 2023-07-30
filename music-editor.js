const fs = require('fs')
const instrumentMap = new Map(Object.entries(require('./instrumentMap.json')))
const reverseMap = new Map(Object.entries(require('./reverseInstrumentMap.json')))

const {toHex, readLE} = require('./hex-utils')
const parseTrack = require('./parseTrack')

class MusicEditor {
    static ROM

    constructor(
        romPath = __dirname + '/ff3.smc',
        ptr_songsInTotal = 0x053C5E,
        ptr_songPointers = 0x053E96,
        ptr_instrumentSets = 0x053F95,
    ) {
        this.ROM = fs.readFileSync(romPath)

        this.songsInTotal = {
            address: ptr_songsInTotal,
            content: this.ROM[ptr_songsInTotal],
            binary: this.ROM.subarray(ptr_songsInTotal, ptr_songsInTotal + 1)
        }

        this.songPointers = (() => {
            let pointersData = this.ROM.subarray(
                ptr_songPointers,
                ptr_songPointers + (this.songsInTotal.content * 0x03))
            {
                let newArray = []
                for (let i = 0; i < this.songsInTotal.content * 3; i = i + 0x03) {
                    newArray.push(pointersData.subarray(i, i + 0x03))
                }
                newArray = newArray.map((offset) => {
                    return readLE(offset)
                })

                newArray = newArray.map((num) => { return toHex(num, { HIROMtoNormal: true }) })
                return {
                    address: ptr_songPointers,
                    content: newArray,
                    binary: pointersData
                }
            }
        })()

        this.instrumentSets = (() => {
            let instrumentsData = this.ROM.subarray(
                ptr_instrumentSets,
                ptr_instrumentSets + (this.songsInTotal.content * 0x20))

            let instrumentSets = []

            for (let i = 0; i < this.songsInTotal.content; i++) {
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
            return {
                address: ptr_instrumentSets,
                content: instrumentSets,
                binary: instrumentsData
            }
        })()
    }

    validateSongId (songId) {
        if (songId < 0 || songId >= this.songsInTotal.content) {
            throw new Error("Invalid song index.")
        }
    }

    /**
     * @param {*} songId If left blank, returns all songs in the ROM. 
     */
    getSongInfo(songId = undefined) {
        this.validateSongId(songId)
        if (typeof songId === 'number') {
            return {
                index: toHex(songId),
                location: this.songPointers.content[songId],
                length: toHex(readLE(this.ROM.subarray(parseInt(this.songPointers.content[songId], 16), parseInt(this.songPointers.content[songId], 16) + 2))),
                instrumentsLocation: toHex(this.instrumentSets.address + 0x20 * songId),
                instrumentSet: this.instrumentSets.content[songId]
            }
        }

        let newArray = []
        for (let i = 0; i < this.songsInTotal.content; i++) {
            newArray.push({
                index: toHex(i),
                location: this.songPointers.content[i],
                length: toHex(readLE(this.ROM.subarray(parseInt(this.songPointers.content[i], 16), parseInt(this.songPointers.content[i], 16) + 2))),
                instrumentsLocation: toHex(this.instrumentSets.address + 0x20 * i),
                instrumentSet: this.instrumentSets.content[i]
            })
        }
        return newArray
    }

    /**
     * Returns a song's track (Buffer).
     */
    ripTrack(songId) {
        this.validateSongId(songId)

        let songLocation = readLE(this.songPointers.binary.subarray(songId * 0x03, songId * 0x03 + 0x03)) - 0xC00000
        // First two bytes of a track stores it's length:
        let songLength = readLE(this.ROM.subarray(songLocation, songLocation + 2))
        // + 2 at the end because those first 2 bytes does not count themselves:
        return this.ROM.subarray(songLocation, songLocation + songLength + 2) 
    }

    /**
    * Replaces **one** instrument from a track.
    * * songId must receive a number.
    * * Instrument paramethers can be either id **or** name of the desired instrument.
    */
    replaceInstrument(songId, oldInstrument, newInstrument) {
        this.validateSongId(songId)

        let oldInstrumentName
        let newInstrumentName

        // Converts an instrument's name to it's index
        if (typeof oldInstrument === 'string' || typeof newInstrument === 'string') {
            oldInstrument = parseInt(reverseMap.get(oldInstrument.toLowerCase()), 16)
            newInstrument = parseInt(reverseMap.get(newInstrument.toLowerCase()), 16)
        }

        oldInstrumentName = instrumentMap.get(toHex(oldInstrument))
        newInstrumentName = instrumentMap.get(toHex(newInstrument))

        if (oldInstrumentName === undefined || newInstrumentName === undefined) {
            console.log("Instrument is not valid")
            return
        }

        let newSet = this.instrumentSets.binary.subarray(songId * 0x20, songId * 0x20 + 0x20)

        for (let i = 0, i2 = 0; i < 0x20; i = i + 2) {
            if (newSet[i] === 0x00) {
                continue
            }
            if (newSet[i] === oldInstrument) {
                newSet[i] = newInstrument

                this.instrumentSets.content[songId][i2] = instrumentMap.get(toHex(newInstrument)) + ` (${toHex(newInstrument)})`
                console.log(instrumentMap.get(toHex(oldInstrument)), 'was replaced by', instrumentMap.get(toHex(newInstrument)))

                return newSet
            }
            i2++
        }
    }

    /**
     * Generates a text file containing the script of a track in the ROM. 
     */
    parseTrack(songId, songName = "Unnamed", txtPath = `${__dirname}/${songName}.txt`) {
        this.validateSongId(songId)

        let songLocation = readLE(this.songPointers.binary.subarray(songId * 0x03, songId * 0x03 + 0x03)) - 0xC00000
        let trackData = this.ripTrack(songId)
        let instrumentSet = this.instrumentSets.binary.subarray(songId * 0x20, songId * 0x20 + 0x20)

        parseTrack(songLocation, songName, trackData, txtPath, instrumentSet, instrumentMap)
        console.log(songName, "was successfully written.",)
    }

    compile(romPath) {
        fs.writeFileSync(romPath, this.ROM)
    }
}

let a = new MusicEditor(__dirname + '/ff3.smc');
console.log(a.ripTrack(0x55))