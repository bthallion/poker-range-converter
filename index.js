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
import {parseNewDefs2} from './parsers/newdefs2_parser.js';
import {parseNewDefs3} from './parsers/newdefs3_parser.js';
import {parseRangeImages} from './parsers/range_image_parser.js';
import {parseDirectory} from './parsers/directory_parser.js';
import * as path from 'path';

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  throw err;
});

async function readFile(filePath) {
  try {
    return fs.readFile(filePath, { encoding: 'binary' });
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
function outputRangesToClipboard(rangeList, topCategoryFilter = '') {
    let output = '';
    const filteredRangeList = rangeList.filter((range) => range[0].includes(topCategoryFilter));
    console.log(JSON.stringify(filteredRangeList, null, 3));
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
    console.log(output);
}

/**
 * Write ranges to new directory, with each range in its own txt file. This can be imported into Flopzilla 2, and a nested
 * directory structure can be used to represent categories.
 */
async function outputRangesToDir(rangeList, topCategoryFilter= '') {
    await fs.rm('output', {recursive: true, force: true});
    await fs.mkdir('output');
    for (const [pathName, rangeString] of rangeList) {
        const filename = path.basename(pathName);
        await fs.writeFile(new URL(path.join('output', filename+'.txt'), import.meta.url), rangeString);
    }
}

async function getNewDefs2Ranges(src) {
    const source = src ?? defaultDefs2Path;
    const rawText = await readFile(source)
    return parseNewDefs2(rawText);
}

async function getNewDefs3Ranges(src) {
    const source = src ?? defaultDefs3Path;
    const rawText = await readFile(source)
    return parseNewDefs3(rawText);
}

function getImagesRanges(src, debug) {
    const configSrc = src ?? defaultImageConfigPath;
    return parseRangeImages(configSrc, debug);
}

function getDirectoryRanges(src) {
    return parseDirectory(src);
}

(async function main() {
    const args = minimist(process.argv.slice(2));
    const {
        from,
        to,
        src,
        category,
        debug,
    } = args;

    let rangeList;

    switch (from) {
        case 'newdefs2':
            rangeList = await getNewDefs2Ranges(src);
            break;
        case 'newdefs3':
            rangeList = await getNewDefs3Ranges(src);
            break;
        case 'images':
            rangeList = await getImagesRanges(src, debug);
            break;
        case 'directory':
            rangeList = await getDirectoryRanges(src);
            break;
        default:
            throw new Error('No `from` range format argument was provided.'); 
    }

    switch (to) {
        case 'directory':
            outputRangesToDir(rangeList);
            break;
        case 'clipboard':
        default:
            outputRangesToClipboard(rangeList, category);
    }
})();
