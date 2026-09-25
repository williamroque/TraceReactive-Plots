import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { getColumnData } from '../helpers';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderPieSlices } from '../svg/series';
import { getSeriesColor } from '../svg/colors';

export class PieDonutNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'pie-donut';
    readonly displayName = 'Pie/Donut Chart';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Pie Chart' },
        { name: 'labelColumn', label: 'Label Column', type: 'string' as const, defaultValue: '' },
        { name: 'valueColumn', label: 'Value Column', type: 'string' as const, defaultValue: '' },
        { name: 'donut', label: 'Donut Chart', type: 'boolean' as const, defaultValue: false },
        { name: 'showLabels', label: 'Show Labels', type: 'boolean' as const, defaultValue: true },
        { name: 'showPercentages', label: 'Show Percentages', type: 'boolean' as const, defaultValue: true },
        
        { name: 'plotBackgroundColor', label: 'Background', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotBackgroundColor' },
        { name: 'plotFontFamily', label: 'Font family', type: 'style' as const, styleType: 'font' as const, category: 'style' as const, defaultValue: 'theme:plotFontFamily' },
        { name: 'plotFontSize', label: 'Font size', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotFontSize' },
        { name: 'plotTitleFontSize', label: 'Title font size', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotTitleFontSize' },
        { name: 'plotLabelColor', label: 'Label color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotLabelColor' }
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['labelColumn'] || !properties['valueColumn']) return {};
        
        const labelCol = String(properties['labelColumn']);
        const valCol = String(properties['valueColumn']);
        
        const labels = getColumnData(data, labelCol).map(String);
        const values = getColumnData(data, valCol).map(v => Number(v));
        
        if (labels.length === 0 || values.length === 0) return {};
        
        const total = values.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
        if (total === 0) return {};

        const totalW = 500;
        const totalH = 500; // Force square
        
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor'],
            margin
        });
        
        let svg = frame.svg;
        
        const cx = frame.innerW / 2;
        const cy = frame.innerH / 2;
        const radius = Math.min(frame.innerW, frame.innerH) / 2;
        const innerRadius = properties['donut'] ? radius * 0.6 : 0;
        
        const colors = labels.map((_, i) => getSeriesColor(i, properties));
        
        svg += renderPieSlices(values, cx, cy, innerRadius, radius, colors);
        
        // Add labels
        if (properties['showLabels']) {
            const fontFamily = properties['plotFontFamily'];
            const fontSize = properties['plotFontSize'];
            const labelColor = properties['plotLabelColor'];
            
            let labelSvg = `<g font-family="${fontFamily}" font-size="${fontSize}" fill="${labelColor}">`;
            let currentAngle = -Math.PI / 2;
            
            for (let i = 0; i < values.length; i++) {
                const val = values[i];
                if (val <= 0) continue;
                
                const fraction = val / total;
                const angle = fraction * Math.PI * 2;
                const midAngle = currentAngle + angle / 2;
                
                const labelRadius = properties['donut'] ? radius * 0.8 : radius * 0.7;
                const lx = cx + Math.cos(midAngle) * labelRadius;
                const ly = cy + Math.sin(midAngle) * labelRadius;
                
                let text = labels[i];
                if (properties['showPercentages']) {
                    const pct = Math.round(fraction * 100);
                    text += ` (${pct}%)`;
                }
                
                // If it's a very thin slice, labels might overlap, but keep it simple for now
                if (fraction > 0.02) {
                    labelSvg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-weight="bold" fill="#fff" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.5))">${text}</text>`;
                }
                
                currentAngle += angle;
            }
            labelSvg += `</g>`;
            svg += labelSvg;
        }
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotLabelColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._plotData = { labels, values, seriesType: 'pie' };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
