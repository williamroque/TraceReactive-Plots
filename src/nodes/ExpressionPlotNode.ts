import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, chartLabelProperties, chartLegendProperties, createDomainMetadata  } from '../helpers';
import { linearScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLegend } from '../svg/legend';
import { renderLinePath } from '../svg/series';
import * as mathjs from 'mathjs';

export class ExpressionPlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'expression-plot';
    readonly displayName = 'Expression Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Expression', acceptsType: 'core:expression' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'string' as const, defaultValue: 'y = f(x)' },
        { name: 'expression', label: 'Expression', type: 'expression' as const, defaultValue: 'sin(x)' },
        { name: 'startX', label: 'Start X', type: 'number' as const, defaultValue: -10 },
        { name: 'endX', label: 'End X', type: 'number' as const, defaultValue: 10 },
        { name: 'steps', label: 'Steps', type: 'number' as const, defaultValue: 200, min: 2 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        { name: 'lineWidth', label: 'Line Width', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:com.tracereactive.plots.plotAxisThickness' },
        ...chartAxisProperties,
        ...chartLabelProperties,
        ...chartLegendProperties
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

        const startX = Number(properties['startX']) || -10;
        const endX = Number(properties['endX']) || 10;
        const steps = Math.max(Number(properties['steps']) || 200, 2);
        
        if (startX >= endX) return {};

        const xData = new Array(steps);
        const yData = new Array(steps);
        
        const stepSize = (endX - startX) / (steps - 1);
        
        for (let i = 0; i < steps; i++) {
            const x = startX + i * stepSize;
            xData[i] = x;
            try {
                const y = compiled.evaluate({ x });
                yData[i] = typeof y === 'number' && isFinite(y) ? y : NaN;
            } catch (e) {
                yData[i] = NaN;
            }
        }
        
        const validY = yData.filter(v => !isNaN(v));
        if (validY.length === 0) return {};

        const aspectRatio = Number(properties['aspectRatio']) || 1.6;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const [xMin, xMax] = computeNiceDomain([startX, endX]);
        const [yMin, yMax] = computeNiceDomain(validY);
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        
        const xScale = linearScale(xMin, xMax, frame.innerW);
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        // Axes
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
                showGrid: properties['showGrid'],
                thousandsSeparator: properties['thousandsSeparator'],
                label: properties['xLabel']
            });
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
                showGrid: properties['showGrid'],
                thousandsSeparator: properties['thousandsSeparator'],
                label: properties['xLabel']
            });
        }
        
        const lineWidth = Number(properties['lineWidth']) || 2;
        const color = properties['plotPrimaryColor'] || '#77E4FF';
        
        svg += renderLinePath(xData, yData, xScale, yScale, color, lineWidth);
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        renderData._plotData = { xData, yDataSeries: [yData], seriesType: 'line', style: { lineWidth, isCategoricalX: false } };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
