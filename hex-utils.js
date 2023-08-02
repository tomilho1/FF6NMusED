function toHex(number, mode = 'default') {
    if (mode === 'HIROMtoNormal') {
        number = number - 0xC00000
    }

    if (mode === 'NormalToHIROM') {
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

/**
 * Pointers stored inside tracks are 2 bytes only (1 bank range). It is possible, though, that a track,
 * like the Battle Theme, starts at bank C8 and ends at bank C9, meaning that they occupy 2 banks instead.
 * That means that just reading the pointers in the track is not enough, we need to further verify
 * if the pointer is actually pointing to an address that is **in the range of the track**. Note that
 * this correction is only rarely neccessary (in a vanilla ROM, it is only needed in the Battle Theme). Also,
 * tracks can't be larger than 0xFFFF bytes anyway.
 */
function readTrackPointer(pointer, trackAddress, lastByteAddress) {
    pointer = readLE(pointer) + (trackAddress & 0xFF0000)
    if (pointer < trackAddress) {
        pointer = pointer + 0x010000
    } else if (pointer > lastByteAddress) {
        pointer = pointer - 0x010000
    }
    return pointer
}

module.exports = {
    toHex,
    readLE,
    readTrackPointer
}