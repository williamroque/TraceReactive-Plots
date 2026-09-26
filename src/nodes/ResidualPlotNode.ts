import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, chartLabelProperties, chartLegendProperties, createDomainMetadata, getColumnData  } from '../helpers';
import { linearScale, computeNiceDomain, getTickValues, getAutoTickSpacing } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLegend } from '../svg/legend';
import { renderScatterPoints, renderLinePath } from '../svg/series';

export class ResidualPlotNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'residual-plot';
    readonly displayName = 'Residual Plot';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Data', acceptsType: 'core:dataframe' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'string' as const, defaultValue: 'Residuals vs Fitted' },
        { name: 'yPredCol', label: 'Predicted (X)', type: 'text' as const, defaultValue: 'y_pred' },
        { name: 'residualCol', label: 'Residuals (Y)', type: 'text' as const, defaultValue: 'residual' },
        ...chartStyleProperties,
        ...chartAxisProperties,
        ...chartLabelProperties,
        ...chartLegendProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const table = inputs['Data'];
        const xCol = properties['yPredCol'] as string;
        const yCol = properties['residualCol'] as string;
        if (!xCol || !yCol) return {};
        
        const xDataRaw = getColumnData(table, xCol).map(v => Number(v));
        const yDataRaw = getColumnData(table, yCol).map(v => Number(v));
        
        const xData = [];
        const yData = [];
        for (let i = 0; i < xDataRaw.length; i++) {
            if (typeof xDataRaw[i] === 'number' && !isNaN(xDataRaw[i]) && typeof yDataRaw[i] === 'number' && !isNaN(yDataRaw[i])) {
                xData.push(xDataRaw[i]);
                yData.push(yDataRaw[i]);
            }
        }
        
        if (xData.length === 0) return {};
        
        const [xMin, xMax] = computeNiceDomain(xData);
        let [yMin, yMax] = computeNiceDomain(yData);
        
        const maxAbs = Math.max(Math.abs(yMin), Math.abs(yMax));
        yMin = -maxAbs;
        yMax = maxAbs;
        
        const totalW = 600;
        const totalH = 400;
        
        const frame = createChartFrame({ width: totalW, height: totalH, backgroundColor: properties['plotBackgroundColor'] });
        let svg = frame.svg;
        
        const xScale = linearScale(xMin, xMax, frame.innerW);
        const yScale = (y: number) => frame.innerH - linearScale(yMin, yMax, frame.innerH)(y);
        
        if (properties['showXMajorTicks']) {
            const ticks = properties['xMajorTickSpacing'] > 0 ? getTickValues(xMin, xMax, properties['xMajorTickSpacing']) : getTickValues(xMin, xMax, getAutoTickSpacing(xMin, xMax));
            svg += renderXAxis({ scale: xScale, ticks, isCategorical: false, innerW: frame.innerW, innerH: frame.innerH, axisColor: properties['plotAxisColor'], axisThickness: properties['plotAxisThickness'] || 1, fontFamily: properties['plotFontFamily'], fontSize: properties['plotFontSize'], gridColor: properties['plotGridColor'], gridThickness: properties['plotGridThickness'], showGrid: properties['showGrid'],
                thousandsSeparator: properties['thousandsSeparator'],
                label: properties['xLabel']
            });
        }
        
        if (properties['showYMajorTicks']) {
            const ticks = properties['yMajorTickSpacing'] > 0 ? getTickValues(yMin, yMax, properties['yMajorTickSpacing']) : getTickValues(yMin, yMax, getAutoTickSpacing(yMin, yMax));
            svg += renderYAxis({ scale: yScale, ticks, isCategorical: false, innerW: frame.innerW, innerH: frame.innerH, axisColor: properties['plotAxisColor'], axisThickness: properties['plotAxisThickness'] || 1, fontFamily: properties['plotFontFamily'], fontSize: properties['plotFontSize'], gridColor: properties['plotGridColor'], gridThickness: properties['plotGridThickness'], showGrid: properties['showGrid'],
                thousandsSeparator: properties['thousandsSeparator'],
                label: properties['xLabel']
            });
        }
        
        svg += renderLinePath([xMin, xMax], [0, 0], xScale, yScale, properties['plotSecondaryColor'] || '#FF6B6B', 1);
        svg += renderScatterPoints(xData, yData, xScale, yScale, 4, properties['plotPrimaryColor'] || '#77E4FF');
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        renderData._plotData = { xData, yDataSeries: [yData], seriesType: 'scatter' };
        return {
            Render: renderData,
            ...renderData
        };
    }
}
