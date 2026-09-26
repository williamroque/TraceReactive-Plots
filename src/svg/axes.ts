export interface AxisConfig {
    scale: (val: any) => number;
    ticks: any[];
    isCategorical: boolean;
    innerW: number;
    innerH: number;
    axisColor: string;
    axisThickness: number;
    fontFamily: string;
    fontSize: number;
    gridColor?: string;
    gridThickness?: number;
    showGrid?: boolean;
    thousandsSeparator?: string;
    label?: string;
}

import { renderLabel } from './latex';

export function renderXAxis(config: AxisConfig): string {
    const safeFont = config.fontFamily.replace(/"/g, '&quot;');
    let svg = `<g class="x-axis" transform="translate(0,${config.innerH})" font-family="${safeFont}" font-size="${config.fontSize}" fill="${config.axisColor}">`;
    svg += `<line x1="0" y1="0" x2="${config.innerW}" y2="0" stroke="${config.axisColor}" stroke-width="${config.axisThickness}" />`;
    
    config.ticks.forEach(tick => {
        const xPos = config.scale(tick);
        
        // Grid line
        if (config.showGrid && config.gridColor) {
            svg += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="${-config.innerH}" stroke="${config.gridColor}" stroke-width="${config.gridThickness || 1}" opacity="0.5" />`;
        }
        
        // Tick mark
        svg += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="6" stroke="${config.axisColor}" stroke-width="${config.axisThickness}" />`;
        
        // Label
        let labelStr = config.isCategorical ? tick : parseFloat(Number(tick).toPrecision(4)).toString();
        if (!config.isCategorical && config.thousandsSeparator) {
            const parts = labelStr.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
            labelStr = parts.join('.');
        }
        svg += renderLabel(labelStr, xPos, 20, {
            color: config.axisColor,
            fontFamily: safeFont,
            fontSize: config.fontSize,
            align: 'middle',
            baseline: 'hanging'
        });
    });
    
    // Axis Label
    if (config.label) {
        svg += renderLabel(config.label, config.innerW / 2, 40, {
            color: config.axisColor,
            fontFamily: safeFont,
            fontSize: config.fontSize * 1.1,
            align: 'middle',
            baseline: 'middle'
        });
    }
    
    svg += `</g>`;
    return svg;
}

export function renderYAxis(config: AxisConfig): string {
    const safeFont = config.fontFamily.replace(/"/g, '&quot;');
    let svg = `<g class="y-axis" font-family="${safeFont}" font-size="${config.fontSize}" fill="${config.axisColor}">`;
    svg += `<line x1="0" y1="0" x2="0" y2="${config.innerH}" stroke="${config.axisColor}" stroke-width="${config.axisThickness}" />`;
    
    config.ticks.forEach(tick => {
        const yPos = config.scale(tick);
        
        // Grid line
        if (config.showGrid && config.gridColor) {
            svg += `<line x1="0" y1="${yPos}" x2="${config.innerW}" y2="${yPos}" stroke="${config.gridColor}" stroke-width="${config.gridThickness || 1}" opacity="0.5" />`;
        }
        
        // Tick mark
        svg += `<line x1="-6" y1="${yPos}" x2="0" y2="${yPos}" stroke="${config.axisColor}" stroke-width="${config.axisThickness}" />`;
        
        // Label
        let labelStr = config.isCategorical ? tick : parseFloat(Number(tick).toPrecision(4)).toString();
        if (!config.isCategorical && config.thousandsSeparator) {
            const parts = labelStr.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
            labelStr = parts.join('.');
        }
        svg += renderLabel(labelStr, -10, yPos, {
            color: config.axisColor,
            fontFamily: safeFont,
            fontSize: config.fontSize,
            align: 'end',
            baseline: 'middle'
        });
    });
    
    // Axis Label
    if (config.label) {
        svg += renderLabel(config.label, -40 - config.fontSize * 1.5, config.innerH / 2, {
            color: config.axisColor,
            fontFamily: safeFont,
            fontSize: config.fontSize * 1.1,
            align: 'middle',
            baseline: 'middle',
            rotation: -90
        });
    }
    
    svg += `</g>`;
    return svg;
}
