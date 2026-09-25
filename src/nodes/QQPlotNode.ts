import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, createDomainMetadata, getColumnData } from '../helpers';
import { linearScale, computeNiceDomain, getTickValues } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderScatterPoints, renderLinePath } from '../svg/series';
import { jStat } from 'jstat';
import * as ss from 'simple-statistics';

export class QQPlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'qq-plot';
    readonly displayName = 'Q-Q Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Normal Q-Q Plot' },
        { name: 'column', label: 'Column', type: 'text' as const, defaultValue: '' },
        ...chartStyleProperties,
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const table = inputs['Data'];
        const col = properties['column'] as string;
        if (!col) return {};
        
        let arr = getColumnData(table, col).map(v => Number(v)).filter(v => typeof v === 'number' && !isNaN(v));
        if (arr.length === 0) return {};
        
        arr.sort((a, b) => a - b);
        
        const n = arr.length;
        const theoretical = new Array(n);
        for (let i = 0; i < n; i++) {
            const p = (i + 0.5) / n;
            theoretical[i] = jStat.normal.inv(p, 0, 1);
        }
        
        const xData = theoretical;
        const yData = arr;
        
        const [xMin, xMax] = computeNiceDomain(xData);
        const [yMin, yMax] = computeNiceDomain(yData);
        
        const totalW = 500;
        const totalH = 500;
        
        const frame = createChartFrame({
            width: totalW,
            height: totalH,
            backgroundColor: properties['plotBackgroundColor']
        });
        
        let svg = frame.svg;
        const xScale = linearScale(xMin, xMax, frame.innerW);
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        if (properties['showXMajorTicks']) {
            const ticks = properties['xMajorTickSpacing'] > 0 
                ? getTickValues(xMin, xMax, properties['xMajorTickSpacing'])
                : getTickValues(xMin, xMax, (xMax - xMin) / 5);
            svg += renderXAxis({
                scale: xScale, ticks, isCategorical: false, innerW: frame.innerW, innerH: frame.innerH,
                axisColor: properties['plotAxisColor'], axisThickness: properties['plotAxisThickness'] || 1,
                fontFamily: properties['plotFontFamily'], fontSize: properties['plotFontSize'],
                gridColor: properties['plotGridColor'], gridThickness: properties['plotGridThickness'], showGrid: properties['showGrid']
            });
        }
        
        if (properties['showYMajorTicks']) {
            const ticks = properties['yMajorTickSpacing'] > 0 
                ? getTickValues(yMin, yMax, properties['yMajorTickSpacing'])
                : getTickValues(yMin, yMax, (yMax - yMin) / 5);
            svg += renderYAxis({
                scale: yScale, ticks, isCategorical: false, innerW: frame.innerW, innerH: frame.innerH,
                axisColor: properties['plotAxisColor'], axisThickness: properties['plotAxisThickness'] || 1,
                fontFamily: properties['plotFontFamily'], fontSize: properties['plotFontSize'],
                gridColor: properties['plotGridColor'], gridThickness: properties['plotGridThickness'], showGrid: properties['showGrid']
            });
        }
        
        svg += renderScatterPoints(xData, yData, xScale, yScale, 4, properties['plotPrimaryColor'] || '#77E4FF');
        
        try {
            const q1X = jStat.normal.inv(0.25, 0, 1);
            const q3X = jStat.normal.inv(0.75, 0, 1);
            const q1Y = ss.quantile(arr, 0.25);
            const q3Y = ss.quantile(arr, 0.75);
            const slope = (q3Y - q1Y) / (q3X - q1X);
            const intercept = q1Y - slope * q1X;
            
            let p1X = xMin, p1Y = slope * xMin + intercept;
            let p2X = xMax, p2Y = slope * xMax + intercept;
            
            if (p1Y < yMin) { p1X = (yMin - intercept) / slope; p1Y = yMin; }
            else if (p1Y > yMax) { p1X = (yMax - intercept) / slope; p1Y = yMax; }
            
            if (p2Y < yMin) { p2X = (yMin - intercept) / slope; p2Y = yMin; }
            else if (p2Y > yMax) { p2X = (yMax - intercept) / slope; p2Y = yMax; }
            
            svg += renderLinePath([p1X, p2X], [p1Y, p2Y], xScale, yScale, properties['plotSecondaryColor'] || '#FF6B6B', 2);
        } catch(e) { }
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg,
            _domain: createDomainMetadata(xMin, xMax, yMin, yMax),
            _plotData: { xData, yDataSeries: [yData], seriesType: 'scatter' }
        };
    }
}
