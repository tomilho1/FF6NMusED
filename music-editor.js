const fs = require('fs')
const instrumentMap = new Map(Object.entries(require('./instrumentMap.json')))
const reverseMap = new Map(Object.entries(require('./reverseInstrumentMap.json')))

const { toHex, readLE } = require('./hex-utils')
const parseTrack = require('./parseTrack')

class MusicEditor {
    static ROM

    get instance() {
        return this
    }

    songsInTotal = {
        address: 0,
        instance: this.instance,
        set binary(data) {
            this._binary = data;
            this.content = data[0];
        },
        get binary() {
            return this._binary
        }
    }

    trackPointers = {
        address: 0,
        instance: this.instance,
        binary: 0,
        updateContent() {
            let pointers = []
            for (let i = 0; i < this.instance.songsInTotal.content * 0x03; i = i + 0x03) {
                pointers.push(this.binary.subarray(i, i + 0x03))
            }
            this.content = pointers.map((offset) => {
                return readLE(offset)
            });
        }
    }

    instrumentSets = {
        address: 0,
        instance: this.instance,
        binary: 0,
        updateContent() {
            let sets = []
            for (let i = 0; i < this.instance.songsInTotal.content; i++) {
                let currentSong = this.binary.subarray(i * 0x20, i * 0x20 + 0x20)
                let currentSet = []
                for (let i = 0; i < 0x20; i = i + 2) {
                    if (currentSong[i] !== 0x00) {
                        let instrumentId = toHex(currentSong[i])
                        currentSet.push(instrumentMap.get(instrumentId) + ` ($${instrumentId})`)
                    }
                }
                sets.push(currentSet)
            }
            this.content = sets
        }
    }

    constructor(
        romPath = __dirname + '/ff3.smc',
        ptr_songsInTotal = 0x053C5E,
        ptr_trackPointers = 0x053E96,
        ptr_instrumentSets = 0x053F95,
    ) {
        this.ROM = fs.readFileSync(romPath)

        this.songsInTotal.address = ptr_songsInTotal
        this.songsInTotal.binary = this.ROM.subarray(
            ptr_songsInTotal,
            ptr_songsInTotal + 1
        )

        this.trackPointers.address = ptr_trackPointers
        this.trackPointers.binary = this.ROM.subarray(
            ptr_trackPointers,
            ptr_trackPointers + (this.songsInTotal.content * 0x03)
        )
        this.trackPointers.updateContent()

        this.instrumentSets.address = ptr_instrumentSets
        this.instrumentSets.binary = this.ROM.subarray(
            ptr_instrumentSets,
            ptr_instrumentSets + (this.songsInTotal.content * 0x20)
        )
        this.instrumentSets.updateContent()
    }

    validateSongId(songId) {
        if (typeof songId !== 'number' || songId < 0 || songId >= this.songsInTotal.content) {
            throw new Error("Invalid song index.")
        }
    }

    getSongContents(songId) {
        this.validateSongId(songId)
        return {
            index: '$' + toHex(songId),
            trackLocation: toHex(this.trackPointers.content[songId] - 0xC00000),
            length: '$' + toHex(readLE(this.ROM.subarray(
                this.trackPointers.content[songId],
                this.trackPointers.content[songId] + 2))),
            instrumentsLocation: toHex(this.instrumentSets.address + 0x20 * songId),
            instrumentSet: this.instrumentSets.content[songId]
        }
    }

    ripTrack(songId) {
        this.validateSongId(songId)
        let trackLocation = this.trackPointers.content[songId] - 0xC00000
        // First two bytes of a track stores it's length:
        let trackLength = readLE(this.ROM.subarray(trackLocation, trackLocation + 2))
        // + 2 at the end because those first 2 bytes don't count themselves:
        return this.ROM.subarray(trackLocation, trackLocation + trackLength + 2)
    }

    ripInstrumentSet(songId) {
        this.validateSongId(songId)
        return this.instrumentSets.binary.subarray(songId * 0x20, songId * 0x20 + 0x20)
    }

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
            throw new Error("Invalid instrument index.")
        }

        let newSet = this.instrumentSets.binary.subarray(songId * 0x20, songId * 0x20 + 0x20)

        for (let i = 0, i2 = 0; i < 0x20; i = i + 2) {
            if (newSet[i] === oldInstrument) {
                newSet[i] = newInstrument
                this.instrumentSets.updateContent()
                console.log(instrumentMap.get(toHex(oldInstrument)), 'was replaced by', instrumentMap.get(toHex(newInstrument)))
                return newSet
            }
        }
    }

    parseTrack(songId, songName = "Unnamed", txtPath = `${__dirname}/${songName}.txt`) {
        this.validateSongId(songId)

        let trackLocation = this.trackPointers.content[songId] - 0xC00000
        let trackData = this.ripTrack(songId)
        let instrumentSet = this.ripInstrumentSet(songId)

        parseTrack(trackLocation, songName, trackData, txtPath, instrumentSet, instrumentMap)
        console.log(songName, "was successfully written.",)
    }

    compile(romPath) {
        fs.writeFileSync(romPath, this.ROM)
    }
}

let FF6NMusED = new MusicEditor(__dirname + '/ff3.smc');

console.log(FF6NMusED.getSongContents(0x02))

FF6NMusED.replaceInstrument(0x02, 'church organ', 'choir')
FF6NMusED.replaceInstrument(0x02, 'piano', 'glockenspiel')

FF6NMusED.compile('./modifiedRom.smc')