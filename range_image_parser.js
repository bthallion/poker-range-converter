// we want to be able to take a directory of images of poker ranges
// and given information about what each color means, generate
// poker ranges.
import {loadJsonFile} from 'load-json-file';
import {getHalfWeightSuitsForAction, getRangeString} from './range_string_utils.js';
import getPixels from 'get-pixels';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function parseRangeImages(configPath) {
	const [config] = await loadJsonFile(configPath);
	const imagePaths = await readImageFilePaths(config.directory);
	return processRangeImages(imagePaths, config);
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

/**
 * Tolerate a deviation of 40 points from the legend color
 */
function doesCellMatchLegend(cellColor, colorName, colorDefinitions) {
	const [legendColor] = colorDefinitions.find(([_, name]) => name === colorName);
	const rDiff = Math.abs(legendColor[0] - cellColor[0]);
	const gDiff = Math.abs(legendColor[1] - cellColor[1]);
	const bDiff = Math.abs(legendColor[2] - cellColor[2]);
	return rDiff <= 40 && gDiff <= 40 && bDiff <= 40;
}

function getCellColors(image, config) {
	const {topLeft, cellSize, gridSize, sampleOffset} = config.gridDimensions;
	const gridLineSize = (gridSize - (cellSize * 13)) / 12;
	const cells = [];
	for (let i = 0; i < 13; i++) {
		for (let j = 0; j < 13; j++) {
			const x = Math.round(topLeft[0] + (j * cellSize) + (gridLineSize * j) + sampleOffset);
			const y = Math.round(topLeft[1] + (i * cellSize) + (gridLineSize * i) + sampleOffset);
			const rgb = [
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
			cells.push(rgb);
		}
	}
	return cells;
}

async function processRangeImages(imagePaths, config) {
	const {gridDimensions, colorDefinitions} = config;
	const images = await Promise.all(imagePaths.map(readImagePixels));
	const rangeStringsMap = {};

	for (let i = 0; i < images.length; i++) {
		const path = imagePaths[i];
		const image = images[i];
		const [fileNameSubstring, legendMap] = Object.entries(config.filePatterns)
			.find(([fileNameSubstring]) => {
				return path.includes(fileNameSubstring);
			}) ?? [];
		if (!legendMap) {
			throw new Error('No legends match this file: ' + path);
		}

		const cellColors = getCellColors(image, config);
		// raise/call to color weights
		const rangeLegends = Object.entries(legendMap);
		for (const [action, colorWeights] of rangeLegends) {
			const {rangeFlags,suits} = cellColors.reduce((acc, color, index) => {
				const colorWeight = colorWeights.find((colorWeight) => {
					return doesCellMatchLegend(color, colorWeight.color, colorDefinitions);
				});
				if (!colorWeight) {
					return acc;
				} else if (colorWeight.weight === 1) {
					acc.rangeFlags[index] = 1;
				} else {
					// we assume that partial weights are .5 for now
					// todo: allow for weights other than .5?
					acc.rangeFlags[index] = 1;
					acc.suits[index] = getHalfWeightSuitsForAction(index, action);
				}
				return acc;
			}, {
				rangeFlags: [],
				suits: [],
			});
			if (rangeFlags.length > 1) {
				const rangeString = getRangeString(rangeFlags, suits);
				rangeStringsMap[path + '_' + action] = rangeString;
			}
		}
	}

	return rangeStringsMap;
}
