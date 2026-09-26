import { renderLabel } from './latex';

export interface LegendItem {
    label: string;
    color: string;
}

export interface LegendConfig {
    items: LegendItem[];
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom' | 'right' | 'left';
    innerW: number;
    innerH: number;
    fontFamily: string;
    fontSize: number;
    textColor: string;
    backgroundColor?: string;
    borderColor?: string;
}

export function renderLegend(config: LegendConfig): string {
    if (!config.items || config.items.length === 0) return '';
    
    // Configurable spacing
    const padding = 10;
    const itemHeight = config.fontSize * 1.5;
    const symbolWidth = 15;
    const symbolSpacing = 5;
    
    // Estimate width based on labels
    const maxLabelLen = Math.max(...config.items.map(it => it.label.length));
    const estimatedWidth = maxLabelLen * (config.fontSize * 0.6) + symbolWidth + symbolSpacing + padding * 2;
    const estimatedHeight = config.items.length * itemHeight + padding * 2;
    
    // Determine placement based on position
    let x = 0;
    let y = 0;
    
    const margin = 15;
    
    switch (config.position) {
        case 'top-left':
            x = margin;
            y = margin;
            break;
        case 'top-right':
            x = config.innerW - estimatedWidth - margin;
            y = margin;
            break;
        case 'bottom-left':
            x = margin;
            y = config.innerH - estimatedHeight - margin;
            break;
        case 'bottom-right':
            x = config.innerW - estimatedWidth - margin;
            y = config.innerH - estimatedHeight - margin;
            break;
        case 'top':
            x = (config.innerW - estimatedWidth) / 2;
            y = margin;
            break;
        case 'bottom':
            x = (config.innerW - estimatedWidth) / 2;
            y = config.innerH - estimatedHeight - margin;
            break;
        case 'right':
            x = config.innerW - estimatedWidth - margin;
            y = (config.innerH - estimatedHeight) / 2;
            break;
        case 'left':
            x = margin;
            y = (config.innerH - estimatedHeight) / 2;
            break;
    }
    
    let svg = `<g class="legend" transform="translate(${x}, ${y})">`;
    
    // Background
    if (config.backgroundColor || config.borderColor) {
        const fill = config.backgroundColor || 'transparent';
        const stroke = config.borderColor || 'none';
        svg += `<rect x="0" y="0" width="${estimatedWidth}" height="${estimatedHeight}" fill="${fill}" stroke="${stroke}" stroke-width="1" rx="4" ry="4" opacity="0.9" />`;
    }
    
    // Items
    config.items.forEach((item, i) => {
        const itemY = padding + i * itemHeight;
        const cy = itemY + config.fontSize / 2;
        
        // Symbol (line/rect)
        svg += `<line x1="${padding}" y1="${cy}" x2="${padding + symbolWidth}" y2="${cy}" stroke="${item.color}" stroke-width="3" />`;
        
        // Label using MathJax to support LaTeX
        svg += renderLabel(item.label, padding + symbolWidth + symbolSpacing, cy, {
            fontSize: config.fontSize,
            color: config.textColor,
            fontFamily: config.fontFamily,
            align: 'start',
            baseline: 'middle'
        });
    });
    
    svg += `</g>`;
    return svg;
}
