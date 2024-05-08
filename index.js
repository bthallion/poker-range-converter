import * as fs from 'fs/promises';
import {
    hands, 
    handGroups, 
    suitCombos, 
    sameSuits, 
    defaultDefs2Path, 
    defaultDefs3Path, 
    defaultImageConfigPath, 
    rangeStringOrderedGroups
} from './constants.js';
import clipboardy from 'clipboardy';
import minimist from 'minimist';
import {getRangeString} from './range_string_utils';
import {parseNewDefs2} from './newdefs2_parser.js';
import {parseNewDefs3} from './newdefs3_parser.js';
import {parseRangeImages} from './range_image_parser.js';

async function readFile(filePath) {
  try {
    return fs.readFile(filePath, { encoding: 'utf8' });
  } catch (err) {
    throw new Error(err);
  }
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
function outputListOfRangesToClipboard(rangeList, topCategoryFilter = '') {
    let output = '';
    const filteredRangeList = rangeList.filter((range) => range[0].includes(topCategoryFilter));
    for (let i = 0; i < filteredRangeList.length; i++) {
        const rangeAndPath = filteredRangeList[i];
        const length = rangeAndPath.length;
        const range = rangeAndPath[length - 1];
        const rangeName = rangeAndPath[length - 2];
        const categoryName = rangeAndPath[length - 3];
        output = output + `Hand Range #${i + 1}[${rangeName} ${categoryName}]:`
            + '\n' + `{${range}}` + '\n\n';
    }
    clipboardy.writeSync(output);
}

/**
 * Write ranges to new directory, with each range in its own txt file. This can be imported into Flopzilla 2, and a nested
 * directory structure can be used to represent categories.
 */
async function outputRangesToDir(rangeStringsMap) {
    await fs.rm('output', {recursive: true, force: true});
    await fs.mkdir('output');
    for (const [pathName, rangeString] of Object.entries(rangeStringsMap)) {
        const filename = path.basename(pathName);
        await fs.writeFile(new URL(path.join('output', filename+'.txt'), import.meta.url), rangeString);
    }
}

(async function main() {
    const args = minimist(process.argv.slice(2));
    if (args['parse-newdefs2']) {
        const rawText = await readFile(defaultDefs2Path)
        const rangeList = parseNewDefs2(rawText);
        outputListOfRangesToClipboard(rangeList, args.category);
    } else if (args['parse-newdefs3']) {
        const rawText = await readFile(defaultDefs2Path)
        const rangeList = parseNewDefs3(rawText);
        outputListOfRangesToClipboard(rangeList, args.category);
    } else if (args['parse-range-images']) {
        const rangeStringsMap = await parseRangeImages(defaultImageConfigPath);
        outputRangesToDir(rangeStringsMap);
    } else {
        throw new Error('No parsing strategy selected.')
    }
})();