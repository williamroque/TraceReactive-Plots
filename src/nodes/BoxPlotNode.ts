import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, getColumnData, createDomainMetadata } from '../helpers';
import { linearScale, categoricalScale, computeNiceDomain, getTickValues } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderBoxPlot } from '../svg/series';
import { getSeriesColor } from '../svg/colors';

export class BoxPlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'box-plot';
    readonly displayName = 'Box Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Box Plot' },
        { name: 'columns', label: 'Columns to Compare (comma-sep)', type: 'string' as const, defaultValue: '' },
        { name: 'showOutliers', label: 'Show Outliers', type: 'boolean' as const, defaultValue: true },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['columns']) return {};
        
        const cols = String(properties['columns']).split(',').map(s => s.trim()).filter(Boolean);
        if (cols.length === 0) return {};
        
        const seriesStats: any[] = [];
        const rawSeries: number[][] = [];
        let globalMin = Infinity;
        let globalMax = -Infinity;
        
        for (const col of cols) {
            const rawData = getColumnData(data, col).map(v => Number(v)).filter(v => !isNaN(v));
            if (rawData.length === 0) continue;
            
            rawSeries.push(rawData);
            rawData.sort((a, b) => a - b);
            
            const min = rawData[0];
            const max = rawData[rawData.length - 1];
            
            const getQ = (q: number) => {
                const pos = (rawData.length - 1) * q;
                const base = Math.floor(pos);
                const rest = pos - base;
                if (rawData[base + 1] !== undefined) {
                    return rawData[base] + rest * (rawData[base + 1] - rawData[base]);
                } else {
                    return rawData[base];
                }
            };
            
            const q1 = getQ(0.25);
            const median = getQ(0.5);
            const q3 = getQ(0.75);
            const iqr = q3 - q1;
            
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            const outliers: number[] = [];
            let whiskerMin = min;
            let whiskerMax = max;
            
            if (properties['showOutliers']) {
                whiskerMin = Infinity;
                whiskerMax = -Infinity;
                for (const val of rawData) {
                    if (val < lowerBound || val > upperBound) {
                        outliers.push(val);
                    } else {
                        if (val < whiskerMin) whiskerMin = val;
                        if (val > whiskerMax) whiskerMax = val;
                    }
                }
                // If no data within whiskers, use Q1/Q3 as whiskers to prevent visual bugs
                if (whiskerMin === Infinity) whiskerMin = q1;
                if (whiskerMax === -Infinity) whiskerMax = q3;
            }
            
            if (min < globalMin) globalMin = min;
            if (max > globalMax) globalMax = max;
            
            seriesStats.push({ min: whiskerMin, q1, median, q3, max: whiskerMax, outliers });
        }
        
        if (seriesStats.length === 0) return {};

        const aspectRatio = Number(properties['aspectRatio']) || 1.6;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const [yMin, yMax] = computeNiceDomain([globalMin, globalMax]);
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        
        const xScale = categoricalScale(cols, frame.innerW);
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        // Axes
        if (properties['showXMajorTicks']) {
            svg += renderXAxis({
                scale: xScale,
                ticks: cols,
                isCategorical: true,
                innerW: frame.innerW,
                innerH: frame.innerH,
                axisColor: properties['plotAxisColor'],
                axisThickness: properties['plotAxisThickness'] || 1,
                fontFamily: properties['plotFontFamily'],
                fontSize: properties['plotFontSize'],
                showGrid: false
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
        
        const boxWidth = Math.min(40, (frame.innerW / cols.length) * 0.5);
        
        seriesStats.forEach((stats, i) => {
            const xPos = xScale(cols[i]);
            const color = cols.length > 1 ? getSeriesColor(i, properties) : properties['plotPrimaryColor'] || getSeriesColor(0, properties);
            svg += renderBoxPlot(stats, xPos, boxWidth, yScale, color);
        });
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg,
            _domain: createDomainMetadata(0, cols.length, yMin, yMax), // X domain is index-based for boxplots overlay
            _plotData: { xData: cols, yDataSeries: rawSeries, seriesType: 'boxplot', style: { boxWidth, isCategoricalX: true } }
        };
    }
}
