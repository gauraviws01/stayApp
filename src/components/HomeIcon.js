import React from 'react';
import Svg, { Polygon } from 'react-native-svg';

const HomeIcon = ({
  width = 64,
  height = 64,
  color = '#22A24D',
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      fill="none"
    >
      <Polygon
        points="434.162,293.382 434.162,493.862 308.321,493.862 308.321,368.583 203.682,368.583 203.682,493.862 77.841,493.862 77.841,293.382 256.002,153.862"
        fill={color}
      />

      <Polygon
        points="0,242.682 256,38.93 512,242.682 482.21,285.764 256,105.722 29.79,285.764"
        fill={color}
      />

      <Polygon
        points="439.853,18.138 439.853,148.538 376.573,98.138 376.573,18.138"
        fill={color}
      />
    </Svg>
  );
};

export default HomeIcon;