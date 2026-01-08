import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function CategoryButton({ category, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[category.color, `${category.color}50`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Image
            source={category.image}
            style={styles.categoryImage}
            resizeMode="cover"
          />
          <Text style={styles.categoryName}>{category.name}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    width: (width - 52) / 2,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  gradient: {
    width: "100%",
    height: 75,
    paddingVertical: 12,
    paddingHorizontal: 12,
    position: "relative",
  },
  categoryImage: {
    width: 80,
    height: 80,
    position: "absolute",
    bottom: 0,
    right: 0,
    opacity: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    textAlign: "left",
    zIndex: 1,
  },
});
