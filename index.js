import * as fs from 'fs/promises';
import {hands, handGroups, suitCombos, sameSuits, newDefsPath} from './constants.js';
import clipboardy from 'clipboardy';
import minimist from 'minimist';

async function readEncodedRanges() {
  try {
    const data = await fs.readFile(newDefsPath, { encoding: 'utf8' });
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

    return buildRangeList(chunks)
        .map((rangeAndPath) => rangeAndPath.slice(1));
}

function getSuitedSettings(suitedSettingFlags) {
    return suitedSettingFlags
        .map((useCombo, index) => useCombo === '1' ? suitCombos[index] : null)
        .filter(Boolean);
}

function getSuitCombos(rangeChunk) {
    const suitedEnums = rangeChunk.slice(516, 516+169);
    const suitedSettings = {
        ['1']: getSuitedSettings(rangeChunk.slice(685, 685+16)),
        ['2']: getSuitedSettings(rangeChunk.slice(701, 701+16)),
        ['3']: getSuitedSettings(rangeChunk.slice(717, 717+16)),
    };
    return suitedEnums.map((enumValue) => suitedSettings[enumValue] ?? null);
}

function getSuitedHands(index, suits) {
    const hand = hands[index];
    const isSameSuit = hand[2] === 's';
    const isPocketPair = hand[2] === undefined;
    let filteredSuits = suits
        .filter((suit) => sameSuits.includes(suit) === isSameSuit);
    filteredSuits = isPocketPair ? 
        [...new Set(filteredSuits.map((suit) => suit.split('').sort().join('')))] : 
        filteredSuits;
    const card1 = hand[0];
    const card2 = hand[1];
    return filteredSuits.map((suitCombo) => `${card1}${suitCombo[0]}${card2}${suitCombo[1]}`);
}

function getRangeString(rangeChunk) {
    // Since PokerCruncher only supports partial suit combos
    // and not proper percentage weights, we'll ignore those for now
    // These values represent the percentage of a particular
    // setting (no weight and custom weights 1-5)
    const weightSettings = rangeChunk.slice(2, 8);
    // 169 * 3 range values, 3 for each cell
    const rangeValues = rangeChunk.slice(8, 515);
    const suitCombos = getSuitCombos(rangeChunk);
    const rangeFlags = [];
    for (let i = 0; i < rangeValues.length; i += 3) {
        // first byte is whether the cell is populated
        // second byte controls whether the cell has a weighting
        // third byte is the weight enum
        const cell = [rangeValues[i], rangeValues[i + 1], rangeValues[i + 2], i / 3];
        rangeFlags.push(rangeValues[i] === '1');
    }
    const unsuitedGroups = Object.values(handGroups.unsuited);
    // build pocket pair combos
    const groups = [
        handGroups.pockets,
        ...Object.values(handGroups.suited).reduce((acc, suitedGroup, index) => {
            acc.push(suitedGroup);
            acc.push(unsuitedGroups[index]);
            return acc;
        }, []),
    ];

    const allHands = groups.map((group) => buildHandGroup(rangeFlags, group, suitCombos));
    return allHands.flat().join(', ');
}

function buildHandGroup(rangeFlags, groupIndices, suitOptions) {
    let continuousFromTop = true;
    const topHand = hands[groupIndices[0]];
    let fromHandAndUp = null;
    let startHand = null;
    let endHand = null;
    let allHands = [];
    for (const index of groupIndices) {
        const suits = suitOptions[index];
        const hand = hands[index];
        if (!rangeFlags[index] || suits) {
            if (continuousFromTop && fromHandAndUp) {
                allHands.push(fromHandAndUp === topHand 
                    ? fromHandAndUp : fromHandAndUp + '+');
            } else if (endHand && endHand !== startHand) {
                allHands.push(`${startHand}-${endHand}`);
            } else if (startHand) {
                allHands.push(startHand);
            }
            continuousFromTop = false;
            fromHandAndUp = null;
            startHand = null
            endHand = null;
        }
        if (rangeFlags[index] && suits) {
            const suitedHands = getSuitedHands(index, suits);
            allHands = allHands.concat(suitedHands);
        } else if (rangeFlags[index]) {
            if (continuousFromTop) {
                fromHandAndUp = hand;
            } else {
                if (!startHand) startHand = hand;
                endHand = hand;
            }
        }
    }

    if (continuousFromTop && fromHandAndUp) {
        allHands.push(fromHandAndUp === topHand 
            ? fromHandAndUp : fromHandAndUp + '+');
    } else if (endHand && endHand !== startHand) {
        allHands.push(`${startHand}-${endHand}`);
    } else if (startHand) {
        allHands.push(startHand);
    }

    return allHands;
}

function unencodeName(name) {
    return name.split(/\u0014|@/g).filter(Boolean).join(' ')
}

function buildRangeList(chunks) {
    const tree = {subCategoryCount: 1};
    const allRanges = [];
    const currentPath = [];
    let currentNode = tree;
    for (const chunk of chunks) {
        const name = unencodeName(chunk[0]);
        // chunks of length 4-7? are categories
        // build tree of subcategories
        if (chunk.length >= 4 && chunk.length <= 20) {
            currentPath.push(name);
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
            const range = getRangeString(chunk);
            allRanges.push([...currentPath, name, range]);
            currentNode[name] = range;
            currentNode.rangeCount -= 1;
        }

        // walk up the tree when we're done adding to the current node
        // and clean up implementation fields
        while (currentNode.subCategoryCount <= 0 && currentNode.rangeCount <= 0) {
            currentPath.pop();
            const parent = currentNode.parent;
            delete currentNode.parent;
            delete currentNode.subCategoryCount;
            delete currentNode.rangeCount;
            currentNode = parent;
        }
    }
    return allRanges;
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
{EP/LJ Call} {vs. EP RFI}

{HJ/CO 4bet IP} {vs. BTN 3bet}
*/
function outputListOfRangesToClipboard(rangeList, topCategoryFilter) {
    let output = '';
    const filteredRangeList = rangeList.filter((range) => range[0].includes(topCategoryFilter));
    for (let i = 0; i < filteredRangeList.length; i++) {

        const rangeAndPath = filteredRangeList[i];
        const length = rangeAndPath.length;
        const range = rangeAndPath[length - 1];
        const rangeName = rangeAndPath[length - 2];
        const categoryName = rangeAndPath[length - 3];
        output = output + '\n\n' + `Hand Range #${i}[${rangeName} ${categoryName}]:`
            + '\n' + `{${range}}`;
    }
    output = output + '\n';
    clipboardy.writeSync(output);
}

(async function main() {
    const args = minimist(process.argv.slice(2));
    const encodedRanges = await readEncodedRanges();
    const rangeList = unencodeFlopzillaRanges(encodedRanges);
    outputListOfRangesToClipboard(rangeList, args.category);
})();