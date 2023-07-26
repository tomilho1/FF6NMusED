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
        ptr_songOffsets = 0x053E96,
        ptr_snstrumentSets = 0x053F95,
        ptr_songScores = 0x085C7A) {

        MusicMap.ROM = fs.readFileSync(romPath)
    }

}

console.log(new MusicMap())