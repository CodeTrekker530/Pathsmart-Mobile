import React from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function MarqueeText({ children, style, containerStyle }) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [textWidth, setTextWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const text = String(children ?? "");
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const { marginLeft, marginRight, ...textStyle } = flattenedStyle;

  React.useEffect(() => {
    translateX.stopAnimation();

    if (!containerWidth || !textWidth || textWidth <= containerWidth + 1) {
      translateX.setValue(0);
      return undefined;
    }

    translateX.setValue(containerWidth);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -textWidth,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: containerWidth,
          duration: 1,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [containerWidth, text, textWidth, translateX]);

  return (
    <View
      style={[{ overflow: "hidden", marginLeft, marginRight }, containerStyle]}
      onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Animated.Text
        numberOfLines={1}
        ellipsizeMode="clip"
        onTextLayout={event => {
          const measuredWidth = event.nativeEvent.lines[0]?.width || 0;
          setTextWidth(currentWidth =>
            currentWidth === measuredWidth ? currentWidth : measuredWidth
          );
        }}
        style={[textStyle, { flexShrink: 0, transform: [{ translateX }] }]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}
