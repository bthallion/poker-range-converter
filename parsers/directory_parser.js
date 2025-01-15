import {loadJsonFile} from 'load-json-file';
import {getHalfWeightSuitsForAction, getRangeString} from '../utils/range_string_utils.js';
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';
import * as fs from 'fs/promises';
import {createWriteStream} from 'fs'
import * as path from 'path';

/**
 * 
 * 
 * 
 */




async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

export async function parseDirectory(dirPath) {
	console.log('dirPath:', dirPath);
	const files = await getFiles(dirPath);
	console.log(JSON.stringify(files, 2, null));
}

// todo: use a more flexible image parsing library:
//https://github.com/donmccurdy/ndarray-pixels

async function readImageFilePaths(dirPath) {
	const fileNames = await fs.readdir(dirPath);
	return fileNames.map((fileName) => {
		return path.join(dirPath, fileName);
	});
}

function readImagePixels(imagePath) {
	return new Promise((resolve, reject) => {
		getPixels(imagePath, (err, pixels) => {
			if (err) {
				console.error('Bad image path', err);
				reject(err);
				return;
			}
			resolve(pixels);
		});
	});
}

async function saveImage(ndArray, fileName) {
	const outputPath = path.join('debug_output', fileName);
	const fileStream = createWriteStream(outputPath);
	return new Promise((resolve) => {
		savePixels(ndArray, 'png').pipe(fileStream).on('finish', resolve);
	});
}

/**
 * Tolerate a deviation of 40 points from the legend color
 */
function doesCellMatchLegend(cellColor, colorName, colorDefinitions) {
	const [legendColor] = colorDefinitions.find(([_, name]) => name === colorName);
	return areColorsEquivalent(cellColor, legendColor);
}

function areColorsEquivalent(colorA, colorB) {
	const rDiff = Math.abs(colorA[0] - colorB[0]);
	const gDiff = Math.abs(colorA[1] - colorB[1]);
	const bDiff = Math.abs(colorA[2] - colorB[2]);
	return rDiff <= 40 && gDiff <= 40 && bDiff <= 40;
}

async function getCellColors(image, config, name) {
	const {
		topLeft, 
		cellWidth,
		cellHeight, 
		gridWidth,
		gridHeight, 
		sampleOffsetX,
		sampleOffsetY
	} = config.gridDimensions;
	const {verticalSplitCells} = config;
	const xGridLineSize = (gridWidth - (cellWidth * 13)) / 12;
	const yGridLineSize = (gridHeight - (cellHeight * 13)) / 12;
	const cells = [];
	for (let i = 0; i < 13; i++) {
		for (let j = 0; j < 13; j++) {
			const coords = [];
			if (verticalSplitCells) {
				const halfCell = cellWidth / 2;
				const x = 
					Math.round(topLeft[0] + (j * cellWidth) + (xGridLineSize * j) + sampleOffsetX + halfCell);
				const y = 
					Math.round(topLeft[1] + (i * cellHeight) + (yGridLineSize * i) + sampleOffsetY);
				coords.push([x, y]);
			}
			coords.push([
				Math.round(topLeft[0] + (j * cellWidth) + (xGridLineSize * j) + sampleOffsetX), 
				Math.round(topLeft[1] + (i * cellHeight) + (yGridLineSize * i) + sampleOffsetY),
			]);

			const colors = coords.map(([x, y]) => {
				const color = [
					image.get(
						x, 
						y,
						0
					),
					image.get(
						x, 
						y,
						1
					),
					image.get(
						x, 
						y,
						2
					)
				];
				if (config.debug) {
					image.set(x, y, 0, 255);
					image.set(x, y, 1, 255);
					image.set(x, y, 2, 255);
				}
				return color;
			});
			// Save image for debugging
			if (config.debug) {
				await saveImage(image, name);
			}
			if (colors.length === 1 || areColorsEquivalent(colors[0], colors[1])) {
				cells.push([colors[0]]);
			} else {
				cells.push(colors);
			}
			
		}
	}
	return cells;
}

async function processRangeImages(imagePaths, config) {
	const {
		gridDimensions, 
		colorDefinitions,
		useSuitsForPartialCombos,
		debug,
	} = config;
	let images = await Promise.all(imagePaths.map(readImagePixels));
	if (debug) {
		await fs.rm('debug_output', {recursive: true, force: true});
    	await fs.mkdir('debug_output');
	}
	const rangeStringsMap = {};
	for (let i = 0; i < images.length; i++) {
		const imagePath = imagePaths[i];
		const image = images[i];
		const [fileNameSubstring, legendMap] = Object.entries(config.filePatterns)
			.find(([fileNameSubstring]) => {
				return imagePath.includes(fileNameSubstring);
			}) ?? [];
		if (!legendMap) {
			throw new Error('No legends match this file: ' + imagePath);
		}

		const cellColors = await getCellColors(image, config, path.basename(imagePath));

		// raise/call to color weights
		const rangeLegends = Object.entries(legendMap);
		for (const [action, colorWeights] of rangeLegends) {
			const {rangeFlagMap, suits} = cellColors.reduce((acc, colors, index) => {
				const colorWeight = colorWeights.find((colorWeight) => {
					return colors.find((color) => {
						return doesCellMatchLegend(color, colorWeight.color, colorDefinitions);
					}) !== undefined;
				});
				const weight = (colorWeight?.weight ?? 0) / colors.length;

				if (!colorWeight) {
					return acc;
				} else if (useSuitsForPartialCombos) {
					// we assume that partial weights are .5 for now
					// todo: allow for weights other than .5?
					acc.suits[index] = getHalfWeightSuitsForAction(index, action);
				}
				acc.rangeFlagMap[weight] = acc.rangeFlagMap[weight] ?? [];
				acc.rangeFlagMap[weight][index] = 1;
				return acc;
			}, {
				rangeFlagMap: {},
				suits: [],
			});
			if (Object.entries(rangeFlagMap).length > 0) {
				const rangeString = getRangeString(rangeFlagMap, suits);
				rangeStringsMap[imagePath + '_' + action] = rangeString;
			}
		}
	}

	return Object.entries(rangeStringsMap).map(([key, value]) => {
		return [key, value];
	});
}
