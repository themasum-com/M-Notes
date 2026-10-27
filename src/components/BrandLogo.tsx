import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const SIZES = {
  sm: 28,
  md: 42,
  lg: 72,
  xl: 96,
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', style }) => {
  const dimension = SIZES[size];
  const borderRadius = Math.round(dimension * 0.22);

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius,
        },
        style,
      ]}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={[
          styles.image,
          {
            width: '100%',
            height: '100%',
            borderRadius,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FED766',
    overflow: 'hidden',
  },
  image: {
    overflow: 'hidden',
  },
});

export default BrandLogo;
