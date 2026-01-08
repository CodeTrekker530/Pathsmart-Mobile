/* eslint-disable prettier/prettier */
import { Svg, G, Line, Circle, Text, Path } from 'react-native-svg';
import React from 'react';
import saveData from './saveData.json';

const START_POINT_RADIUS = 20;
const HIGHLIGHT_COLOR = '#609966';
const DEFAULT_COLOR = '#D9D9D9';
const START_POINT_COLOR = '#ff0000ff';
const SELECTED_START_COLOR = '#0059FF';

// Color Constants
export const COLORS = {
  HIGHLIGHT: HIGHLIGHT_COLOR,
  DEFAULT: DEFAULT_COLOR,
  START_POINT: START_POINT_COLOR,
  SELECTED_START: SELECTED_START_COLOR,
  PATH_LINE: '#0059FF',
  DESTINATION_MARKER: 'white',
};

// ===== RENDERER COMPONENTS =====

// Renderer: Destination Marker
export const DestinationMarker = ({ x, y }) => (
  <Circle
    cx={x}
    cy={y}
    r={16}
    fill={COLORS.DESTINATION_MARKER}
    stroke={COLORS.PATH_LINE}
    strokeWidth="5"
  />
);

// Renderer: Path Line
export const PathLine = ({ from, to, nodes, isLastNode = false }) => {
  const start = nodes[from];
  const end = nodes[to];

  if (!start || !end) return null;

  return (
    <G>
      <Line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={COLORS.PATH_LINE}
        strokeWidth="6"
      />
      {isLastNode && <DestinationMarker x={end.x} y={end.y} />}
    </G>
  );
};



// Default export for React Native routing compatibility
export default {
  DestinationMarker,
  PathLine,
  COLORS,
};



