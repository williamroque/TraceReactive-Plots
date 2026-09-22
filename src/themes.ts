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
        name: 'Plots: Series Colors',
        packageId: 'com.tracereactive.plots',
        variables: [
            { key: 'plotSeriesColor1', label: 'Series 1', type: 'color', defaultValue: '#77E4FF', section: 'Plots: Series Colors', packageId: 'com.tracereactive.plots' },
            { key: 'plotSeriesColor2', label: 'Series 2', type: 'color', defaultValue: '#ff6b6b', section: 'Plots: Series Colors', packageId: 'com.tracereactive.plots' },
            { key: 'plotSeriesColor3', label: 'Series 3', type: 'color', defaultValue: '#51cf66', section: 'Plots: Series Colors', packageId: 'com.tracereactive.plots' },
            { key: 'plotSeriesColor4', label: 'Series 4', type: 'color', defaultValue: '#ffd43b', section: 'Plots: Series Colors', packageId: 'com.tracereactive.plots' },
            { key: 'plotSeriesColor5', label: 'Series 5', type: 'color', defaultValue: '#cc5de8', section: 'Plots: Series Colors', packageId: 'com.tracereactive.plots' },
            { key: 'plotSeriesColor6', label: 'Series 6', type: 'color', defaultValue: '#ff922b', section: 'Plots: Series Colors', packageId: 'com.tracereactive.plots' }
        ]
    }
];
