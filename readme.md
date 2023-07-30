# Final Fantasy 6 Node Music Editor
**This application aims to handle and manipulate music related data of a Final Fantasy 6 US 1.0 unheadered ROM.
Music related data includes the following tables in the ROM:**

* `C53C5E`: **number of songs in the game (1 byte of data)** -
Self-explanatory. A vanilla ROM has this value set to $55 (85 songs). This value shall be incremented by 1 everytime a song is added.

* `C53E96`: **pointers for song tracks (3 bytes for each song in the game)** -
This table contains the pointers to where each song is stored. Pointers are always stored in little endian addressing. The order of the pointers determines the song's index.

* `C53F95`: **Instruments for each song (32 bytes for each song in the game)** -
First 32 bytes holds the instruments for song $00. Next 32 bytes holds the instruments for the song $01, and so on. More information at: https://www.ff6hacking.com/wiki/doku.php?id=ff3:ff3us:doc:asm:fmt:instrument_sets

* `C85C7A`: **song tracks (variable size for each song)** -
In a vanilla ROM, all the tracks are contained here, even though they can be stored anywhere in the ROM, as long as its pointer at `C53E96` is pointing to the correct address. Song track data format at: https://www.ff6hacking.com/wiki/doku.php?id=ff3:ff3us:doc:asm:codes:music_codes

### Usage:
```
const FF6NMusED = new MusicEditor('path/to/rom.smc');
FF6NMusED.replaceInstrument(0x02, 'church organ', 'choir);
FF6NMusED.compile('path/to/modifiedRom.smc);
```

### Features:
- `FF6NMusED.getSongInfo(songId)`: returns an object containing several informations about a song. If no argument is provided, returns all the songs in the ROM.
- `FF6NMusED.replaceInstrument(songId, oldInstrument, newInstrument)`: replaces an instrument of a song. Instruments can be Strings(check instrumentMap.json) or Numbers(Id of the instrument).
- `FF6NMusED.parseTrack(songId, songName, txtPath)`: writes a text file based off a track in the game.
- `FF6NMusED.compile(romPath)`: writes a new rom with the changes made to the MusicEditor instance.

### Expected features:
- Swap song tracks or pointers around
- Add your own songs
- Add your own instruments
