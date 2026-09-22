import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, createDomainMetadata } from '../helpers';
import { linearScale, computeNiceDomain, getTickValues } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLinePath } from '../svg/series';
import * as mathjs from 'mathjs';

export class ParametricPlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'parametric-plot';
    readonly displayName = 'Parametric Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'X Expression', acceptsType: 'core:expression' },
        { name: 'Y Expression', acceptsType: 'core:expression' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Parametric Curve' },
        { name: 'xExpression', label: 'X(t) Expression', type: 'expression' as const, defaultValue: 'cos(t)' },
        { name: 'yExpression', label: 'Y(t) Expression', type: 'expression' as const, defaultValue: 'sin(t)' },
        { name: 'startT', label: 'Start t', type: 'number' as const, defaultValue: 0 },
        { name: 'endT', label: 'End t', type: 'number' as const, defaultValue: 6.283185307 },
        { name: 'steps', label: 'Steps', type: 'number' as const, defaultValue: 200, min: 2 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.0 }, // Parametric often looks best square
        ...chartStyleProperties,
        { name: 'lineWidth', label: 'Line Width', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotAxisThickness' },
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const exprXInput = inputs['X Expression'];
        const exprYInput = inputs['Y Expression'];
        const exprXStr = (typeof exprXInput === 'string' ? exprXInput : exprXInput?.source) || String(properties['xExpression'] || '');
        const exprYStr = (typeof exprYInput === 'string' ? exprYInput : exprYInput?.source) || String(properties['yExpression'] || '');
        
        if (!exprXStr || !exprYStr) return {};
        
        let compiledX, compiledY;
        try {
            compiledX = mathjs.compile(exprXStr);
            compiledY = mathjs.compile(exprYStr);
        } catch (e) {
            console.error('Failed to compile expressions:', e);
            return {};
        }

        const startT = Number(properties['startT']) || 0;
        const endT = Number(properties['endT']) || (2 * Math.PI);
        const steps = Math.max(Number(properties['steps']) || 200, 2);
        
        if (startT >= endT) return {};

        const xData = new Array(steps);
        const yData = new Array(steps);
        
        const stepSize = (endT - startT) / (steps - 1);
        
        for (let i = 0; i < steps; i++) {
            const t = startT + i * stepSize;
            try {
                const x = compiledX.evaluate({ t });
                const y = compiledY.evaluate({ t });
                xData[i] = typeof x === 'number' && isFinite(x) ? x : NaN;
                yData[i] = typeof y === 'number' && isFinite(y) ? y : NaN;
            } catch (e) {
                xData[i] = NaN;
                yData[i] = NaN;
            }
        }
        
        const validX = xData.filter(v => !isNaN(v));
        const validY = yData.filter(v => !isNaN(v));
        if (validX.length === 0 || validY.length === 0) return {};

        const aspectRatio = Number(properties['aspectRatio']) || 1.0;
        const totalW = 500;
        const totalH = totalW / aspectRatio;
        
        const [xMin, xMax] = computeNiceDomain(validX);
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
                : getTickValues(xMin, xMax, (xMax - xMin) / 5);
                
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
            });
        }
        
        if (properties['showYMajorTicks']) {
            const ticks = properties['yMajorTickSpacing'] > 0 
                ? getTickValues(yMin, yMax, properties['yMajorTickSpacing'])
                : getTickValues(yMin, yMax, (yMax - yMin) / 5);
                
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
            });
        }
        
        const lineWidth = Number(properties['lineWidth']) || 2;
        const color = properties['plotPrimaryColor'] || '#77E4FF';
        
        svg += renderLinePath(xData, yData, xScale, yScale, color, lineWidth);
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg,
            _domain: createDomainMetadata(xMin, xMax, yMin, yMax),
            _plotData: { xData, yDataSeries: [yData], seriesType: 'line', style: { lineWidth, isCategoricalX: false } }
        };
    }
}
