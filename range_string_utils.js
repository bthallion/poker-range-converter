import {
    halfWeightRaiseCombos, 
    halfWeightPocketRaiseCombos,
    halfWeightCallCombos,
    halfWeightPocketCallCombos, 
    hands,
    handGroups,
    suitCombos,
    sameSuits,
    rangeStringOrderedGroups
} from './constants.js';

export function getRangeString(rangeFlags, suitCombos) {
    const allHands = rangeStringOrderedGroups
        .map((group) => buildHandGroup(rangeFlags, group, suitCombos));
    return allHands.flat().join(', ');
}

/**
 * Makes some assumptions about how we want to split up
 * weighted decisions by suit - and only handles 50/50
 * weights currently.
 * 
 * Hearts and spades are used actively, clubs and diamonds passively.
 * 
 * This first implementation uses suits for weights because the PokerCruncher
 * android app doesn't support weighted combos, only suited combos.
 */
export function getHalfWeightSuitsForAction(index, action) {
    const hand = hands[index];
    const isPocketPair = hand[2] === undefined;
    if (isPocketPair && action === 'raise') {
        return halfWeightPocketRaiseCombos;
    } else if (isPocketPair && action === 'call') {
        return halfWeightPocketCallCombos;
    } else if (action === 'raise') {
        return halfWeightRaiseCombos;
    } else {
        return halfWeightCallCombos;
    }
}

export function getSuitedHands(index, suits) {
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

export function buildHandGroup(rangeFlags, groupIndices, suitOptions) {
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