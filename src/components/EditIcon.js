import React from 'react';
import Svg, { G, Path, Polygon } from 'react-native-svg';

export default function EditIcon({ size = 24, color = '#000000', ...props }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G id="Complete">
        <G id="edit">
          <Path
            d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <Polygon
            points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </G>
      </G>
    </Svg>
  );
}