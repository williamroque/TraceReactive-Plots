export function renderLinePath(
    xData: any[], 
    yData: number[], 
    xScale: (x: any) => number, 
    yScale: (y: number) => number, 
    color: string, 
    width: number
): string {
    let pathSvg = '';
    let isDrawing = false;
    
    for (let i = 0; i < xData.length; i++) {
        if (isNaN(yData[i])) {
            isDrawing = false;
        } else {
            const xPos = xScale(xData[i]);
            const yPos = yScale(yData[i]);
            if (!isDrawing) {
                pathSvg += `M ${xPos},${yPos}`;
                isDrawing = true;
            } else {
                pathSvg += ` L ${xPos},${yPos}`;
            }
        }
    }
    
    if (!pathSvg) return '';
    return `<path d="${pathSvg}" fill="none" stroke="${color}" stroke-width="${width}" />`;
}

export function renderScatterPoints(
    xData: any[], 
    yData: number[], 
    xScale: (x: any) => number, 
    yScale: (y: number) => number, 
    radius: number | ((i: number) => number),
    color: string | ((i: number) => string)
): string {
    let svg = '';
    for (let i = 0; i < xData.length; i++) {
        if (!isNaN(yData[i])) {
            const xPos = xScale(xData[i]);
            const yPos = yScale(yData[i]);
            const r = typeof radius === 'function' ? radius(i) : radius;
            const c = typeof color === 'function' ? color(i) : color;
            svg += `<circle cx="${xPos}" cy="${yPos}" r="${r}" fill="${c}" opacity="0.8" />`;
        }
    }
    return svg;
}

export function renderBars(
    xData: any[], 
    yData: number[], 
    xScale: (x: any) => number, 
    yScale: (y: number) => number, 
    innerH: number,
    barWidth: number,
    color: string,
    xOffset: number = 0,
    yOffsets?: number[]
): string {
    let svg = '';
    for (let i = 0; i < xData.length; i++) {
        if (!isNaN(yData[i])) {
            const cx = xScale(xData[i]) + xOffset;
            
            // Handle stacked bars if yOffsets are provided
            const yBase = yOffsets ? yOffsets[i] : 0;
            const yVal = yData[i] + yBase;
            
            const yPos = yScale(yVal);
            const yPosBase = yScale(yBase);
            const h = yPosBase - yPos; // Height is difference between base and top
            
            const bx = cx - barWidth / 2;
            
            // If yOffsets provided, update them for the next stacked series
            if (yOffsets) {
                yOffsets[i] = yVal;
            }
            
            // Only draw if height is positive
            if (h > 0) {
                svg += `<rect x="${bx}" y="${yPos}" width="${barWidth}" height="${h}" fill="${color}" />`;
            } else if (h < 0) {
                // Handle negative bars pointing downwards from base
                svg += `<rect x="${bx}" y="${yPosBase}" width="${barWidth}" height="${-h}" fill="${color}" />`;
            }
        }
    }
    return svg;
}

export function renderArea(
    xData: any[], 
    yData: number[], 
    xScale: (x: any) => number, 
    yScale: (y: number) => number, 
    innerH: number,
    color: string,
    opacity: number,
    yOffsets?: number[]
): string {
    let pathSvg = '';
    let isDrawing = false;
    let startIdx = 0;
    
    // Create the top path
    for (let i = 0; i < xData.length; i++) {
        if (isNaN(yData[i])) {
            // Need to close the shape if we were drawing
            if (isDrawing) {
                // Draw down to base line
                for (let j = i - 1; j >= startIdx; j--) {
                    const bx = xScale(xData[j]);
                    const by = yOffsets ? yScale(yOffsets[j]) : yScale(0);
                    pathSvg += ` L ${bx},${by}`;
                }
                pathSvg += ' Z ';
                isDrawing = false;
            }
        } else {
            const xPos = xScale(xData[i]);
            
            const yBase = yOffsets ? yOffsets[i] : 0;
            const yVal = yData[i] + yBase;
            const yPos = yScale(yVal);
            
            if (yOffsets) {
                yOffsets[i] = yVal;
            }
            
            if (!isDrawing) {
                startIdx = i;
                pathSvg += `M ${xPos},${yPos}`;
                isDrawing = true;
            } else {
                pathSvg += ` L ${xPos},${yPos}`;
            }
        }
    }
    
    // Close the final shape
    if (isDrawing && xData.length > 0) {
        for (let j = xData.length - 1; j >= startIdx; j--) {
            const bx = xScale(xData[j]);
            const by = yOffsets ? yScale(yOffsets[j]) : yScale(0);
            pathSvg += ` L ${bx},${by}`;
        }
        pathSvg += ' Z';
    }
    
    if (!pathSvg) return '';
    return `<path d="${pathSvg}" fill="${color}" opacity="${opacity}" />`;
}

export function renderBoxPlot(
    stats: { min: number, q1: number, median: number, q3: number, max: number, outliers: number[] },
    xPos: number,
    boxWidth: number,
    yScale: (y: number) => number,
    color: string
): string {
    const yMin = yScale(stats.min);
    const yQ1 = yScale(stats.q1);
    const yMed = yScale(stats.median);
    const yQ3 = yScale(stats.q3);
    const yMax = yScale(stats.max);
    
    const halfW = boxWidth / 2;
    const l = xPos - halfW;
    const r = xPos + halfW;
    
    let svg = '';
    
    // Vertical line (whiskers)
    svg += `<line x1="${xPos}" y1="${yMax}" x2="${xPos}" y2="${yQ3}" stroke="${color}" stroke-width="2" />`;
    svg += `<line x1="${xPos}" y1="${yQ1}" x2="${xPos}" y2="${yMin}" stroke="${color}" stroke-width="2" />`;
    
    // Top whisker cap
    svg += `<line x1="${xPos - halfW/2}" y1="${yMax}" x2="${xPos + halfW/2}" y2="${yMax}" stroke="${color}" stroke-width="2" />`;
    // Bottom whisker cap
    svg += `<line x1="${xPos - halfW/2}" y1="${yMin}" x2="${xPos + halfW/2}" y2="${yMin}" stroke="${color}" stroke-width="2" />`;
    
    // Box
    const boxH = yQ1 - yQ3; // SVG coords are inverted
    svg += `<rect x="${l}" y="${yQ3}" width="${boxWidth}" height="${boxH}" fill="${color}" opacity="0.7" stroke="${color}" stroke-width="2" />`;
    
    // Median line
    svg += `<line x1="${l}" y1="${yMed}" x2="${r}" y2="${yMed}" stroke="${color}" stroke-width="3" />`;
    
    // Outliers
    stats.outliers.forEach(outVal => {
        svg += `<circle cx="${xPos}" cy="${yScale(outVal)}" r="3" fill="none" stroke="${color}" stroke-width="1.5" />`;
    });
    
    return svg;
}

export function renderPieSlices(
    data: number[],
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    colors: string[]
): string {
    let svg = '';
    const total = data.reduce((a, b) => a + (b > 0 ? b : 0), 0);
    if (total === 0) return svg;
    
    let currentAngle = -Math.PI / 2; // Start at top
    
    data.forEach((val, i) => {
        if (val <= 0) return;
        
        const fraction = val / total;
        const angle = fraction * Math.PI * 2;
        const endAngle = currentAngle + angle;
        
        // For a full circle, SVG arcs have trouble, use a simpler path or two arcs
        if (fraction > 0.999) {
            svg += `<circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${colors[i % colors.length]}" />`;
            if (innerRadius > 0) {
                // Cut out donut hole
                // Better approach for full donut is two paths or a thick stroke, but we'll leave basic full circle for now
                svg += `<circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="var(--theme-plotBackgroundColor, transparent)" />`;
            }
            return;
        }
        
        const startX = cx + Math.cos(currentAngle) * outerRadius;
        const startY = cy + Math.sin(currentAngle) * outerRadius;
        const endX = cx + Math.cos(endAngle) * outerRadius;
        const endY = cy + Math.sin(endAngle) * outerRadius;
        
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        
        let path = '';
        if (innerRadius === 0) {
            path = `M ${cx},${cy} L ${startX},${startY} A ${outerRadius},${outerRadius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
        } else {
            const startInnerX = cx + Math.cos(currentAngle) * innerRadius;
            const startInnerY = cy + Math.sin(currentAngle) * innerRadius;
            const endInnerX = cx + Math.cos(endAngle) * innerRadius;
            const endInnerY = cy + Math.sin(endAngle) * innerRadius;
            
            path = `M ${startInnerX},${startInnerY} L ${startX},${startY} A ${outerRadius},${outerRadius} 0 ${largeArcFlag},1 ${endX},${endY} L ${endInnerX},${endInnerY} A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${startInnerX},${startInnerY} Z`;
        }
        
        svg += `<path d="${path}" fill="${colors[i % colors.length]}" stroke="rgba(0,0,0,0.1)" stroke-width="1" />`;
        
        currentAngle = endAngle;
    });
    
    return svg;
}
