import React from 'react';
import { type DimensionValue, View } from 'react-native';

// Define the component type with static properties
interface CustomGapComponent extends React.FC<{ height?: DimensionValue; width?: DimensionValue }> {
  small: JSX.Element;
  smallV: JSX.Element;
  smallH: JSX.Element;
  large: JSX.Element;
  largeV: JSX.Element;
  largeH: JSX.Element;
  medium: JSX.Element;
  mediumV: JSX.Element;
  mediumH: JSX.Element;
}

const defaultDimensionValue = 16;

// Define the CustomGap component
const CustomGap: CustomGapComponent = ({ height, width }) => {
  return (
    <View
      style={{ width: width ?? defaultDimensionValue, height: height ?? defaultDimensionValue }}
    />
  );
};

// Assign static properties for predefined gaps
CustomGap.small = <CustomGap height={8} width={8} />;
CustomGap.medium = <CustomGap height={16} width={16} />;
CustomGap.large = <CustomGap height={32} width={32} />;
CustomGap.smallV = <CustomGap height={8} />;
CustomGap.mediumV = <CustomGap height={16} />;
CustomGap.largeV = <CustomGap height={32} />;
CustomGap.smallH = <CustomGap width={8} />;
CustomGap.mediumH = <CustomGap width={16} />;
CustomGap.largeH = <CustomGap width={32} />;

export default CustomGap;
