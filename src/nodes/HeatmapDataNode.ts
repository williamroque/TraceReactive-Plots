import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { interpolateColor, hexToRgb } from '../svg/colors';
import { categoricalScale } from '../svg/scales';
import { getColumnData, createDomainMetadata } from '../helpers';

export class HeatmapDataNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'heatmap-data';
    readonly displayName = 'Heatmap (Data)';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Heatmap' },
        { name: 'xColumn', label: 'Row Label Column', type: 'string' as const, defaultValue: '' },
        { name: 'valueColumns', label: 'Value Columns (comma-sep)', type: 'string' as const, defaultValue: '' },
        { name: 'showValues', label: 'Show Values', type: 'boolean' as const, defaultValue: true },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.0 },
        
        { name: 'colorLow', label: 'Low Value Color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: '#f8f9fa' }, // Off-white
        { name: 'colorHigh', label: 'High Value Color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotPrimaryColor' },
        
        { name: 'plotBackgroundColor', label: 'Background', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotBackgroundColor' },
        { name: 'plotAxisColor', label: 'Label color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotAxisColor' },
        { name: 'plotFontFamily', label: 'Font family', type: 'style' as const, styleType: 'font' as const, category: 'style' as const, defaultValue: 'theme:plotFontFamily' },
        { name: 'plotFontSize', label: 'Font size', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotFontSize' },
        { name: 'plotTitleFontSize', label: 'Title font size', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotTitleFontSize' }
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['xColumn'] || !properties['valueColumns']) return {};
        
        const xCol = String(properties['xColumn']);
        const valCols = String(properties['valueColumns']).split(',').map(s => s.trim()).filter(Boolean);
        
        if (valCols.length === 0) return {};
        
        const rowLabelsRaw = getColumnData(data, xCol);
        if (rowLabelsRaw.length === 0) return {};
        
        const rowLabels = rowLabelsRaw.map(String);
        const colLabels = valCols;
        
        const zData: number[][] = []; // [colIdx][rowIdx]
        let zMin = Infinity;
        let zMax = -Infinity;
        
        for (const col of valCols) {
            const colData = getColumnData(data, col).map(v => Number(v));
            zData.push(colData);
            for (const val of colData) {
                if (!isNaN(val)) {
                    if (val < zMin) zMin = val;
                    if (val > zMax) zMax = val;
                }
            }
        }
        
        if (zMin === Infinity) return {};
        if (zMin === zMax) { zMin -= 1; zMax += 1; }

        const aspectRatio = Number(properties['aspectRatio']) || 1.0;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        // Extra margin for labels
        const margin = { top: 40, right: 30, bottom: 80, left: 100 };
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor'],
            margin
        });
        
        let svg = frame.svg;
        
        const cellW = frame.innerW / colLabels.length;
        const cellH = frame.innerH / rowLabels.length;
        
        const colorLow = properties['colorLow'] || '#f8f9fa';
        const colorHigh = properties['colorHigh'] || '#77E4FF';
        
        const fontFamily = properties['plotFontFamily'];
        const fontSize = properties['plotFontSize'];
        const labelColor = properties['plotAxisColor'];
        
        // Calculate perceived brightness to choose contrasting text color
        const getLuminance = (r: number, g: number, b: number) => 0.299*r + 0.587*g + 0.114*b;
        
        // Render Heatmap cells
        let cellsSvg = '';
        for (let c = 0; c < colLabels.length; c++) {
            const px = c * cellW;
            for (let r = 0; r < rowLabels.length; r++) {
                const py = r * cellH;
                const val = zData[c][r];
                
                if (!isNaN(val)) {
                    const color = interpolateColor(val, zMin, zMax, colorLow, colorHigh);
                    cellsSvg += `<rect x="${px}" y="${py}" width="${cellW * 1.02}" height="${cellH * 1.02}" fill="${color}" stroke="none" />`;
                    
                    if (properties['showValues']) {
                        const rgb = hexToRgb(color) || { r: 128, g: 128, b: 128 };
                        const lum = getLuminance(rgb.r, rgb.g, rgb.b);
                        const textColor = lum > 128 ? '#000000' : '#ffffff';
                        const textVal = Number.isInteger(val) ? val.toString() : parseFloat(val.toPrecision(3)).toString();
                        
                        cellsSvg += `<text x="${px + cellW/2}" y="${py + cellH/2}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-size="${fontSize * 0.9}px" opacity="0.8">${textVal}</text>`;
                    }
                }
            }
        }
        svg += cellsSvg;
        
        // Row Labels (Y axis)
        let yLabelsSvg = `<g font-family="${fontFamily}" font-size="${fontSize}" fill="${labelColor}">`;
        for (let r = 0; r < rowLabels.length; r++) {
            const py = r * cellH + cellH / 2;
            yLabelsSvg += `<text x="-10" y="${py}" text-anchor="end" dominant-baseline="middle">${rowLabels[r]}</text>`;
        }
        yLabelsSvg += `</g>`;
        svg += yLabelsSvg;
        
        // Col Labels (X axis)
        let xLabelsSvg = `<g font-family="${fontFamily}" font-size="${fontSize}" fill="${labelColor}" transform="translate(0, ${frame.innerH + 20})">`;
        for (let c = 0; c < colLabels.length; c++) {
            const px = c * cellW + cellW / 2;
            // Rotate text for x axis
            xLabelsSvg += `<text x="0" y="0" transform="translate(${px}, 0) rotate(-45)" text-anchor="end">${colLabels[c]}</text>`;
        }
        xLabelsSvg += `</g>`;
        svg += xLabelsSvg;
        
        svg = closeChartFrame(svg, properties['title'], totalW, labelColor, fontFamily, properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg,
            _domain: createDomainMetadata(0, colLabels.length, 0, rowLabels.length),
            _plotData: { xData: colLabels, yDataSeries: zData, rowLabels, seriesType: 'heatmap' }
        };
    }
}
