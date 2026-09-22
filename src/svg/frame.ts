export interface ChartFrameConfig {
    width: number;
    height: number;
    backgroundColor: string;
    margin?: { top: number; right: number; bottom: number; left: number };
}

export const defaultMargin = { top: 40, right: 30, bottom: 40, left: 60 };

export function createChartFrame(config: ChartFrameConfig): { svg: string, innerW: number, innerH: number, margin: typeof defaultMargin } {
    const margin = config.margin || defaultMargin;
    const innerW = config.width - margin.left - margin.right;
    const innerH = config.height - margin.top - margin.bottom;
    
    let svg = `<svg width="${config.width}" height="${config.height}" viewBox="0 0 ${config.width} ${config.height}" style="max-width: 100%; max-height: 100%; object-fit: contain; background-color: ${config.backgroundColor};" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g class="main-group" transform="translate(${margin.left},${margin.top})">`;
    
    return { svg, innerW, innerH, margin };
}

export function closeChartFrame(svg: string, title: string, width: number, axisColor: string, fontFamily: string, titleFontSize: number): string {
    svg += `</g>`;
    
    if (title) {
        svg += `<text class="plot-title" x="${width / 2}" y="20" text-anchor="middle" fill="${axisColor}" font-family="${fontFamily}" font-size="${titleFontSize}px">${title}</text>`;
    }
    
    svg += `</svg>`;
    return svg;
}
