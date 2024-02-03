import * as fs from 'fs/promises';
import {hands, handGroups, suitCombos} from './constants.js';
const filePath = `C:\\Program Files (x86)\\Flopzilla\\Flopzilla\\newdefs2.txt`;

async function readEncodedRanges() {
  try {
    const data = await fs.readFile(filePath, { encoding: 'utf8' });
    return data;
  } catch (err) {
    throw new Error(err);
  }
}

function unencodeFlopzillaRanges(rawText) {
    const textLines = rawText.split('\r\n');
    const chunks = textLines
        .reduce((acc, line) => {
            if (acc.length === 0) acc.push([]);
            let chunk = acc[acc.length - 1];
            // these \u0014 unicode control characters
            // are used all over the file, seemingly to delineate
            // data
            if (line.includes('\u0014')) {
                chunk = [];
                acc.push(chunk);
            }
            chunk.push(line);
            return acc;
        }, [])
        // get rid of control character lines
        .filter((chunk) => chunk.length > 1)

    // add name to root tree node
    // this also moves the subcategory count to
    // the normal position in the chunk,
    // this first chunk is unusual
    chunks[0].unshift('root');

    const tree = buildRangeTree(chunks);
    const rangeGroups = chunks.filter(chunk => chunk.length >= 516);
    const selectedRange = rangeGroups[rangeGroups.length - 1];
    const cells = selectedRange.slice(8, 515)
    const groupedCells = [];
    for (let i = 0; i < cells.length; i += 3) {
        // first byte is whether the cell is populated
        // second byte controls whether the cell has a weighting
        // third byte is the weight enum
        const group = [cells[i], cells[i + 1], cells[i + 2], i / 3];
        groupedCells.push(group);
    }
    const populatedCells = groupedCells.filter(([a,b]) => a !== '0');
    // 0-168 values indicate the suitedness enum (0-2)
    // 169-217 values indicate which suit combinations are enabled
    const suitedCells = selectedRange.slice(516);
    const populatedSuits = suitedCells
        .map((val, index) => [val, index])
        .filter(([val]) => val !== '0');

    const output = {textLines, chunks, rangeGroups,selectedRange, groupedCells,populatedCells, suitedCells, populatedSuits};
    console.log(output);
    debugger;
}

function getRangeString(rangeChunk, suitCells, suitSettings) {
    // Since PokerCruncher only supports partial suit combos
    // and not proper percentage weights, we'll ignore those for now
    // These values represent the percentage of a particular
    // setting (no weight and custom 1-5)
    const weightSettings = rangeChunk.slice(2, 8);
    // 169 * 3 range values, 3 for each cell
    const rangeValues = selectedRange.slice(8, 515);
    const cells = [];
    for (let i = 0; i < rangeValues.length; i += 3) {
        // first byte is whether the cell is populated
        // second byte controls whether the cell has a weighting
        // third byte is the weight enum
        const cell = [rangeValues[i], rangeValues[i + 1], rangeValues[i + 2], i / 3];
        cells.push(cell);
    }

    // build pocket pair combos

}

function buildHandGroup(rangeCells, indices, suitCells, suitSettings) {
    const binaryRange = rangeCells.map(([isPresent]) => Boolean(isPresent));
    let continuousFromTop = true;
    let fromHandAndUp = null;
    let startHand = null;
    let endHand = null;
    const allHands = [];
    for (const index of indices) {
        if (binaryRange[index]) {

            if (continuousFromTop) {
                fromHandAndUp = `${hands[index]}+`;
            }
        }
    }
}

function unencodeName(name) {
    return name.split(/\u0014|@/g).filter(Boolean).join(' ')
}

function buildRangeTree(chunks) {
    const tree = {subCategoryCount: 1};
    let currentNode = tree;
    for (const chunk of chunks) {
        // chunks of length 4-7? are categories
        // build tree of subcategories
        if (chunk.length >= 4 && chunk.length <= 20) {
            const name = unencodeName(chunk[0]);
            const newNode = {};
            currentNode[name] = newNode;
            newNode.parent = currentNode;
            // a category chunk has the number of child ranges and subcategories
            newNode.subCategoryCount = Number(chunk[4]) || 0;
            newNode.rangeCount = Number(chunk[3]) || 0;
            currentNode.subCategoryCount -= 1;
            currentNode = newNode;
        // chunks of at least 516 length are ranges 
        } else if (chunk.length > 500) {
            currentNode.ranges = currentNode.ranges ?? [];
            currentNode.ranges.push(chunk);
            currentNode.rangeCount -= 1;
        }

        // walk up the tree when we're done adding to the current node
        // and clean up implementation fields
        while (currentNode.subCategoryCount <= 0 && currentNode.rangeCount <= 0) {
            const parent = currentNode.parent;
            delete currentNode.parent;
            delete currentNode.subCategoryCount;
            delete currentNode.rangeCount;
            currentNode = parent;
        }
    }
    return tree.root;
}

/*
PokerCruncher can import a list of ranges in the following format:

Hand Range #1[EP1 RFI]:
{88+, 7h7s, 7c7s, 7c7h, 7d7s, 7d7h, ATs+, A5s, KTs+, QJs, QsTs, QhTh, JTs, AQo+, KhQs, KsQh, KsQc, KsQd, KhQc, KhQd}

Hand Range #2[Test 2]:
{88+, 7h7s, 7c7s, 7c7h, 7d7s, 7d7h, ATs+, A5s, KTs+, QJs, QsTs, QhTh, JTs, AQo+, K9o, K5o, KhQs, KsQh, KsQc, KsQd, KhQc, KhQd, Q7o, T5o}

Range Naming
{range name} {category}
ex:
EP1 RFI

{range name} {category}
ex:
EP/LJ Call vs. EP RFI

HJ/CO 4bet IP vs. BTN 3bet
*/
function outputListOfRanges() {

}

(async function main() {
    const encodedRanges = await readEncodedRanges();
    unencodeFlopzillaRanges(encodedRanges);
})();