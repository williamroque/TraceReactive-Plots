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
    
    // Fix precision issues that can cause infinite loops or skipped ticks
    const epsilon = 1e-10;
    const ticks = [];
    
    let start = Math.ceil((min - epsilon) / spacing) * spacing;
    // Fix floating point math quirks with zero
    if (Math.abs(start) < epsilon) start = 0;
    
    for (let i = start; i <= max + epsilon; i += spacing) {
        // Round to prevent floating point accumulation like 0.30000000000000004
        ticks.push(Number(i.toPrecision(12)));
    }
    return ticks;
}

export function getAutoTickSpacing(min: number, max: number, maxTicks: number = 5): number {
    const span = max - min;
    if (span === 0) return 1;
    
    const rawStep = span / maxTicks;
    const mag = Math.floor(Math.log10(rawStep));
    const magPow = Math.pow(10, mag);
    const magMsd = Math.round(rawStep / magPow);
    
    let stepSize = magPow;
    if (magMsd > 5.0) {
        stepSize = 10 * magPow;
    } else if (magMsd > 2.0) {
        stepSize = 5 * magPow;
    } else if (magMsd > 1.0) {
        stepSize = 2 * magPow;
    }
    
    return Number(stepSize.toPrecision(15));
}
