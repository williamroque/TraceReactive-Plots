import type { PropertyDefinition } from '@tracereactive/types';

export const chartStyleProperties: PropertyDefinition[] = [
    { name: 'plotPrimaryColor', label: 'Primary color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotPrimaryColor' },
    { name: 'plotSecondaryColor', label: 'Secondary color', type: 'style', styleType: 'color', category: 'style', defaultValue: '#FF6B6B' },
    { name: 'plotAxisColor', label: 'Axis color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotAxisColor' },
    { name: 'plotAxisThickness', label: 'Axis thickness', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotAxisThickness' },
    { name: 'plotGridColor', label: 'Grid color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotGridColor' },
    { name: 'plotGridThickness', label: 'Grid thickness', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotGridThickness' },
    { name: 'plotBackgroundColor', label: 'Background', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotBackgroundColor' },
    { name: 'plotBorderThickness', label: 'Border thickness', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotBorderThickness' },
    { name: 'plotBorderColor', label: 'Border color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotBorderColor' },
    { name: 'plotRangePadding', label: 'Range padding', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotRangePadding' },
    { name: 'plotFontFamily', label: 'Font family', type: 'style', styleType: 'font', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotFontFamily' },
    { name: 'plotFontSize', label: 'Font size', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotFontSize' },
    { name: 'plotTitleFontSize', label: 'Title font size', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotTitleFontSize' },
    { name: 'plotPalette', label: 'Color Palette', type: 'style', styleType: 'palette', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotPalette' },
    { name: 'plotMarginTop', label: 'Margin Top', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotMarginTop' },
    { name: 'plotMarginRight', label: 'Margin Right', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotMarginRight' },
    { name: 'plotMarginBottom', label: 'Margin Bottom', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotMarginBottom' },
    { name: 'plotMarginLeft', label: 'Margin Left', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:com.tracereactive.plots.plotMarginLeft' }
];

export const chartAxisProperties: PropertyDefinition[] = [
    { name: 'showXMajorTicks', label: 'Show X Major Ticks', type: 'boolean', defaultValue: true },
    { name: 'xMajorTickSpacing', label: 'X Major Tick Spacing', type: 'number', defaultValue: 0 },
    { name: 'showYMajorTicks', label: 'Show Y Major Ticks', type: 'boolean', defaultValue: true },
    { name: 'yMajorTickSpacing', label: 'Y Major Tick Spacing', type: 'number', defaultValue: 0 },
    { name: 'showGrid', label: 'Show Grid', type: 'boolean', defaultValue: true },
    { name: 'thousandsSeparator', label: 'Thousands Separator', type: 'string', defaultValue: ',' }
];

/**
 * Helper to extract an array of values from an Arquero table.
 */
export function getColumnData(data: any, columnName: string): any[] {
    if (!data || !columnName) return [];
    
    // If it's a raw array of objects (not Arquero)
    if (Array.isArray(data)) {
        return data.map(row => row[columnName]);
    }
    
    if (data.__arqueroData && Array.isArray(data.__arqueroData)) {
        return data.__arqueroData.map((row: any) => row[columnName]);
    }
    
    // Fallback: if it's a live Arquero table in the sandbox
    if (typeof data.array === 'function') {
        try {
            return data.array(columnName);
        } catch (e) {
            return [];
        }
    }
    
    return [];
}

/**
 * Creates domain metadata for overlay compositing
 */
export function createDomainMetadata(xMin: number, xMax: number, yMin: number, yMax: number) {
    return { xMin, xMax, yMin, yMax };
}

export const chartLabelProperties: PropertyDefinition[] = [
    { name: "xLabel", label: "X Axis Label", type: "string", defaultValue: "" },
    { name: "yLabel", label: "Y Axis Label", type: "string", defaultValue: "" },
    { name: "showLabels", label: "Show Labels", type: "boolean", defaultValue: false },
    { name: "labelColor", label: "Label Color", type: "style", styleType: "color", category: "style", defaultValue: "theme:com.tracereactive.plots.plotAxisColor" },
    { name: "labelFontSize", label: "Label Font Size", type: "style", styleType: "size", category: "style", defaultValue: "theme:com.tracereactive.plots.plotFontSize" }
];

export const chartLegendProperties: PropertyDefinition[] = [
    { name: "showLegend", label: "Show Legend", type: "boolean", defaultValue: true },
    { name: "legendPosition", label: "Legend Position", type: "style", styleType: "select", category: "style", defaultValue: "top-right", options: [
        { label: "Top Right", value: "top-right" },
        { label: "Top Left", value: "top-left" },
        { label: "Bottom Right", value: "bottom-right" },
        { label: "Bottom Left", value: "bottom-left" },
        { label: "Top", value: "top" },
        { label: "Bottom", value: "bottom" },
        { label: "Right", value: "right" },
        { label: "Left", value: "left" }
    ] },
    { name: "legendBackgroundColor", label: "Legend Background", type: "style", styleType: "color", category: "style", defaultValue: "theme:com.tracereactive.plots.plotBackgroundColor" },
    { name: "legendBorderColor", label: "Legend Border", type: "style", styleType: "color", category: "style", defaultValue: "theme:com.tracereactive.plots.plotAxisColor" }
];
