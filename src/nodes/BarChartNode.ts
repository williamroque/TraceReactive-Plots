import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, getColumnData, createDomainMetadata } from '../helpers';
import { linearScale, categoricalScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderBars } from '../svg/series';
import { getSeriesColor } from '../svg/colors';

export class BarChartNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'bar-chart';
    readonly displayName = 'Bar Chart';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Bar Chart' },
        { name: 'xColumn', label: 'X Column', type: 'string' as const, defaultValue: '' },
        { name: 'yColumn', label: 'Y Column', type: 'string' as const, defaultValue: '' },
        { name: 'groupColumn', label: 'Group By Column (Optional)', type: 'string' as const, defaultValue: '' },
        { 
            name: 'barMode', 
            label: 'Bar Mode', 
            type: 'select' as const, 
            options: [
                { label: 'Grouped', value: 'grouped' },
                { label: 'Stacked', value: 'stacked' }
            ],
            defaultValue: 'grouped' 
        },
        { name: 'barGap', label: 'Bar Gap', type: 'number' as const, defaultValue: 0.2, step: 0.1, min: 0 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['xColumn'] || !properties['yColumn']) return {};
        
        const xCol = String(properties['xColumn']);
        const yCol = String(properties['yColumn']);
        const groupCol = String(properties['groupColumn'] || '');
        
        const xDataRaw = getColumnData(data, xCol);
        const yDataRaw = getColumnData(data, yCol).map(v => Number(v));
        
        if (xDataRaw.length === 0) return {};
        
        const groupDataRaw = groupCol ? getColumnData(data, groupCol) : [];
        
        // Group logic
        const uniqueX = [...new Set(xDataRaw)];
        const isCategoricalX = typeof uniqueX[0] === 'string' || typeof uniqueX[0] === 'boolean';
        
        let groups = ['default'];
        if (groupDataRaw.length > 0) {
            groups = [...new Set(groupDataRaw.map(String))];
        }
        
        // Build series matrix: series[groupIndex][xIndex]
        const yDataSeries = groups.map(() => new Array(uniqueX.length).fill(0));
        
        for (let i = 0; i < xDataRaw.length; i++) {
            const xIdx = uniqueX.indexOf(xDataRaw[i]);
            const gIdx = groupCol ? groups.indexOf(String(groupDataRaw[i])) : 0;
            if (xIdx !== -1 && gIdx !== -1) {
                // If there are duplicates, sum them (simple pivot)
                yDataSeries[gIdx][xIdx] += (isNaN(yDataRaw[i]) ? 0 : yDataRaw[i]);
            }
        }

        const isStacked = properties['barMode'] === 'stacked';
        
        // Domain X
        let xMin = 0, xMax = 0;
        if (!isCategoricalX) {
            const nums = uniqueX.map(v => Number(v));
            [xMin, xMax] = computeNiceDomain(nums);
        }
        
        // Domain Y
        let yMax = 0;
        let yMin = 0;
        
        if (isStacked) {
            const colSums = new Array(uniqueX.length).fill(0);
            for (let g = 0; g < groups.length; g++) {
                for (let x = 0; x < uniqueX.length; x++) {
                    colSums[x] += yDataSeries[g][x];
                }
            }
            yMax = Math.max(...colSums, 1);
        } else {
            const allY = yDataSeries.flat();
            yMax = Math.max(...allY, 1);
            yMin = Math.min(...allY, 0); // usually bars start at 0
        }
        
        if (yMax === yMin) { yMax += 1; }

        const aspectRatio = Number(properties['aspectRatio']) || 1.6;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        
        const xScale = isCategoricalX 
            ? categoricalScale(uniqueX as string[], frame.innerW) 
            : linearScale(xMin, xMax, frame.innerW);
            
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        // Axes
        if (properties['showXMajorTicks']) {
            let ticks = [];
            if (isCategoricalX) {
                ticks = uniqueX;
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
                showGrid: false // Typically don't need vertical grids on bar charts
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
        
        // Series
        const gap = Number(properties['barGap']) || 0.2;
        let baseBarW = isCategoricalX ? (frame.innerW / uniqueX.length) : 20; // fallback width
        baseBarW *= (1 - gap);
        
        const yOffsets = isStacked ? new Array(uniqueX.length).fill(0) : undefined;
        
        yDataSeries.forEach((yData, i) => {
            const color = groups.length > 1 ? getSeriesColor(i, properties) : properties['plotPrimaryColor'] || getSeriesColor(0, properties);
            
            let bw = baseBarW;
            let xOffset = 0;
            
            if (!isStacked && groups.length > 1) {
                bw = baseBarW / groups.length;
                xOffset = (i - groups.length / 2 + 0.5) * bw;
            }
            
            svg += renderBars(uniqueX, yData, xScale, yScale, frame.innerH, bw, color, xOffset, yOffsets);
        });
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        renderData._plotData = { xData: uniqueX, yDataSeries, seriesType: 'bar', style: { isCategoricalX, isStacked, groups } };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
