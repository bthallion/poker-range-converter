export const defaultDefs2Path = `C:\\Program Files (x86)\\Flopzilla\\Flopzilla\\newdefs2.txt`;
export const defaultDefs3Path = `C:\\Program Files (x86)\\FlopzillaPro\\FlopzillaPro\\config\\newdefs3.txt`;
export const defaultImageConfigPath = './range_image_parser_config.json';

export const hands = [
    'AA','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
    'AKo','KK','KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
    'AQo','KQo','QQ','QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
    'AJo','KJo','QJo','JJ','JTs','J9s','J8s','J7s','J6s','J5s','J4s','J3s','J2s',
    'ATo','KTo','QTo','JTo','TT','T9s','T8s','T7s','T6s','T5s','T4s','T3s','T2s',
    'A9o','K9o','Q9o','J9o','T9o','99','98s','97s','96s','95s','94s','93s','92s',
    'A8o','K8o','Q8o','J8o','T8o','98o','88','87s','86s','85s','84s','83s','82s',
    'A7o','K7o','Q7o','J7o','T7o','97o','87o','77','76s','75s','74s','73s','72s',
    'A6o','K6o','Q6o','J6o','T6o','96o','86o','76o','66','65s','64s','63s','62s',
    'A5o','K5o','Q5o','J5o','T5o','95o','85o','75o','65o','55','54s','53s','52s',
    'A4o','K4o','Q4o','J4o','T4o','94o','84o','74o','64o','54o','44','43s','42s',
    'A3o','K3o','Q3o','J3o','T3o','93o','83o','73o','63o','53o','43o','33','32s',
    'A2o','K2o','Q2o','J2o','T2o','92o','82o','72o','62o','52o','42o','32o','22',
];

export const handGroups = {
    pockets: [0, 14, 28, 42, 56, 70, 84, 98, 112, 126, 140, 154, 168],
    suited: {
        ['AXs']: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ['KXs']: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
        ['QXs']: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
        ['JXs']: [43, 44, 45, 46, 47, 48, 49, 50, 51],
        ['TXs']: [57, 58, 59, 60, 61, 62, 63, 64],
        ['9Xs']: [71, 72, 73, 74, 75, 76, 77],
        ['8Xs']: [85, 86, 87, 88, 89, 90],
        ['7Xs']: [99, 100, 101, 102, 103],
        ['6Xs']: [113, 114, 115, 116],
        ['5Xs']: [127, 128, 129],
        ['4Xs']: [141, 142],
        ['3Xs']: [155],
    },
    unsuited: {
        ['AXo']: [13, 26, 39, 52, 65, 78, 91, 104, 117, 130, 143, 156],
        ['KXo']: [27, 40, 53, 66, 79, 92, 105, 118, 131, 144, 157],
        ['QXo']: [41, 54, 67, 80, 93, 106, 119, 132, 145, 158],
        ['JXo']: [55, 68, 81, 94, 107, 120, 133, 146, 159],
        ['TXo']: [69, 82, 95, 108, 121, 134, 147, 160],
        ['9Xo']: [83, 96, 109, 122, 135, 148, 161],
        ['8Xo']: [97, 110, 123, 136, 149, 162],
        ['7Xo']: [111, 124, 137, 150, 163],
        ['6Xo']: [125, 138, 151, 164],
        ['5Xo']: [139, 152, 165],
        ['4Xo']: [153, 166],
        ['3Xo']: [167],
    },
}

export const unsuitedGroups = Object.values(handGroups.unsuited);

export const rangeStringOrderedGroups = [
    handGroups.pockets,
    ...Object.values(handGroups.suited).reduce((acc, suitedGroup, index) => {
        acc.push(suitedGroup);
        acc.push(unsuitedGroups[index]);
        return acc;
    }, []),
];

export const suitCombos = [
    'hh', 'ch', 'dh', 'sh',
    'hc', 'cc', 'dc', 'sc',
    'hd', 'cd', 'dd', 'sd',
    'hs', 'cs', 'ds', 'ss',
];

export const sameSuits = ['hh', 'cc', 'dd', 'ss'];

// The equivalent of .5 weighting for non-pocket pair hands
// the first card is a spade or heart
export const halfWeightRaiseCombos = [
    'hh', 'hc', 'hd', 'hs',
    'sh', 'sc', 'sd', 'ss'
];

// The equivalent of .5 weighting for pocket pair hands
// combos including a spade
export const halfWeightPocketRaiseCombos = [
    'sh', 'sc', 'sd'
];

// The equivalent of .5 weighting for non-pocket pair hands
// the first card is a club or diamond
export const halfWeightCallCombos = [
    'ch', 'cc', 'cd', 'cs', 
    'dh', 'dc', 'dd', 'ds'
];

// The equivalent of .5 weighting for pocket pair hands
// combos not including a spade
export const halfWeightPocketCallCombos = [
    'hc', 'hd', 'cd'
];
