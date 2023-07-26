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

pointer = {
    songsInTotal: 0x053C5E,
    songPointers: 0x053E96,
    instrumentSets: 0x053F95,
    songScores: 0x085C7A
}

class MusicMap {
    static ROM

    constructor(
        romPath = __dirname + '/ff3.smc',
        ptr_songsInTotal = 0x053C5E,
        ptr_songPointers = 0x053E96,
        ptr_snstrumentSets = 0x053F95,
        ptr_songScores = 0x085C7A) {

        this.ROM = fs.readFileSync(romPath)

        this.songsInTotal = {
            address: ptr_songsInTotal,
            data: ROM[ptr_songsInTotal]
        }

        this.songPointers = {
            address: ptr_songPointers,
            data: (() => {
                let songPointers = ROM.subarray(ptr_songPointers, ptr_songPointers + (this.songsInTotal.data * 0x03))
                {
                    let newArray = []
                    for (let i = 0; i < this.songsInTotal.data * 3; i = i + 0x03) {
                        newArray.push(songPointers.subarray(i, i + 0x03))
                    }
                    newArray = newArray.map((offset) => {
                        return offset = (offset[0] | (offset[1] << 8) | (offset[2] << 16))
                    })
                    newArray = newArray.map((offset) => {
                        return toNormalOffset(offset.toString(16).toUpperCase())
                    })
                    return newArray
                }
                })()
        }
    }
}

console.log(new MusicMap().songPointers)