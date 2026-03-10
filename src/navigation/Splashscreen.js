import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StatusBar, StyleSheet, View } from "react-native";
import COLORS from "../theme/colors";

export default function SplashScreen({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade + soft zoom
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Text appear slightly after
    setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Stay for 3 seconds total, then fade out
    setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 5000);
  }, [containerOpacity, logoOpacity, logoScale, textOpacity, onFinish]);

  return (
    <Animated.View style={{ flex: 1, opacity: containerOpacity }}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <MaterialCommunityIcons
            name="office-building"
            size={120}
            color={COLORS.WHITE}
          />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
          Live Intelligently
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
          Smart Property Management
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});
