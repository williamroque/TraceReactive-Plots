import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, getColumnData, createDomainMetadata } from '../helpers';
import { linearScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderBars } from '../svg/series';

export class HistogramNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'histogram';
    readonly displayName = 'Histogram';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Histogram' },
        { name: 'column', label: 'Column', type: 'string' as const, defaultValue: '' },
        { name: 'binCount', label: 'Bin Count (0 = auto)', type: 'number' as const, defaultValue: 0, min: 0 },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const data = inputs['Data'];
        if (!data || !properties['column']) return {};
        
        const col = String(properties['column']);
        const rawData = getColumnData(data, col).map(v => Number(v)).filter(v => !isNaN(v));
        
        if (rawData.length === 0) return {};
        
        let bins = Number(properties['binCount']) || 0;
        if (bins <= 0) {
            // Sturges' rule
            bins = Math.ceil(Math.log2(rawData.length) + 1);
        }
        
        let min = Math.min(...rawData);
        let max = Math.max(...rawData);
        if (min === max) {
            min -= 1;
            max += 1;
        }
        
        const binWidth = (max - min) / bins;
        const frequencies = new Array(bins).fill(0);
        const binCenters = new Array(bins).fill(0);
        
        for (let i = 0; i < bins; i++) {
            binCenters[i] = min + (i + 0.5) * binWidth;
        }
        
        for (let val of rawData) {
            let binIdx = Math.floor((val - min) / binWidth);
            if (binIdx === bins) binIdx--; // Include max value in last bin
            frequencies[binIdx]++;
        }

        const aspectRatio = Number(properties['aspectRatio']) || 1.6;
        const totalW = 600;
        const totalH = totalW / aspectRatio;
        
        const [xMin, xMax] = computeNiceDomain([min, max]);
        const yMax = Math.max(...frequencies, 1);
        const yMin = 0;
        
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
                : binCenters;
                
            svg += renderXAxis({
                scale: xScale,
                ticks,
                isCategorical: false,
                innerW: frame.innerW,
                innerH: frame.innerH,
                axisColor: properties['plotAxisColor'],
                axisThickness: properties['plotAxisThickness'] || 1,
                fontFamily: properties['plotFontFamily'],
                fontSize: properties['plotFontSize']
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
                showGrid: properties['showGrid']
            ,
                thousandsSeparator: properties['thousandsSeparator']});
        }
        
        const barW = (frame.innerW / (xMax - xMin)) * binWidth * 0.95; // 5% gap
        const color = properties['plotPrimaryColor'] || '#77E4FF';
        
        svg += renderBars(binCenters, frequencies, xScale, yScale, frame.innerH, barW, color, 0);
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        renderData._plotData = { xData: binCenters, yDataSeries: [frequencies], seriesType: 'bar', style: { isCategoricalX: false } };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
