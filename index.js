r = (function decodeFlopzillaRanges(rawText) {
    const textLines = rawText.split('\n');
    const chunks = textLines.reduce((acc, line) => {
        if (acc.length === 0) acc.push([]);
        let chunk = acc[acc.length - 1];
        if (line.includes('\u0014')) {
            chunk = [];
            acc.push(chunk);
        }
        chunk.push(line);
        return acc;
    }, []);

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
    const suitedCells = selectedRange.slice(518);
    const populatedSuits = suitedCells
        .map((val, index) => [val, index])
        .filter(([val]) => val !== '0');

    return {textLines, chunks, rangeGroups,selectedRange, groupedCells,populatedCells, suitedCells, populatedSuits};
})(rawText);
