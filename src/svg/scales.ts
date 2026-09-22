export function linearScale(min: number, max: number, range: number): (value: number) => number {
    if (min === max) {
        return () => range / 2;
    }
    return (value: number) => ((value - min) / (max - min)) * range;
}

export function categoricalScale(categories: string[], range: number): (category: string) => number {
    return (category: string) => {
        const idx = categories.indexOf(category);
        if (idx === -1) return 0;
        return (idx / categories.length) * range + (range / categories.length) / 2;
    };
}

export function computeNiceDomain(data: number[]): [number, number] {
    const validData = data.filter(v => !isNaN(v));
    if (validData.length === 0) return [0, 1];
    
    let min = Math.min(...validData);
    let max = Math.max(...validData);
    
    if (min === max) {
        min -= 1;
        max += 1;
    }
    
    // Very simple nice-ing for now
    const range = max - min;
    const padding = range * 0.05;
    return [min - padding, max + padding];
}

export function getTickValues(min: number, max: number, spacing: number): number[] {
    if (spacing <= 0) return [];
    const ticks = [];
    const start = Math.ceil(min / spacing) * spacing;
    for (let i = start; i <= max + 1e-9; i += spacing) {
        ticks.push(i);
    }
    return ticks;
}
