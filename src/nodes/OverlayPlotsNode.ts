import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { chartStyleProperties, chartAxisProperties, createDomainMetadata } from '../helpers';
import { linearScale, categoricalScale, computeNiceDomain, getTickValues } from '../svg/scales';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { renderXAxis, renderYAxis } from '../svg/axes';
import { renderLinePath, renderScatterPoints, renderBars, renderArea, renderConfidenceBand } from '../svg/series';

export class OverlayPlotsNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'overlay-plots';
    readonly displayName = 'Overlay Plots';
    readonly visible = true;
    
    readonly dynamicInputs = { baseName: 'Plot', acceptsType: 'render' };
    
    readonly inputs = [];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'title', label: 'Title', type: 'text' as const, defaultValue: 'Overlay Plot' },
        { name: 'aspectRatio', label: 'Aspect Ratio', type: 'number' as const, defaultValue: 1.6 },
        ...chartStyleProperties,
        ...chartAxisProperties
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const plotInputs: any[] = [];
        
        // Collect all connected inputs
        for (let i = 1; i <= 20; i++) {
            const plotData = inputs[`Plot ${i}`];
            if (plotData && plotData._domain && plotData._plotData) {
                plotInputs.push(plotData);
            }
        }
        
        if (plotInputs.length === 0) return {};
        
        // 1. Compute Unified Domain
        let globalXMin = Infinity, globalXMax = -Infinity;
        let globalYMin = Infinity, globalYMax = -Infinity;
        let isCategoricalX = false;
        let categoricalXLabels: string[] = [];
        
        for (const input of plotInputs) {
            const d = input._domain;
            const p = input._plotData;
            
            if (p.style?.isCategoricalX) {
                isCategoricalX = true;
                categoricalXLabels = [...new Set([...categoricalXLabels, ...p.xData])];
            } else {
                if (d.xMin < globalXMin) globalXMin = d.xMin;
                if (d.xMax > globalXMax) globalXMax = d.xMax;
            }
            
            if (d.yMin < globalYMin) globalYMin = d.yMin;
            if (d.yMax > globalYMax) globalYMax = d.yMax;
        }
        
        // Handle nice domains for the unified bounds if they aren't categorical
        if (!isCategoricalX) {
            if (globalXMin === Infinity) { globalXMin = 0; globalXMax = 1; }
            const [nXMin, nXMax] = computeNiceDomain([globalXMin, globalXMax]);
            globalXMin = nXMin;
            globalXMax = nXMax;
        }
        
        if (globalYMin === Infinity) { globalYMin = 0; globalYMax = 1; }
        const [nYMin, nYMax] = computeNiceDomain([globalYMin, globalYMax]);
        globalYMin = nYMin;
        globalYMax = nYMax;
        
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
            ? categoricalScale(categoricalXLabels, frame.innerW) 
            : linearScale(globalXMin, globalXMax, frame.innerW);
            
        const yScale = (y: number) => frame.innerH - linearScale(globalYMin, globalYMax, frame.innerH)(y);
        
        // 2. Render Shared Axes
        if (properties['showXMajorTicks']) {
            let ticks = [];
            if (isCategoricalX) {
                ticks = categoricalXLabels;
            } else if (properties['xMajorTickSpacing'] > 0) {
                ticks = getTickValues(globalXMin, globalXMax, properties['xMajorTickSpacing']);
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
                ? getTickValues(globalYMin, globalYMax, properties['yMajorTickSpacing'])
                : getTickValues(globalYMin, globalYMax, (globalYMax - globalYMin) / 5);
                
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
        
        // 3. Re-render all series from input raw data using the unified scales
        for (let i = 0; i < plotInputs.length; i++) {
            const input = plotInputs[i];
            const p = input._plotData;
            const xData = p.xData;
            
            // Extract original styling parameters
            const style = p.style || {};
            
            svg += `<g class="overlay-layer layer-${i}">`;
            
            // Re-render based on type
            if (p.seriesType === 'line' && p.yDataSeries) {
                p.yDataSeries.forEach((yData: number[], j: number) => {
                    const color = properties[`plotSeriesColor${((i+j) % 6) + 1}`] || '#77E4FF';
                    if (p.yLowerSeries && p.yUpperSeries) {
                        const yLower = p.yLowerSeries[j];
                        const yUpper = p.yUpperSeries[j];
                        if (yLower && yUpper) {
                            svg += renderConfidenceBand(xData, yLower, yUpper, xScale, yScale, color, 0.2);
                        }
                    }
                    svg += renderLinePath(xData, yData, xScale, yScale, color, style.lineWidth || 2);
                });
            } 
            else if (p.seriesType === 'scatter' && p.yDataSeries) {
                p.yDataSeries.forEach((yData: number[]) => {
                    // Fallbacks if style fn isn't transferable
                    const color = style.colorFn || properties[`plotSeriesColor${(i % 6) + 1}`] || '#77E4FF';
                    const radius = style.sizeFn || 4;
                    svg += renderScatterPoints(xData, yData, xScale, yScale, radius, color);
                });
            }
            else if (p.seriesType === 'bar' && p.yDataSeries) {
                const bw = isCategoricalX ? (frame.innerW / categoricalXLabels.length) * 0.8 : 20;
                p.yDataSeries.forEach((yData: number[], j: number) => {
                    const color = properties[`plotSeriesColor${((i+j) % 6) + 1}`] || '#77E4FF';
                    svg += renderBars(xData, yData, xScale, yScale, frame.innerH, bw, color, 0);
                });
            }
            else if (p.seriesType === 'area' && p.yDataSeries) {
                const yOffsets = style.isStacked ? new Array(xData.length).fill(0) : undefined;
                const lineOffsets = style.isStacked ? new Array(xData.length).fill(0) : undefined;
                
                p.yDataSeries.forEach((yData: number[], j: number) => {
                    const color = properties[`plotSeriesColor${((i+j) % 6) + 1}`] || '#77E4FF';
                    svg += renderArea(xData, yData, xScale, yScale, frame.innerH, color, style.opacity || 0.3, yOffsets);
                    
                    if (style.isStacked && lineOffsets) {
                        const stackedY = new Array(xData.length);
                        for (let k = 0; k < xData.length; k++) {
                            stackedY[k] = yData[k] + lineOffsets[k];
                            lineOffsets[k] += yData[k];
                        }
                        svg += renderLinePath(xData, stackedY, xScale, yScale, color, style.lineWidth || 2);
                    } else {
                        svg += renderLinePath(xData, yData, xScale, yScale, color, style.lineWidth || 2);
                    }
                });
            }
            // Box plots and heatmaps are more complex to overlay, skipping them in the unified renderer for now
            // Their direct SVG is lost in overlay mode unless we implement full re-rendering for them
            
            svg += `</g>`;
        }
        
        svg = closeChartFrame(svg, properties['title'], totalW, properties['plotAxisColor'], properties['plotFontFamily'], properties['plotTitleFontSize']);
        
        const renderData = { type: 'core:svg', content: svg };
        return {
            Render: renderData,
            type: 'core:svg',
            content: svg
        };
    }
}
