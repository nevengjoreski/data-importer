export const parseCSVLine = (line: string): string[] => {
    // Simple CSV parser that handles quoted strings
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue);
    return values.map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes
};
