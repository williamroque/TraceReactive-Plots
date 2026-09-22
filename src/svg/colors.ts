export function getSeriesColor(index: number, properties: Record<string, any>): string {
    const defaultColors = [
        '#77E4FF', // series 1
        '#ff6b6b', // series 2
        '#51cf66', // series 3
        '#ffd43b', // series 4
        '#cc5de8', // series 5
        '#ff922b'  // series 6
    ];
    
    // Try to get from properties first
    const propKey = `plotSeriesColor${(index % 6) + 1}`;
    if (properties[propKey]) {
        return String(properties[propKey]);
    }
    
    return defaultColors[index % 6];
}

export function hexToRgb(color: string): { r: number, g: number, b: number, a: number } | null {
    if (color.startsWith('rgb')) {
        const match = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }
        return null;
    }
    
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
    const hexFull = color.replace(shorthandRegex, (m, r, g, b, a) => {
        return r + r + g + g + b + b + (a ? a + a : '');
    });
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hexFull);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: result[4] ? parseInt(result[4], 16) / 255 : 1
        };
    }
    return null;
}

export function interpolateColor(value: number, min: number, max: number, colorLow: string, colorHigh: string): string {
    if (min === max) return colorHigh;
    
    let t = (value - min) / (max - min);
    t = Math.max(0, Math.min(1, t));
    
    const rgbLow = hexToRgb(colorLow);
    const rgbHigh = hexToRgb(colorHigh);
    
    if (!rgbLow || !rgbHigh) return colorHigh; // Fallback
    
    const r = Math.round(rgbLow.r + t * (rgbHigh.r - rgbLow.r));
    const g = Math.round(rgbLow.g + t * (rgbHigh.g - rgbLow.g));
    const b = Math.round(rgbLow.b + t * (rgbHigh.b - rgbLow.b));
    const a = rgbLow.a + t * (rgbHigh.a - rgbLow.a);
    
    if (a !== 1) {
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }
    return `rgb(${r},${g},${b})`;
}
