import { plotStateCache } from '../stateCache';
import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { createDomainMetadata } from '../helpers';
import { createChartFrame, closeChartFrame } from '../svg/frame';
import { linearScale } from '../svg/scales';

export class ReferenceLineNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'reference-line';
    readonly displayName = 'Reference Line';
    readonly visible = true;
    
    readonly inputs = [];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [
        { name: 'axis', label: 'Axis', type: 'select' as const, options: [{ label: 'X Axis', value: 'x' }, { label: 'Y Axis', value: 'y' }], defaultValue: 'x' },
        { name: 'value', label: 'Value', type: 'number' as const, defaultValue: 0 },
        { name: 'lineStyle', label: 'Line Style', type: 'select' as const, options: [{ label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' }], defaultValue: 'dashed' },
        { name: 'lineColor', label: 'Line Color', type: 'style' as const, styleType: 'color' as const, category: 'style' as const, defaultValue: 'theme:com.tracereactive.plots.plotRefLineColor' },
        { name: 'lineThickness', label: 'Line Thickness', type: 'style' as const, styleType: 'size' as const, category: 'style' as const, defaultValue: 'theme:com.tracereactive.plots.plotRefLineThickness' }
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const axis = properties['axis'] || 'x';
        const value = Number(properties['value']) || 0;
        const lineStyle = properties['lineStyle'] || 'dashed';
        const lineColor = properties['lineColor'] || '#ff6b6b';
        const lineThickness = Number(properties['lineThickness']) || 2;
        
        // Define domain based on axis
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;
        
        if (axis === 'x') {
            xMin = value;
            xMax = value;
        } else {
            yMin = value;
            yMax = value;
        }
        
        // Generate a minimal frame for standalone rendering (though mostly meant for overlay)
        const frame = createChartFrame({ width: 600, height: 400, backgroundColor: 'transparent' }, {});
        let svg = frame.svg;
        
        let dashArray = '';
        if (lineStyle === 'dashed') dashArray = ` stroke-dasharray="${lineThickness * 3},${lineThickness * 3}"`;
        else if (lineStyle === 'dotted') dashArray = ` stroke-dasharray="${lineThickness},${lineThickness * 2}"`;
        
        // For standalone rendering, assume a unit domain centered on the value
        if (axis === 'x') {
            const xScale = linearScale(value - 1, value + 1, frame.innerW);
            const xPos = xScale(value);
            svg += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="${frame.innerH}" stroke="${lineColor}" stroke-width="${lineThickness}"${dashArray} />`;
        } else {
            const yScale = (y: number) => frame.innerH - linearScale(value - 1, value + 1, frame.innerH)(y);
            const yPos = yScale(value);
            svg += `<line x1="0" y1="${yPos}" x2="${frame.innerW}" y2="${yPos}" stroke="${lineColor}" stroke-width="${lineThickness}"${dashArray} />`;
        }
        
        svg = closeChartFrame(svg, '', frame, '#000000', 'sans-serif', 12);
        
        const renderData: any = { type: 'core:svg', content: svg };
        renderData._domain = createDomainMetadata(xMin, xMax, yMin, yMax);
        
        const _stateId = Math.random().toString(36).substring(7);
        plotStateCache.set(_stateId, {
            frame,
            properties,
            isCategoricalX: false,
            seriesCount: 1,
            renderOverlay: (nxScale: any, nyScale: any, nFrame: any, colorOffset: number, overlayProps: any) => {
                let overlaySvg = '';
                const isX = axis === 'x';
                if (isX) {
                    const nxPos = nxScale(value);
                    overlaySvg += `<line x1="${nxPos}" y1="0" x2="${nxPos}" y2="${nFrame.innerH}" stroke="${lineColor}" stroke-width="${lineThickness}"${dashArray} />`;
                } else {
                    const nyPos = nyScale(value);
                    overlaySvg += `<line x1="0" y1="${nyPos}" x2="${nFrame.innerW}" y2="${nyPos}" stroke="${lineColor}" stroke-width="${lineThickness}"${dashArray} />`;
                }
                return overlaySvg;
            }
        });
        renderData._stateId = _stateId;
        
        renderData._plotData = { 
            seriesType: 'reference-line', 
            axis, 
            value, 
            style: { lineColor, lineThickness, lineStyle } 
        };
        
        return {
            Render: renderData,
            ...renderData
        };
    }
}
