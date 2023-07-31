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

module.exports = {
    toHex,
    readLE
}