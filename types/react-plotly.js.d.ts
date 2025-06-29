declare module 'react-plotly.js' {
  import { Component } from 'react';

  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    frames?: any[];
    className?: string;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    debug?: boolean;
    clearOnUnmount?: boolean;
    onClick?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnHover?: (event: any) => void;
    onSelected?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onUpdate?: (event: any) => void;
    onLegendClick?: (event: any) => void;
    onLegendDoubleClick?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onSliderValueChange?: (event: any) => void;
    onSliderValueChangeEnd?: (event: any) => void;
    onSliderValueChangeStart?: (event: any) => void;
    onInitialized?: (figure: any) => void;
    onPurge?: (figure: any) => void;
    onError?: (error: any) => void;
    onAfterPlot?: () => void;
    onAfterExport?: () => void;
    onBeforeExport?: () => void;
    onBeforeHover?: () => void;
    onBeforePlot?: () => void;
    onButtonClicked?: (event: any) => void;
    onClickAnnotation?: (event: any) => void;
    onFramework?: (event: any) => void;
  }

  class Plot extends Component<PlotParams> {}

  export default Plot;
}
