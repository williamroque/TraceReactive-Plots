export interface ChartFrameConfig {
    width: number;
    height: number;
    backgroundColor: string;
    margin?: { top: number; right: number; bottom: number; left: number };
}

export const defaultMargin = { top: 60, right: 30, bottom: 60, left: 70 };

export function computeAdaptiveMargins(properties?: Record<string, any>): { top: number, right: number, bottom: number, left: number } {
    if (!properties) return defaultMargin;
    
    // Use explicitly defined margins, fallback to defaults if not provided or invalid
    const top = properties['plotMarginTop'] !== undefined ? Number(properties['plotMarginTop']) : defaultMargin.top;
    const right = properties['plotMarginRight'] !== undefined ? Number(properties['plotMarginRight']) : defaultMargin.right;
    const bottom = properties['plotMarginBottom'] !== undefined ? Number(properties['plotMarginBottom']) : defaultMargin.bottom;
    const left = properties['plotMarginLeft'] !== undefined ? Number(properties['plotMarginLeft']) : defaultMargin.left;
    
    return { 
        top: isNaN(top) ? defaultMargin.top : top, 
        right: isNaN(right) ? defaultMargin.right : right, 
        bottom: isNaN(bottom) ? defaultMargin.bottom : bottom, 
        left: isNaN(left) ? defaultMargin.left : left 
    };
}

export function createChartFrame(config: ChartFrameConfig, properties?: Record<string, any>): { svg: string, innerW: number, innerH: number, margin: typeof defaultMargin, totalW: number, totalH: number } {
    const margin = config.margin || computeAdaptiveMargins(properties);
    
    // Base dimensions completely rigidly locked to exactly what the node requested
    const totalW = config.width;
    const totalH = config.height;

    const innerW = totalW - margin.left - margin.right;
    const innerH = totalH - margin.top - margin.bottom;
    
    // Render the SVG with exact physical width/height and overflow visible so long text acts like standard html elements
    let svg = `<svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" style="overflow: visible; max-width: 100%; max-height: 100%; object-fit: contain;" xmlns="http://www.w3.org/2000/svg">`;
    if (config.backgroundColor && config.backgroundColor !== 'transparent' && config.backgroundColor !== 'rgba(0,0,0,0)' && config.backgroundColor !== '#00000000') {
        svg += `<rect width="100%" height="100%" fill="${config.backgroundColor}" />`;
    }
    svg += `<g class="main-group" transform="translate(${margin.left},${margin.top})">`;
    
    return { svg, innerW, innerH, margin, totalW, totalH };
}

import { renderLabel } from './latex';

export function closeChartFrame(svg: string, title: string, frame: { totalW: number, innerW: number, margin: { left: number } }, axisColor: string, fontFamily: string, titleFontSize: number): string {
    svg += `<!--OVERLAYS--></g>`;
    
    if (title) {
        const safeFont = fontFamily.replace(/"/g, '&quot;');
        const titleX = frame.margin.left + frame.innerW / 2;
        const titleY = frame.margin.top / 2;
        svg += renderLabel(title, titleX, titleY, {
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
