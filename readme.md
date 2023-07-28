# Final Fantasy 3 Song Handler
**This application aims to handle music related data of a Final Fantasy 3 US 1.0 unheadered ROM.
Music related data includes the following tables in the ROM:**

* `C53C5E`: **number of songs in the game (1 byte of data)** -
Self-explanatory. A vanilla ROM has this value set to $55 (85 songs). This value shall be incremented by 1 everytime a song is added.

* `C53E96`: **pointers for song tracks (3 bytes for each song in the game)** -
This table contains the pointers to where each song is stored. Pointers are always stored in little endian addressing. The order of the pointers determines the song's index.

* `C53F95`: **Instruments for each song (32 bytes for each song in the game)** -
First 32 bytes holds the instruments for song $00. Next 32 bytes holds the instruments for the song $01, and so on. More information at: https://www.ff6hacking.com/wiki/doku.php?id=ff3:ff3us:doc:asm:fmt:instrument_sets

* `C85C7A`: **song tracks (variable size for each song)** -
In a vanilla ROM, all the songs are contained here. You can, however, insert songs anywhere in the ROM, as long as its pointer at `C53E96` is pointing to the correct address. Song data format at: https://www.ff6hacking.com/wiki/doku.php?id=ff3:ff3us:doc:asm:codes:music_codes

### Usage:
```
const FF3SongHandler = new SongHandler('path/to/rom.smc');
a.replaceInstrument(0x02, 'church organ', 'choir);
a.compile('path/to/modifiedRom.smc);
```

### Features:
- `getSongData(songId)`: returns an object containing all the information about a song. If no argument is provided, returns all the songs in the ROM.
- `replaceInstrument(songId, oldInstrument, newInstrument)`: replaces an instrument of a song. Instruments can be Strings(check instrumentMap.json) or Numbers(Id of the instrument).
- `compile(romPath)`: writes a new rom with the changes made to the SongHandler object.

### Expected features:
- Swap song tracks or pointers around
- Add your own songs
- Add your own instruments
