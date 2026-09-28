import { plotStateCache } from '../stateCache';
import { RenderNode } from '@tracereactive/types';
import { PlotCategory } from '../categories';
import { createDomainMetadata } from '../helpers';

export class OverlayPlotsNode extends RenderNode {
    readonly category = PlotCategory;
    readonly typeId = 'overlay-plots';
    readonly displayName = 'Overlay Plots';
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Main', acceptsType: 'render' }
    ];
    
    readonly dynamicInputs = { baseName: 'Overlay', acceptsType: 'render', preserveStaticInputs: true };
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [];



    async evaluate(inputs: Record<string, any>, properties: Record<string, any>): Promise<Record<string, any>> {
        const mainInput = inputs['Main'];
        if (!mainInput || !mainInput._stateId) return {};
        
        const mainState = plotStateCache.get(mainInput._stateId);
        if (!mainState) return {};
        const mainSvg = mainInput.content;
        
        let overlayContents = '';
        let colorOffset = mainState.seriesCount || 1;
        
        for (let i = 1; i <= 20; i++) {
            const overlayInput = inputs[`Overlay ${i}`];
            if (overlayInput && overlayInput._stateId) {
                const overlayState = plotStateCache.get(overlayInput._stateId);
                if (overlayState && overlayState.renderOverlay) {
                    overlayContents += overlayState.renderOverlay(
                        mainState.xScale, mainState.yScale, mainState.frame, colorOffset, mainState.properties
                    );
                    colorOffset += overlayState.seriesCount || 1;
                }
            }
        }
        
        let finalSvg = mainSvg;
        if (overlayContents) {
            if (finalSvg.includes('<!--OVERLAYS-->')) {
                finalSvg = finalSvg.replace('<!--OVERLAYS-->', overlayContents + '<!--OVERLAYS-->');
            } else {
                // Fallback for older frames
                if (finalSvg.endsWith('</g></svg>')) {
                    finalSvg = finalSvg.slice(0, -10) + overlayContents + '</g></svg>';
                } else if (finalSvg.endsWith('</svg>')) {
                    finalSvg = finalSvg.slice(0, -6) + overlayContents + '</svg>';
                }
            }
        }
        
        const renderData: any = { type: 'core:svg', content: finalSvg };
        if (mainInput._domain) renderData._domain = mainInput._domain;
        if (mainInput._plotData) renderData._plotData = mainInput._plotData;
        
        // Pass the Main state forward in case this is overlaid again
        renderData._stateId = mainInput._stateId;
        
        return {
            Render: renderData,
            ...renderData
        };
    }
}
