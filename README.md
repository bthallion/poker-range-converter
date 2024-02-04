# flopzilla-range-exporter
Convert the newdefs2 file from Flopzilla 1 to a text block of range strings, useful for batch importing into PokerCruncher on Android. This way you only need to define your ranges in a single place, and can relatively easily port them to a mobile device for reference at the table.

## Installation

- Run `npm i` to install dependencies

## Usage

- Run `node index.js` and your Flopzilla 1.x.x ranges will be copied into your clipboard

### Arguments

--category: A filter for top level categories in case you don't want all your ranges
	copied to the clipboard. Checks if a category contains the substring provided.

ex: `node index.js --category="Upswing Ranges"`


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
