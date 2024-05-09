import * as fs from 'fs/promises';
import {hands, handGroups, suitCombos, sameSuits, rangeStringOrderedGroups} from './constants.js';
import clipboardy from 'clipboardy';
import minimist from 'minimist';
import {getRangeString} from './range_string_utils.js';

export function parseNewDefs2(rawText) {
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

/**
 * Returns the list of suit combos for each of the 169 hands
 */
function getSuitCombos(rangeChunk) {
    const suitedEnums = rangeChunk.slice(516, 516+169);
    const suitedSettings = {
        ['1']: getSuitedSettings(rangeChunk.slice(685, 685+16)),
        ['2']: getSuitedSettings(rangeChunk.slice(701, 701+16)),
        ['3']: getSuitedSettings(rangeChunk.slice(717, 717+16)),
    };
    return suitedEnums.map((enumValue) => suitedSettings[enumValue] ?? null);
}

function getRangeStringFromChunk(rangeChunk) {
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

    return getRangeString(rangeFlags, suitCombos);
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
            const range = getRangeStringFromChunk(chunk);
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