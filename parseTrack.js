const fs = require('fs')
const {toHex, readLE} = require('./hex-utils')

function parseTrack (
    trackAddress,
    songName,
    track,
    txtPath,
    instrumentData,
    instrumentMap
    ) {
    
    /**
     * Pointers stored inside tracks are 2 bytes only (1 bank range). It is possible, though, that a track,
     * like the Battle Theme, starts at bank C8 and ends at bank C9, meaning that they occupy 2 banks instead.
     * That means that just reading the pointers in the track is not enough, we need to further verify
     * if the pointer is actually pointing to an address that is **in the range of the track**. Note that
     * this correction is only rarely neccessary (in a vanilla ROM, it is only needed in the Battle Theme). Also,
     * tracks can't be larger than 0xFFFF bytes anyway.
     */
    function readTrackPointer(pointer) {
        pointer = readLE(pointer) + (trackAddress & 0xFF0000)
    
        if (pointer < trackAddress) {
            pointer = pointer + 0x010000
        } else if (pointer > lastByteAddress) {
            pointer = pointer - 0x010000
        }

        return pointer
    }

    let instrumentSet = []
    for (let i = 0; i < instrumentData.length; i = i + 2) {
        instrumentSet.push(instrumentMap.get(toHex(instrumentData[i])))
    }

    let length = readLE(track.subarray(0x00, 0x02))
    let lastByteAddress = trackAddress + length + 1
    
    let address = {
        channel1: readTrackPointer(track.subarray(0x06, 0x08)) - trackAddress,
        channel2: readTrackPointer(track.subarray(0x08, 0x0A)) - trackAddress,
        channel3: readTrackPointer(track.subarray(0x0A, 0x0C)) - trackAddress,
        channel4: readTrackPointer(track.subarray(0x0C, 0x0E)) - trackAddress,
    
        channel5: readTrackPointer(track.subarray(0x0E, 0x10)) - trackAddress,
        channel6: readTrackPointer(track.subarray(0x10, 0x12)) - trackAddress,
        channel7: readTrackPointer(track.subarray(0x12, 0x14)) - trackAddress,
        channel8: readTrackPointer(track.subarray(0x14, 0x16)) - trackAddress
    }
    
    function C4() {
        gInc += 1
        return (`Set volume to ${track[gInc]}`)
    }
    
    function C5() {
        gInc += 2
        return (`Set volume to ${track[gInc]} over [${lenghtMap.get(track[gInc - 1])}]`)
    }
    
    function C6() {
        gInc += 1
        return ('Set pan to ' + track[gInc])
    }
    
    function C7() {
        gInc += 2
        return (`Set pan to ${track[gInc]} over [${lenghtMap.get(track[gInc - 1])}]`)
    }
    
    function C8() {
        gInc += 2
        return ('Change pitch by ' + track[gInc] + ' over')
    }
    
    function C9() {
        gInc += 3
        return (`Enable vibrato (delay: ${track[gInc - 2]}, duration: ${track[gInc - 1]} amplitude: ${track[gInc]})`)
    }
    
    function CA() {
        return (`Disable vibrato`)
    }
    
    function CB() {
        gInc += 3
        return (`Enable tremolo (delay: ${track[gInc - 2]}, cycle duration: ${track[gInc - 1]} amplitude: ${track[gInc]}`)
    }
    
    function CC() {
        return (`Disable tremolo`)
    }
    
    function CD() {
        gInc += 2
        return (`Enable pansweep (delay: ${track[gInc - 1]}, cycle duration: ${track[gInc]}`)
    }
    
    function CE() {
        return (`Disable pansweep`)
    }
    
    function CF() {
        gInc += 1
        return (`Set noise clock to ${track[gInc]}`)
    }
    
    function D0() {
        return (`Enable noise`)
    }
    
    function D1() {
        return (`Disable noise`)
    }
    
    function D2() {
        return (`Enable pitch modulation`)
    }
    
    function D3() {
        return (`Disable pitch modulation`)
    }
    
    function D4() {
        return (`Enable echo`)
    }
    
    function D5() {
        return (`Disable echo`)
    }
    
    function D6() {
        gInc += 1
        return (`Set octave to ${track[gInc]}`)
    }
    
    function D7() {
        return (`Increment octave`)
    }
    
    function D8() {
        return (`Decrease octave`)
    }
    
    function D9() {
        gInc += 1
        return (`Set transposition to ${track[gInc]}`)
    }
    
    function DA() {
        gInc += 1
        return (`Add transposition by ${track[gInc]}`)
    }
    
    function DB() {
        gInc += 1
        return (`Set detuning to ${track[gInc]}`)
    }
    
    function DC() {
        gInc += 1
        if (track[gInc] >= 0x20) {
        return (`Set instrument to ${instrumentSet[track[gInc] - 0x20]}`)
    } else 
        return (`Set instrument to sound effect $${toHex(track[gInc])}`)
    }
    
    function DD() {
        gInc += 1
        return (`Set ADSR attack to ${track[gInc]} (0-15)`)
    }
    
    function DE() {
        gInc += 1
        return (`Set ADSR decay to ${track[gInc]} (0-7)`)
    }
    
    function DF() {
        gInc += 1
        return (`Set ADSR sustain to ${track[gInc]} (0-7)`)
    }
    
    function E0() {
        gInc += 1
        return (`Set ADSR release to ${track[gInc]} (0-31)`)
    }
    
    function E1() {
        return (`Set ADSR values to default`)
    }
    
    function E2() {
        gInc += 1
        loopNest += 1
        return (`Repeat ${track[gInc] + 1} times`)
    }
    
    function E3() {
        loopNest -= 1
        return (`End block of repetition`)
    }
    
    function E4() {
        return (`Enable slur`)
    }
    
    function E5() {
        return (`Disable slur`)
    }
    
    function E6() {
        return (`Enable drum roll`)
    }
    
    function E7() {
        return (`Disable drum roll`)
    }
    
    function E8() {
        gInc += 1
        return (`Add ${track[gInc]} to note duration`)
    }
    
    function E9() {
        gInc += 1
        return (`Play sound effect ${track[gInc]} (voice A)`)
    }
    
    function EA() {
        gInc += 1
        return (`Play sound effect ${track[gInc]} (voice B)`)
    }
    
    function EB() {
        return (`End script`)
    }
    
    function EC() {
        return (`End script`)
    }
    
    function ED() {
        return (`End script`)
    }
    
    function EE() {
        return (`End script`)
    }
    
    function EF() {
        return (`End script`)
    }
    
    function F0() {
        gInc += 1
        return (`Set tempo to ${track[gInc]}`)
    }
    
    function F1() {
        gInc += 2
        return (`Set tempo to ${track[gInc - 1]} over ${track[gInc]}`)
    }
    
    function F2() {
        gInc += 1
        return (`Set echo volume to ${track[gInc]}`)
    }
    
    function F3() {
        gInc += 2
        return (`Set echo volume to ${track[gInc - 1]} over ${track[gInc]}`)
    }
    
    function F4() {
        gInc += 1
        return (`Set song volume to ${track[gInc]}`)
    }
    
    function F5() {
        gInc += 3
        return (`Branches to ${toHex(readTrackPointer(Buffer.from([track[gInc - 1], track[gInc]])))} after ${track[gInc - 2]} repetitions`)
    }
    
    function F6() {
        gInc += 2
        return (`Branches to ${toHex(readTrackPointer(Buffer.from([track[gInc - 1], track[gInc]])))}`)
    }
    
    function F7() {
        gInc += 2
        return (`Set echo feedback to ${track[gInc]} over ${track[gInc - 1]} frames`)
    }
    
    function F8() {
        gInc += 2
        return (`Set filter's (??) to ${track[gInc]} and (??) to ${track[gInc - 1]}`)
    }
    
    function F9() {
        return (`Increment output code`)
    }
    
    function FA() {
        return (`Clear output code`)
    }
    
    function FB() {
        return (`Ignore song volume`)
    }
    
    function FC() {
        gInc += 2
        return (`Conditionally branches to`)
    }
    
    function FD() {
        return (`End script`)
    }
    
    function FE() {
        return (`End script`)
    }
    
    function FF() {
        return (`End script`)
    }
    
    noteDurations = ['1/1', '1/2', '1/3', '3/8', '1/4', '1/6', '3/16', '1/8', '1/12', '1/16', '1/24', '1/32', '1/48', '1/64']
    notePitches = ['C', 'C#', 'D', "Eb", 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Tie', 'Rest']

    const lenghtMap = new Map()
    lenghtMap.set(0xC0, noteDurations[0])
    lenghtMap.set(0x60, noteDurations[1])
    lenghtMap.set(0x40, noteDurations[2])
    lenghtMap.set(0x48, noteDurations[3])
    lenghtMap.set(0x30, noteDurations[4])
    lenghtMap.set(0x20, noteDurations[5])
    lenghtMap.set(0x24, noteDurations[6])
    lenghtMap.set(0x18, noteDurations[7])
    lenghtMap.set(0x10, noteDurations[8])
    lenghtMap.set(0x0C, noteDurations[9])
    lenghtMap.set(0x08, noteDurations[10])
    lenghtMap.set(0x06, noteDurations[11])
    lenghtMap.set(0x04, noteDurations[12])
    lenghtMap.set(0x03, noteDurations[13])

    effects = [
        C4, C5, C6, C7, C8, C9, CA, CB, CC, CD, CE, CF, D0, D1, D2, D3,
        D4, D5, D6, D7, D8, D9, DA, DB, DC, DD, DE, DF, E0, E1, E2, E3,
        E4, E5, E6, E7, E8, E9, EA, EB, EC, ED, EE, EF, F0, F1, F2, F3,
        F4, F5, F6, F7, F8, F9, FA, FB, FC, FD, FE, FF
    ]
    
    let textFile = ''
    let gInc = address.channel1 // Start iteration from channel 1
    let loopNest = 0 // Stores how many repetition blocks are currently active
    
    textFile +=
`====================================================
-[ ${trackAddress}: ${songName} ]-
====================================================
-[ Header ]-----------------------------------------
Length: $${toHex(length)}
Channel 1: ${toHex(address.channel1 + trackAddress)}
Channel 2: ${toHex(address.channel2 + trackAddress)}
Channel 3: ${toHex(address.channel3 + trackAddress)}
Channel 4: ${toHex(address.channel4 + trackAddress)}
Channel 5: ${toHex(address.channel5 + trackAddress)}
Channel 6: ${toHex(address.channel6 + trackAddress)}
Channel 7: ${toHex(address.channel7 + trackAddress)}
Channel 8: ${toHex(address.channel8 + trackAddress)}

-[ Instruments ]------------------------------------
`
    for (let i = 0; i < 0x10; i++) {
        if (instrumentSet[i] !== 'Nothing') {
            textFile += `$${toHex(i + 0x20)}: ${instrumentSet[i]}\n`
        }
    }

    for (; gInc < track.length; gInc++) {
        switch (gInc) {
            case address.channel1:
                textFile +=
`
====================================================
-[ ${songName}: channel 1 ]-
====================================================\n`
                break
            case address.channel2:
                textFile +=
`
====================================================
-[ ${songName}: channel 2 ]-
====================================================\n`
                break
            case address.channel3:
                textFile +=
`
====================================================
-[ ${songName}: channel 3 ]-
====================================================\n`
                break
            case address.channel4:
                textFile +=
`
====================================================
-[ ${songName}: channel 4 ]-
====================================================\n`
                break
            case address.channel5:
                textFile +=
`
====================================================
-[ ${songName}: channel 5 ]-
====================================================\n`
                break
            case address.channel6:
                textFile +=
`
====================================================
-[ ${songName}: channel 6 ]-
====================================================\n`
                break
            case address.channel7:
                textFile +=
`
====================================================
-[ ${songName}: channel 7 ]-
====================================================\n`
                break
            case address.channel8:
                textFile +=
`
====================================================
-[ ${songName}: channel 8 ]-
====================================================\n`
                break
        }
    
        byte = track[gInc]
    
        textFile += `${toHex(gInc + trackAddress)}: ${toHex(track[gInc])}  `
    
        for (let i = 0; i < loopNest; i++) {
            textFile += `    `
        }
    
        switch (true) {
            case (byte <= 0xc3):
                // 1/1  1/2  1/3  3/8  1/4  1/6  3/16 1/8  1/12 1/16 1/24 1/32 1/48 1/64  
                // ------------------------------------------------------------------------       
                // 00   01   02   03   04   05   06   07   08   09   0A   0B   0C   0D    | C
                // 0E   0F   10   11   12   13   14   15   16   17   18   19   1A   1B    | C#
                // 1C   1D   1E   1F   20   21   22   23   24   25   26   27   28   29    | D
                // 2A   2B   2C   2D   2E   2F   30   31   32   33   34   35   36   37    | D#
                // 38   39   3A   3B   3C   3D   3E   3F   40   41   42   43   44   45    | E
                // 46   47   48   49   4A   4B   4C   4D   4E   4F   50   51   52   53    | F
                // 54   55   56   57   58   59   5A   5B   5C   5D   5E   5F   60   61    | F#
                // 62   63   64   65   66   67   68   69   6A   6B   6C   6D   6E   6F    | G
                // 70   71   72   73   74   75   76   77   78   79   7A   7B   7C   7D    | G#
                // 7E   7F   80   81   82   83   84   85   86   87   88   89   8A   8B    | A
                // 8C   8D   8E   8F   90   91   92   93   94   95   96   97   98   99    | A#
                // 9A   9B   9C   9D   9E   9F   A0   A1   A2   A3   A4   A5   A6   A7    | B
                // A8   A9   AA   AB   AC   AD   AE   AF   B0   B1   B2   B3   B4   B5    | Tie
                // B6   B7   B8   B9   BA   BB   BC   BD   BE   BF   C0   C1   C2   C3    | Rest
    
                // column = byte % 14
                // row = ~~(byte / 14)
    
                textFile += `${notePitches[~~(byte / 14)]} [${noteDurations[byte % 14]}]` + '\n'
                break
            default:
                textFile += (effects[byte - 0xc4]()) + '\n'
        }
    }
    fs.writeFileSync(txtPath, textFile)
}

// parseTrack(
//     0x08FE43,
//     "Battle Theme",
//     fs.readFileSync('./Battle Theme.bin'),
//     './result.txt',
//     fs.readFileSync('./instrumentSet.bin'),
//     new Map(Object.entries(require('./instrumentMap.json')))
//     )

module.exports = parseTrack