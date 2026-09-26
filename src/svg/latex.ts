import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';

const adaptor = typeof window !== 'undefined' ? browserAdaptor() : liteAdaptor();
RegisterHTMLHandler(adaptor as any);

const texInput = new TeX({ packages: AllPackages, inlineMath: [['$', '$']] });
const svgOutput = new SVG({ fontCache: 'local' });
// We use the full HTML document converter to process mixed text/math
const html = mathjax.document('', { InputJax: texInput, OutputJax: svgOutput });

export interface LabelOptions {
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    align?: 'start' | 'middle' | 'end';
    rotation?: number;
    baseline?: 'auto' | 'middle' | 'hanging';
}

/**
 * Renders text that may contain $math$ natively as SVG paths and normal <text> elements.
 * NO foreignObject used.
 */
export function renderLabel(text: string, x: number, y: number, options: LabelOptions = {}): string {
    if (!text) return '';
    
    const fontSize = options.fontSize || 12;
    const color = options.color || '#000000';
    const fontFamily = options.fontFamily || 'sans-serif';
    const align = options.align || 'middle';
    const rotation = options.rotation || 0;
    const baseline = options.baseline || 'auto';
    
    let transformStr = '';
    if (rotation) {
        transformStr = `transform="rotate(${rotation} ${x} ${y})"`;
    }

    // Process mixed LaTeX / plain text
    const parts = text.split(/(?<!\\)\$/);
    const hasMath = parts.length >= 3 && parts.length % 2 !== 0;
    
    // If not math, render as plain SVG text
    if (!hasMath) {
        let textAnchor = 'middle';
        if (align === 'start') textAnchor = 'start';
        if (align === 'end') textAnchor = 'end';
        
        let dy = '0';
        if (baseline === 'middle') dy = '0.35em'; 
        if (baseline === 'hanging') dy = '1em'; 
        
        let plainText = text.replace(/\\\$/g, '$');
        return `<text x="${x}" y="${y}" ${transformStr} fill="${color}" font-family="${fontFamily}" font-size="${fontSize}px" text-anchor="${textAnchor}" dominant-baseline="${baseline === 'auto' ? 'auto' : baseline}" dy="${dy}">${plainText}</text>`;
    }
    
    // Convert to a single TeX string
    let texString = '';
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            if (parts[i].length > 0) {
                let safeText = parts[i].replace(/[{}]/g, '\\$&'); // escape braces
                texString += `\\text{${safeText}}`;
            }
        } else {
            texString += parts[i];
        }
    }
    
    // MathJax pure SVG rendering
    try {
        const doc = mathjax.document('', { InputJax: texInput, OutputJax: svgOutput });
        const math = doc.convert(texString, { display: false });
        
        const svgEl = adaptor.firstChild(math) as any;
        if (!svgEl) return '';
        
        const viewBox = adaptor.getAttribute(svgEl, 'viewBox'); 
        const width = adaptor.getAttribute(svgEl, 'width');     
        const height = adaptor.getAttribute(svgEl, 'height');   
        
        const wEx = parseFloat(width);
        const hEx = parseFloat(height);
        
        const ex2px = fontSize * 0.5;
        const wPx = wEx * ex2px;
        const hPx = hEx * ex2px;
        
        let left = x;
        if (align === 'middle') left -= wPx / 2;
        if (align === 'end') left -= wPx;
        
        let top = y;
        if (baseline === 'middle') top -= hPx / 2;
        else if (baseline === 'hanging') top += 0; 
        else top -= hPx * 0.8; 
        
        const innerSVG = adaptor.innerHTML(svgEl);
        
        const vbParts = viewBox ? viewBox.split(' ') : ['0','0','1000','1000'];
        const vbW = parseFloat(vbParts[2]);
        const scale = wPx / vbW;
        
        const dx = left - parseFloat(vbParts[0]) * scale;
        const dy = top - parseFloat(vbParts[1]) * scale;
        
        let outerTransform = '';
        if (rotation) outerTransform = `rotate(${rotation} ${x} ${y})`;
        
        return `<g transform="${outerTransform} translate(${dx} ${dy}) scale(${scale})" fill="${color}">${innerSVG}</g>`;
        
    } catch (e) {
        console.error('Error rendering LaTeX:', e);
        let plainText = text.replace(/\\\$/g, '$');
        return `<text x="${x}" y="${y}" ${transformStr} fill="${color}" font-family="${fontFamily}" font-size="${fontSize}px" text-anchor="middle">${plainText}</text>`;
    }
}
