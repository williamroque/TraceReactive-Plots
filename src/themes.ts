import type { ThemeSection } from '@tracereactive/types';

export const PlotThemeSections: ThemeSection[] = [
    {
        name: 'Plots: General',
        packageId: 'com.tracereactive.plots',
        variables: [
            { key: 'plotPrimaryColor', label: 'Primary color', type: 'color', defaultValue: '#77E4FF', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotSecondaryColor', label: 'Secondary color', type: 'color', defaultValue: '#3693AB', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotAxisColor', label: 'Axis color', type: 'color', defaultValue: '#666666', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotAxisThickness', label: 'Axis thickness', type: 'number', defaultValue: '1', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotGridColor', label: 'Grid color', type: 'color', defaultValue: '#333333', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotGridThickness', label: 'Grid thickness', type: 'number', defaultValue: '0.5', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotBackgroundColor', label: 'Background', type: 'color', defaultValue: '#00000000', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { 
                key: 'plotFontFamily', 
                label: 'Font family', 
                type: 'font', 
                defaultValue: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                section: 'Plots: General',
                packageId: 'com.tracereactive.plots'
            },
            { key: 'plotFontSize', label: 'Font size', type: 'number', defaultValue: '11', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotTitleFontSize', label: 'Title font size', type: 'number', defaultValue: '14', section: 'Plots: General', packageId: 'com.tracereactive.plots' },
            { key: 'plotLabelColor', label: 'Label color', type: 'color', defaultValue: '#999999', section: 'Plots: General', packageId: 'com.tracereactive.plots' }
        ]
    },
    {
        name: 'Plots: Palette',
        packageId: 'com.tracereactive.plots',
        variables: [
            { key: 'plotPalette', label: 'Color Palette', type: 'palette', defaultValue: '#77E4FF,#ff6b6b,#51cf66,#ffd43b,#cc5de8,#ff922b', section: 'Plots: Palette', packageId: 'com.tracereactive.plots' }
        ]
    }
];
