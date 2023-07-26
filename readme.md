# Final Fantasy 3 Song Handler
This application aims to handle music related data of a Final Fantasy 3 US 1.0 unheadered ROM.
Music related data includes the following tables in the ROM:

### C53C5E: Number of songs in the ROM (1 byte of data)
Pretty self-explanatory. A vanilla ROM has this value set to $55 (85 songs). This value shall be incremented by 1 everytime a song is added.

### C53E96: Pointers for song scores (3 bytes for each song in the game)
This table contains the pointers the address where each song is stored. Pointers are always stored in little endian addressing. The order of these pointers determines a song's index.

### C53F95: Instruments for each song (32 bytes for each song in the game)
First 32 bytes holds the instruments for song $00, the next 32 bytes holds the instruments for the second songand so on. More information at: https://www.ff6hacking.com/wiki/doku.php?id=ff3:ff3us:doc:asm:fmt:instrument_sets

### C85C7A: Song scores (variable size for each song)
In a vanilla ROM, all the songs are contained here. You can, however, insert songs anywhere in the ROM, as long as the pointer at C53E96 is pointing correctly.

### Expected features:
- Generate a ROM Map regarding music data
- Replacing song intruments
- Swapping songs scores or pointers around
- Adding your own songs
- Adding your own instruments