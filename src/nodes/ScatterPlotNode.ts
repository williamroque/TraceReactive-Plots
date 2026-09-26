import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, chartLabelProperties, chartLegendProperties, getColumnData, createDomainMetadata  } from '../helpers';
import { linearScale, categoricalScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLegend } from '../svg/legend';
import { renderScatterPoints } from '../svg/series';
import { getSeriesColor, interpolateColor } from '../svg/colors';

export class ScatterPlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'scatter-plot';
    readonly displayName = 'Scatter Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'string' as const, defaultValue: 'Scatter Plot' },
        { name: 'xColumn', label: 'X Column', type: 'string' as const, defaultValue: '' },
        { name: 'yColumn', label: 'Y Column', type: 'string' as const, defaultValue: '' },
        { name: 'sizeColumn', label: 'Size Column (Optional)', type: 'string' as const, defaultValue: '' },
        { name: 'colorColumn', label: 'Color Column (Optional)', type: 'string' as const, defaultValue: '' },
        { name: 'radius', label: 'Point Radius', type: 'number' as const, defaultValue: 4 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.0 }, // Scatters look better square
        ...chartStyleProperties,
        ...chartAxisProperties,
        ...chartLabelProperties,
        ...chartLegendProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['xColumn'] || !properties['yColumn']) return {};
        
        const xCol = String(properties['xColumn']);
        const yCol = String(properties['yColumn']);
        
        const xDataRaw = getColumnData(data, xCol);
        const yData = getColumnData(data, yCol).map(v => Number(v));
        
        if (xDataRaw.length === 0) return {};
        
        const sizeCol = String(properties['sizeColumn'] || '');
        const sizeData = sizeCol ? getColumnData(data, sizeCol).map(v => Number(v)) : [];
        
        const colorCol = String(properties['colorColumn'] || '');
        const colorData = colorCol ? getColumnData(data, colorCol).map(v => Number(v)) : [];

        const aspectRatio = Number(properties['aspectRatio']) || 1.0;
        const totalW = 500;
        const totalH = totalW / aspectRatio;
        
        const isCategoricalX = typeof xDataRaw[0] === 'string' || typeof xDataRaw[0] === 'boolean';
        const xData = isCategoricalX ? xDataRaw : xDataRaw.map(v => Number(v));
        
        // Domain X
        let xMin = 0, xMax = 0;
        if (!isCategoricalX) {
            [xMin, xMax] = computeNiceDomain(xData as number[]);
        }
        
        // Domain Y
        const [yMin, yMax] = computeNiceDomain(yData);
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        
        const xScale = isCategoricalX 
            ? categoricalScale(xDataRaw, frame.innerW) 
            : linearScale(xMin, xMax, frame.innerW);
            
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        // Axes
        if (properties['showXMajorTicks']) {
            let ticks = [];
            if (isCategoricalX) {
                ticks = [...new Set(xDataRaw)];
            } else if (properties['xMajorTickSpacing'] > 0) {
                ticks = getTickValues(xMin, xMax, properties['xMajorTickSpacing']);
            } else {
                ticks = getTickValues(xMin, xMax, getAutoTickSpacing(xMin, xMax));
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
        
        // Size computation
        let sizeFn: number | ((i: number) => number) = Number(properties['radius']) || 4;
        if (sizeData.length > 0) {
            const [sMin, sMax] = computeNiceDomain(sizeData);
            const scaleSize = linearScale(sMin, sMax, 10); // scale size delta from 0 to 10
            sizeFn = (i: number) => 2 + scaleSize(sizeData[i]); // min radius 2, max 12
        }
        
        // Color computation
        let colorFn: string | ((i: number) => string) = properties['plotPrimaryColor'] || getSeriesColor(0, properties);
        if (colorData.length > 0) {
            const [cMin, cMax] = computeNiceDomain(colorData);
            const lowColor = properties['plotPrimaryColor'];
            const highColor = properties['plotSecondaryColor'];
            colorFn = (i: number) => interpolateColor(colorData[i], cMin, cMax, lowColor, highColor);
        }
        
        svg += renderScatterPoints(xData, yData, xScale, yScale, sizeFn, colorFn);
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        renderData._plotData = { xData, yDataSeries: [yData], seriesType: 'scatter', style: { sizeFn, colorFn, isCategoricalX } };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
