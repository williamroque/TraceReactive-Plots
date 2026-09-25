import type { PropertyDefinition } from '@tracereactive/types';

export const chartStyleProperties: PropertyDefinition[] = [
    { name: 'plotPrimaryColor', label: 'Primary color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:plotPrimaryColor' },
    { name: 'plotSecondaryColor', label: 'Secondary color', type: 'style', styleType: 'color', category: 'style', defaultValue: '#FF6B6B' },
    { name: 'plotAxisColor', label: 'Axis color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:plotAxisColor' },
    { name: 'plotAxisThickness', label: 'Axis thickness', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:plotAxisThickness' },
    { name: 'plotGridColor', label: 'Grid color', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:plotGridColor' },
    { name: 'plotGridThickness', label: 'Grid thickness', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:plotGridThickness' },
    { name: 'plotBackgroundColor', label: 'Background', type: 'style', styleType: 'color', category: 'style', defaultValue: 'theme:plotBackgroundColor' },
    { name: 'plotFontFamily', label: 'Font family', type: 'style', styleType: 'font', category: 'style', defaultValue: 'theme:plotFontFamily' },
    { name: 'plotFontSize', label: 'Font size', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:plotFontSize' },
    { name: 'plotTitleFontSize', label: 'Title font size', type: 'style', styleType: 'size', category: 'style', defaultValue: 'theme:plotTitleFontSize' }
];

export const chartAxisProperties: PropertyDefinition[] = [
    { name: 'showXMajorTicks', label: 'Show X Major Ticks', type: 'boolean', defaultValue: true },
    { name: 'xMajorTickSpacing', label: 'X Major Tick Spacing', type: 'number', defaultValue: 0 },
    { name: 'showYMajorTicks', label: 'Show Y Major Ticks', type: 'boolean', defaultValue: true },
    { name: 'yMajorTickSpacing', label: 'Y Major Tick Spacing', type: 'number', defaultValue: 0 },
    { name: 'showGrid', label: 'Show Grid', type: 'boolean', defaultValue: true }
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
    
    // If it's an Arquero table (serialized or live)
    // When serialized via IPC, the data usually arrives as { __arqueroData: [...] }
    // Or if Arquero is used to recreate it, we'd use aq.from(data).array(columnName)
    // Since we don't want to deserialize the whole Arquero object just to get one column,
    // we check if it's the serialized form:
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
