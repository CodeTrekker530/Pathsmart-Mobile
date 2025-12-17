import { Stack } from "expo-router";
import { SelectionProvider } from "./context/SelectionContext"; // adjust path as needed

import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import LandingAnimation from "./screens/landing_animation";

// Preload icon fonts used across the app to avoid web-timeout from FontFaceObserver
const iconFonts = {
  Feather: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
  Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
};

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts(iconFonts);

  // Keep splash visible until fonts are loaded to prevent icon font timeout on web
  useEffect(() => {
    if (fontError) {
      // If fonts fail to load, don't block the app; log and continue
      // eslint-disable-next-line no-console
      console.warn("Icon fonts failed to load:", fontError);
      setShowSplash(false);
      return;
    }

    if (!fontsLoaded) return;

    const timer = setTimeout(() => setShowSplash(false), 2000); // adjust duration
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  // While fonts are loading (or during the splash delay), show the landing animation
  if (showSplash || !fontsLoaded) {
    return <LandingAnimation onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SelectionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SelectionProvider>
  );
}
