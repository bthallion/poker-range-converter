# flopzilla-range-exporter
Convert the newdefs2 file from Flopzilla 1 to a text block of range strings, useful for importing into PokerCruncher on Android. This way you only need to define your ranges in a single place, and can relatively easily port them to a mobile device for reference at the table.

## Installation

- Run `npm i` to install dependencies

## Usage

- Run `node index.js` and your Flopzilla 1.x.x ranges will be copied into your clipboard

### Arguments

--category: A filter for top level categories in case you don't want all your ranges
	copied to the clipboard. Checks if a category contains the substring provided.

ex: `node index.js --category="Bens Ranges"`
