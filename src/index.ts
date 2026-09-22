import type { TraceReactiveAPI } from '@tracereactive/types';

import { PlotThemeSections } from './themes';
import { LinePlotNode } from './nodes/LinePlotNode';
import { ScatterPlotNode } from './nodes/ScatterPlotNode';
import { BarChartNode } from './nodes/BarChartNode';
import { HistogramNode } from './nodes/HistogramNode';
import { ExpressionPlotNode } from './nodes/ExpressionPlotNode';
import { ParametricPlotNode } from './nodes/ParametricPlotNode';
import { HeatmapExpressionNode } from './nodes/HeatmapExpressionNode';
import { BoxPlotNode } from './nodes/BoxPlotNode';
import { AreaChartNode } from './nodes/AreaChartNode';
import { HeatmapDataNode } from './nodes/HeatmapDataNode';
import { PieDonutNode } from './nodes/PieDonutNode';
import { OverlayPlotsNode } from './nodes/OverlayPlotsNode';

declare const traceReactive: TraceReactiveAPI;

const nodes = [
    new LinePlotNode(),
    new ScatterPlotNode(),
    new BarChartNode(),
    new HistogramNode(),
    new ExpressionPlotNode(),
    new ParametricPlotNode(),
    new HeatmapExpressionNode(),
    new BoxPlotNode(),
    new AreaChartNode(),
    new HeatmapDataNode(),
    new PieDonutNode(),
    new OverlayPlotsNode()
];

const serializableNodes = nodes.map(n => ({
    typeId: n.typeId,
    displayName: n.displayName,
    nodeInterface: n.nodeInterface,
    category: n.category,
    visible: n.visible,
    packageId: n.packageId,
    inputs: n.inputs,
    outputs: n.outputs,
    properties: n.properties,
    dynamicInputs: n.dynamicInputs,
    dynamicOutputs: n.dynamicOutputs
}));

traceReactive.registerNodes(serializableNodes);
traceReactive.registerThemeSections(PlotThemeSections);

traceReactive.onEvaluateNode(async ({ typeId, inputs, properties }) => {
    const node = nodes.find(n => n.typeId === typeId);
    if (!node) {
        throw new Error(`Unknown node type: ${typeId}`);
    }
    
    // Some properties might arrive as themes: strings
    const resolvedProps = { ...properties };
    return await node.evaluate(inputs, resolvedProps);
});
