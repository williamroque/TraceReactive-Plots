export interface ChartFrameConfig {
    width: number;
    height: number;
    backgroundColor: string;
    margin?: { top: number; right: number; bottom: number; left: number };
}

export const defaultMargin = { top: 40, right: 30, bottom: 60, left: 70 };

export function createChartFrame(config: ChartFrameConfig): { svg: string, innerW: number, innerH: number, margin: typeof defaultMargin } {
    const margin = config.margin || defaultMargin;
    const innerW = config.width - margin.left - margin.right;
    const innerH = config.height - margin.top - margin.bottom;
    
    let svg = `<svg width="${config.width}" height="${config.height}" viewBox="0 0 ${config.width} ${config.height}" style="max-width: 100%; max-height: 100%; object-fit: contain; background-color: ${config.backgroundColor};" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g class="main-group" transform="translate(${margin.left},${margin.top})">`;
    
    return { svg, innerW, innerH, margin };
}

import { renderLabel } from './latex';

export function closeChartFrame(svg: string, title: string, width: number, axisColor: string, fontFamily: string, titleFontSize: number): string {
    svg += `</g>`;
    
    if (title) {
        const safeFont = fontFamily.replace(/"/g, '&quot;');
        svg += renderLabel(title, width / 2, 20, {
            color: axisColor,
            fontFamily: safeFont,
            fontSize: titleFontSize,
            align: 'middle',
            baseline: 'middle'
        });
    }
    
    svg += `</svg>`;
    return svg;
}
