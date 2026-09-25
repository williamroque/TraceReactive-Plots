import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { interpolateColor } from '../svg/colors';
import { linearScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { chartAxisProperties } from '../helpers';
import * as mathjs from 'mathjs';

export class HeatmapExpressionNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'heatmap-expression';
    readonly displayName = 'Heatmap (Expression)';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Expression', acceptsType: 'core:expression' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Heatmap z = f(x,y)' },
        { name: 'expression', label: 'Expression', type: 'expression' as const, defaultValue: 'sin(x) * cos(y)' },
        { name: 'xMin', label: 'X Min', type: 'number' as const, defaultValue: -5 },
        { name: 'xMax', label: 'X Max', type: 'number' as const, defaultValue: 5 },
        { name: 'yMin', label: 'Y Min', type: 'number' as const, defaultValue: -5 },
        { name: 'yMax', label: 'Y Max', type: 'number' as const, defaultValue: 5 },
        { name: 'resolution', label: 'Resolution (NxN)', type: 'number' as const, defaultValue: 50, min: 2, max: 200 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.0 },
        
        { name: 'colorLow', label: 'Low Value Color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotBackgroundColor' },
        { name: 'colorHigh', label: 'High Value Color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotPrimaryColor' },
        
        { name: 'plotBackgroundColor', label: 'Background', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotBackgroundColor' },
        { name: 'plotAxisColor', label: 'Axis color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:plotAxisColor' },
        { name: 'plotAxisThickness', label: 'Axis thickness', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotAxisThickness' },
        { name: 'plotFontFamily', label: 'Font family', type: 'style' as const, styleType: 'font' as const, category: 'style' as const, defaultValue: 'theme:plotFontFamily' },
        { name: 'plotFontSize', label: 'Font size', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotFontSize' },
        { name: 'plotTitleFontSize', label: 'Title font size', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotTitleFontSize' },
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const exprInput = inputs['Expression'];
        const exprStr = (typeof exprInput === 'string' ? exprInput : exprInput?.source) || String(properties['expression'] || '');
        if (!exprStr) return {};
        
        let compiled;
        try {
            compiled = mathjs.compile(exprStr);
        } catch (e) {
            console.error('Failed to compile expression:', e);
            return {};
        }

        const xMin = Number(properties['xMin']) || -5;
        const xMax = Number(properties['xMax']) || 5;
        const yMin = Number(properties['yMin']) || -5;
        const yMax = Number(properties['yMax']) || 5;
        const res = Math.min(Math.max(Number(properties['resolution']) || 50, 2), 200);
        
        if (xMin >= xMax || yMin >= yMax) return {};

        const zData: number[][] = [];
        let zMin = Infinity;
        let zMax = -Infinity;
        
        const xStep = (xMax - xMin) / (res - 1);
        const yStep = (yMax - yMin) / (res - 1);
        
        for (let i = 0; i < res; i++) {
            const x = xMin + i * xStep;
            const row: number[] = [];
            for (let j = 0; j < res; j++) {
                const y = yMin + j * yStep;
                try {
                    const z = compiled.evaluate({ x, y });
                    const val = typeof z === 'number' && isFinite(z) ? z : NaN;
                    row.push(val);
                    if (!isNaN(val)) {
                        if (val < zMin) zMin = val;
                        if (val > zMax) zMax = val;
                    }
                } catch (e) {
                    row.push(NaN);
                }
            }
            zData.push(row);
        }
        
        if (zMin === Infinity) return {};
        if (zMin === zMax) { zMin -= 1; zMax += 1; }

        const aspectRatio = Number(properties['aspectRatio']) || 1.0;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        
        const xScale = linearScale(xMin, xMax, frame.innerW);
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        const cellW = frame.innerW / (res - 1);
        const cellH = frame.innerH / (res - 1);
        
        const colorLow = properties['colorLow'] || '#00000000';
        const colorHigh = properties['colorHigh'] || '#77E4FF';
        
        // Render Heatmap cells
        // Note: SVG y-axis points down, our logical y-axis points up
        // cell Y position is yScale(y) - cellH
        let cellsSvg = '';
        for (let i = 0; i < res; i++) {
            const x = xMin + i * xStep;
            const px = xScale(x) - cellW / 2;
            
            for (let j = 0; j < res; j++) {
                const z = zData[i][j];
                if (!isNaN(z)) {
                    const y = yMin + j * yStep;
                    const py = yScale(y) - cellH / 2; // Subtract half height to center on coordinate
                    
                    const color = interpolateColor(z, zMin, zMax, colorLow, colorHigh);
                    // Use slightly larger cell to overlap gaps from anti-aliasing
                    cellsSvg += `<rect x="${px}" y="${py}" width="${cellW * 1.05}" height="${cellH * 1.05}" fill="${color}" stroke="none" />`;
                }
            }
        }
        svg += cellsSvg;
        
        // Axes (drawn on top of cells)
        if (properties['showXMajorTicks']) {
            const ticks = properties['xMajorTickSpacing'] > 0 
                ? getTickValues(xMin, xMax, properties['xMajorTickSpacing'])
                : getTickValues(xMin, xMax, getAutoTickSpacing(xMin, xMax));
                
            svg += renderXAxis({
                scale: xScale,
                ticks,
                isCategorical: false,
                innerW: frame.innerW,
                innerH: frame.innerH,
                axisColor: properties['plotAxisColor'],
                axisThickness: properties['plotAxisThickness'] || 1,
                fontFamily: properties['plotFontFamily'],
                fontSize: properties['plotFontSize'],
                gridColor: properties['plotGridColor'],
                gridThickness: properties['plotGridThickness'],
                showGrid: properties['showGrid']
            ,
                thousandsSeparator: properties['thousandsSeparator']});
        }
        
        if (properties['showYMajorTicks']) {
            const ticks = properties['yMajorTickSpacing'] > 0 
                ? getTickValues(yMin, yMax, properties['yMajorTickSpacing'])
                : getTickValues(yMin, yMax, getAutoTickSpacing(yMin, yMax));
                
            svg += renderYAxis({
                scale: yScale,
                ticks,
                isCategorical: false,
                innerW: frame.innerW,
                innerH: frame.innerH,
                axisColor: properties['plotAxisColor'],
                axisThickness: properties['plotAxisThickness'] || 1,
                fontFamily: properties['plotFontFamily'],
                fontSize: properties['plotFontSize'],
                gridColor: properties['plotGridColor'],
                gridThickness: properties['plotGridThickness'],
                showGrid: properties['showGrid']
            ,
                thousandsSeparator: properties['thousandsSeparator']});
        }
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg
        };
    }
}
