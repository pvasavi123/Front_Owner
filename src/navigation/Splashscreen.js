import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, StatusBar, StyleSheet } from "react-native";

export default function SplashScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const textMove = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Building zoom animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Text animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textMove, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // Splash close
    setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 4500);
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: containerOpacity }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
        style={styles.container}
      >
        {/* Building Icon */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <MaterialCommunityIcons
            name="office-building"
            size={120}
            color="#FFFFFF"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: textOpacity,
              transform: [{ translateY: textMove }],
            },
          ]}
        >
          Live Intelligently
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: textOpacity,
              transform: [{ translateY: textMove }],
            },
          ]}
        >
          Smart Property Management
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#E0E0E0",
  },
});
