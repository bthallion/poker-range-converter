# Poker Range Converter

Convert common poker range formats to range strings, for importing and exporting between NLHE study tools.

Supported input formats include:
  - JPG, GIF or PNG color coded images of ranges
  - Flopzilla 1.x.x newdefs2 files
  - FlopzillaPro 2.x.x newdefs3 files

Output formats:
  - A text block of named ranges copied to the clipboard, formatted for import into PokerCruncher on Android OS
  - A directory of files for each range string, which can be imported into FlopzillaPro

## Installation

- Run `npm i` to install dependencies

## Usage

- Run `npm run convert -- --from=newdefs2 --to=clipboard` and your Flopzilla 1.x.x ranges will be copied into your clipboard
- Run `npm run convert -- --from=newdefs3 --to=clipboard` and your Flopzilla 2.x.x ranges will be copied into your clipboard
- Run `npm run convert -- --from=images --to=files --src=/path/to/config.json` and using the provided configuration a directory of JPG, GIF or PNG range chart images will be parsed and written to the output directory

### Arguments

--from: The input format of poker ranges to convert from - one of the following values:
`newdefs2`, `newdefs3`, `images`

--to: The output format, either copied as a textblock to your clipboard, or each range string is written to an individual file in a directory - one of the following values:
`clipboard`, `files`

--category: A filter for top level categories when converting from newdefs. Checks if the top category contains the filter as a substring.

	ex: `npm run convert -- --from=newdefs2 --category="Upswing Ranges"`

--output_directory: Specify a directory to write the parsed ranges into rather than copying them to your clipboard, each range
  is written to its own file. This directory is importable by FlopzillaPro, and can further by organized into categories
  using subdirectory folders.

  ex: `npm run convert -- --from=images --to=files`


### Example Output: 
```
Hand Range #1[EP1 RFI]:
{88+, 7h7s, 7c7h, 7c7s, 7d7h, 7d7s, ATs+, A5s, AQo+, KTs+, KsQh, KhQc, KsQc, KhQd, KsQd, KhQs, QJs, QhTh, QsTs, JTs}

Hand Range #2[EP2 RFI]:
{88+, 7h7s, 7c7h, 7c7s, 7d7h, 7d7s, A9s+, A5s-A4s, AQo+, KTs+, KsQh, KhQc, KsQc, KhQd, KsQd, KhQs, QTs+, JTs, Th9h, Ts9s}

Hand Range #3[EP3 RFI]:
{77+, A8s+, A5s-A4s, AJo+, K9s+, KsQh, KhQc, KsQc, KhQd, KsQd, KhQs, QTs+, JTs, Th9h, Ts9s}

Hand Range #4[LJ RFI]:
{77+, A2s+, ATo+, K9s+, KJo+, QTs+, Qh9h, Qs9s, JTs, Jh9h, Js9s, Th9h, Ts9s}

Hand Range #5[HJ RFI]:
{55+, A2s+, ATo+, As9h, Ah9c, As9c, Ah9d, As9d, Ah9s, K9s+, Kh8h, Ks8s, KJo+, KsTh, KhTc, KsTc, KhTd, KsTd, KhTs, QTs+, Qh9h, Qs9s, QJo, JTs, Jh9h, Js9s, Th9h, Ts9s}

Hand Range #6[CO RFI]:
{55+, 4h4s, 4c4h, 4c4s, 4d4h, 4d4s, 3h3s, 3c3h, 3c3s, 3d3h, 3d3s, 2h2s, 2c2h, 2c2s, 2d2h, 2d2s, A2s+, A9o+, K5s+, KTo+, Q9s+, QTo+, J9s+, JTo, T9s, 98s, 87s}

Hand Range #7[BTN RFI]:
{22+, A2s+, A5o+, K2s+, K7o+, Q4s+, Q9o+, J5s+, J9o+, T7s+, T9o, 97s+, 86s+, 75s+, 65s, 54s}
```

### Limitations
- Does not handle percentage weights, as PokerCruncher for Android doesn't either. I tend to define
  partial combos using suits instead of percentage weights for this reason.
- Assumes you've installed Flopzilla on a windows machine in the normal location, easy enough to change locally
- The newdefs3 parser is very experimental, it expects ranges to be nested in no more than 2 categories deep