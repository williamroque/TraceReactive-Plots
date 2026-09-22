import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, getColumnData, createDomainMetadata } from '../helpers';
import { linearScale, categoricalScale, computeNiceDomain, getTickValues } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLinePath } from '../svg/series';
import { getSeriesColor } from '../svg/colors';

export class LinePlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'line-plot';
    readonly displayName = 'Line Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Line Plot' },
        { name: 'xColumn', label: 'X Column', type: 'string' as const, defaultValue: '' },
        { name: 'yColumns', label: 'Y Columns (comma-separated)', type: 'string' as const, defaultValue: '' },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        { name: 'lineWidth', label: 'Line Width', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:plotAxisThickness' },
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['xColumn'] || !properties['yColumns']) return {};
        
        const xCol = String(properties['xColumn']);
        const yCols = String(properties['yColumns']).split(',').map(s => s.trim()).filter(Boolean);
        
        if (yCols.length === 0) return {};
        
        const xData = getColumnData(data, xCol);
        const yDataSeries = yCols.map(col => getColumnData(data, col).map(v => Number(v)));
        
        if (xData.length === 0) return {};

        const aspectRatio = Number(properties['aspectRatio']) || 1.6;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const isCategoricalX = typeof xData[0] === 'string' || typeof xData[0] === 'boolean';
        
        // Domain X
        let xMin = 0, xMax = 0;
        if (!isCategoricalX) {
            const xNums = xData.map(v => Number(v));
            [xMin, xMax] = computeNiceDomain(xNums);
        }
        
        // Domain Y
        const allY = yDataSeries.flat().filter(v => !isNaN(v));
        const [yMin, yMax] = computeNiceDomain(allY);
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        
        const xScale = isCategoricalX 
            ? categoricalScale(xData, frame.innerW) 
            : linearScale(xMin, xMax, frame.innerW);
            
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        // Axes
        if (properties['showXMajorTicks']) {
            let ticks = [];
            if (isCategoricalX) {
                ticks = [...new Set(xData)];
            } else if (properties['xMajorTickSpacing'] > 0) {
                ticks = getTickValues(xMin, xMax, properties['xMajorTickSpacing']);
            }
            
            svg += renderXAxis({
                scale: xScale,
                ticks,
                isCategorical: isCategoricalX,
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
        
        // Series
        const lineWidth = Number(properties['lineWidth']) || 2;
        yDataSeries.forEach((yData, i) => {
            const color = getSeriesColor(i, properties);
            svg += renderLinePath(xData, yData, xScale, yScale, color, lineWidth);
        });
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg,
            _domain: createDomainMetadata(xMin, xMax, yMin, yMax),
            _plotData: { xData, yDataSeries, seriesType: 'line', style: { lineWidth, isCategoricalX } }
        };
    }
}
