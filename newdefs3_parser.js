import * as fs from 'fs/promises';
import {hands, handGroups, suitCombos, sameSuits, newDefsPath, rangeStringOrderedGroups} from './constants.js';
import clipboardy from 'clipboardy';
import minimist from 'minimist';
import {getRangeString} from './range_string_utils';

export function parseNewDefs3(rawText) {
	const chunks = rawText.split('\x01').join('').split('ð?Ô').filter((str) => str !== '                ');
	const flatRanges = chunks
		.map((chunk) => chunk.split(/\s\s+/g).join('').split('eÿþÿ').slice(1))
		.filter((range) => range.length > 0)
	return buildRangeList(flatRanges);
}

function buildRangeList(flatRanges) {
	const root = {};
	let currentNode = {parent: root};
	flatRanges[0] = flatRanges[0].slice(1);
	const allRanges = [];
	const currentPath = [];
	for (const flatRange of flatRanges) {
		// A new category is found, go to the parent of the currentNode. Is this always correct?
		// what if we have more than 2 levels of nesting
		if (flatRange.length > 2) {
			let parent = currentNode.parent;
			delete currentNode.parent;
			currentNode = parent;
		}
		// If the flat range has more than 2 pieces it includes at least one category name
		while (flatRange.length > 2) {
			let categoryName = flatRange.shift()
				.slice(1)
				.replace(/(\S)(\S)/g, '$1@@@@bentoken@@@@$2');
			let categoryNamePieces = categoryName.split(' ');
			categoryNamePieces
				.push(categoryNamePieces.pop()[0])
			categoryName = categoryNamePieces.join('')
				.split('@@@@bentoken@@@@').join(' ')
			const newNode = {
				parent: currentNode,
			};
			currentNode[categoryName] = newNode;
			currentNode = newNode;
		}

		const rangeName = flatRange.shift()
			.slice(1)
			.replace(/(\S)(\S)/g, '$1@@@@bentoken@@@@$2')
			.split(' ').join('')
			.split('@@@@bentoken@@@@').join(' ');
		let range = flatRange.pop();
		let rangePieces = range.split(' ');
		const firstPiece = rangePieces.shift();
		rangePieces.unshift(firstPiece[firstPiece.length - 1]);
		range = rangePieces.join(' ');
		currentNode[rangeName] = range
			.slice(0, range.length - 1)
			.replace(/(\S)(\S)/g, '$1@@@@bentoken@@@@$2')
			.split(' ').join('')
			.split('@@@@bentoken@@@@').join(' ');
	}
	while (currentNode.parent) {
		let parent = currentNode.parent;
		delete currentNode.parent;
		currentNode = parent;
	}
	return currentNode;
}