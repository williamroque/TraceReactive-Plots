export interface ChartFrameConfig {
    width: number;
    height: number;
    backgroundColor: string;
    margin?: { top: number; right: number; bottom: number; left: number };
}

export const defaultMargin = { top: 40, right: 30, bottom: 60, left: 70 };

export function computeAdaptiveMargins(properties?: Record<string, any>): { top: number, right: number, bottom: number, left: number } {
    if (!properties) return defaultMargin;
    
    const fontSize = Number(properties['plotFontSize']) || 12;
    const titleSize = Number(properties['plotTitleFontSize']) || 16;
    
    const hasTitle = !!properties['title'];
    const hasXLabel = !!properties['xLabel'];
    const hasYLabel = !!properties['yLabel'];
    
    // Top margin: title rendered at y=20 (middle baseline). 
    // Need space = 20 + titleSize/2 + padding
    const top = hasTitle ? 20 + titleSize * 0.8 : 15;
    
    // Bottom margin: X ticks + X axis label
    const showXTicks = properties['showXMajorTicks'] !== false;
    const tickH = showXTicks ? 10 + fontSize * 1.5 : 10;
    const xLabelH = hasXLabel ? 5 + fontSize * 1.2 : 0;
    const bottom = tickH + xLabelH + 5; // minimal padding
    
    // Left margin: Y ticks + Y axis label
    const showYTicks = properties['showYMajorTicks'] !== false;
    const tickW = showYTicks ? 10 + fontSize * 2.5 : 10; // enough for ~4-5 chars
    const yLabelW = hasYLabel ? 5 + fontSize * 1.2 : 0;
    const left = tickW + yLabelW + 10;
    
    const right = 30;
    
    return { top, right, bottom, left };
}

export function createChartFrame(config: ChartFrameConfig, properties?: Record<string, any>): { svg: string, innerW: number, innerH: number, margin: typeof defaultMargin, totalW: number, totalH: number } {
    const margin = config.margin || computeAdaptiveMargins(properties);
    
    // Treat config.width and config.height as the total dimensions
    const totalW = config.width;
    const totalH = config.height;
    
    const innerW = Math.max(10, totalW - margin.left - margin.right);
    const innerH = Math.max(10, totalH - margin.top - margin.bottom);
    
    let svg = `<svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" style="max-width: 100%; max-height: 100%; object-fit: contain; background-color: ${config.backgroundColor};" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g class="main-group" transform="translate(${margin.left},${margin.top})">`;
    
    return { svg, innerW, innerH, margin, totalW, totalH };
}

import { renderLabel } from './latex';

export function closeChartFrame(svg: string, title: string, frame: { totalW: number, innerW: number, margin: { left: number } }, axisColor: string, fontFamily: string, titleFontSize: number): string {
    svg += `<!--OVERLAYS--></g>`;
    
    if (title) {
        const safeFont = fontFamily.replace(/"/g, '&quot;');
        const titleX = frame.margin.left + frame.innerW / 2;
        svg += renderLabel(title, titleX, 20, {
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
