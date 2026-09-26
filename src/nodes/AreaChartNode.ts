import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, chartLabelProperties, chartLegendProperties, getColumnData, createDomainMetadata  } from '../helpers';
import { linearScale, categoricalScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLegend } from '../svg/legend';
import { renderArea, renderLinePath } from '../svg/series';
import { getSeriesColor } from '../svg/colors';

export class AreaChartNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'area-chart';
    readonly displayName = 'Area Chart';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'string' as const, defaultValue: 'Area Chart' },
        { name: 'xColumn', label: 'X Column', type: 'string' as const, defaultValue: '' },
        { name: 'yColumns', label: 'Y Columns (comma-separated)', type: 'string' as const, defaultValue: '' },
        { name: 'stacked', label: 'Stacked', type: 'boolean' as const, defaultValue: false },
        { name: 'opacity', label: 'Fill Opacity', type: 'number' as const, defaultValue: 0.3, step: 0.1, min: 0, max: 1 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        { name: 'lineWidth', label: 'Line Width', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:com.tracereactive.plots.plotAxisThickness' },
        ...chartAxisProperties,
        ...chartLabelProperties,
        ...chartLegendProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['xColumn'] || !properties['yColumns']) return {};
        
        const xCol = String(properties['xColumn']);
        const yCols = String(properties['yColumns']).split(',').map(s => s.trim()).filter(Boolean);
        
        if (yCols.length === 0) return {};
        
        const xDataRaw = getColumnData(data, xCol);
        const yDataSeries = yCols.map(col => getColumnData(data, col).map(v => Number(v)));
        
        if (xDataRaw.length === 0) return {};
        
        const isStacked = properties['stacked'] === true;

        const aspectRatio = Number(properties['aspectRatio']) || 1.6;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const isCategoricalX = typeof xDataRaw[0] === 'string' || typeof xDataRaw[0] === 'boolean';
        const xData = isCategoricalX ? xDataRaw : xDataRaw.map(v => Number(v));
        
        // Domain X
        let xMin = 0, xMax = 0;
        if (!isCategoricalX) {
            [xMin, xMax] = computeNiceDomain(xData as number[]);
        }
        
        // Domain Y
        let yMin = 0; // Area charts should almost always start at 0
        let yMax = 0;
        
        if (isStacked) {
            const colSums = new Array(xData.length).fill(0);
            for (let g = 0; g < yCols.length; g++) {
                for (let x = 0; x < xData.length; x++) {
                    colSums[x] += (isNaN(yDataSeries[g][x]) ? 0 : yDataSeries[g][x]);
                }
            }
            yMax = Math.max(...colSums, 1);
        } else {
            const allY = yDataSeries.flat().filter(v => !isNaN(v));
            yMax = Math.max(...allY, 1);
        }
        
        // Re-compute nice domain for max to get padding
        const [, niceMax] = computeNiceDomain([yMin, yMax]);
        yMax = niceMax;
        
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
        
        // Series
        const lineWidth = Number(properties['lineWidth']) || 2;
        const opacity = Number(properties['opacity']) ?? 0.3;
        
        const yOffsets = isStacked ? new Array(xData.length).fill(0) : undefined;
        // Keep a copy of offsets for the line path if stacked
        const lineOffsets = isStacked ? new Array(xData.length).fill(0) : undefined;
        
        yDataSeries.forEach((yData, i) => {
            const color = getSeriesColor(i, properties);
            
            // Render Area fill
            svg += renderArea(xData, yData, xScale, yScale, frame.innerH, color, opacity, yOffsets);
            
            // Render line on top
            // If stacked, the line needs to be drawn at the (yData + lineOffsets) position
            if (isStacked && lineOffsets) {
                const stackedY = new Array(xData.length);
                for (let j = 0; j < xData.length; j++) {
                    stackedY[j] = yData[j] + lineOffsets[j];
                    lineOffsets[j] += yData[j]; // Update line offsets for the next series
                }
                svg += renderLinePath(xData, stackedY, xScale, yScale, color, lineWidth);
            } else {
                svg += renderLinePath(xData, yData, xScale, yScale, color, lineWidth);
            }
        });
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        renderData._plotData = { xData, yDataSeries, seriesType: 'area', style: { lineWidth, opacity, isStacked, isCategoricalX } };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
