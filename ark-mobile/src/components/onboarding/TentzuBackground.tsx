import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, G, Path } from 'react-native-svg';

/**
 * Soft, atmospheric Dubai backdrop drawn in SVG (no photo assets): a dawn sky
 * gradient, a warm haze glow, a recognizable skyline (with the Burj Khalifa) on
 * the horizon, and a light scrim on top so content cards + text stay legible.
 * Rendered absolutely behind a screen's content (pointerEvents none).
 */
export function TentzuBackground() {
  const { width: W, height: H } = useWindowDimensions();
  const horizon = H * 0.62;

  // Simple flat/antenna towers (x, width as fractions of W; height in px).
  const towers = [
    { x: 0.0, w: 0.075, h: 66 },
    { x: 0.085, w: 0.05, h: 120, ant: true },
    { x: 0.15, w: 0.085, h: 92 },
    { x: 0.31, w: 0.06, h: 104 },
    { x: 0.385, w: 0.045, h: 148, ant: true },
    { x: 0.58, w: 0.06, h: 116 },
    { x: 0.65, w: 0.088, h: 78 },
    { x: 0.82, w: 0.075, h: 98 },
    { x: 0.9, w: 0.055, h: 138, ant: true },
    { x: 0.96, w: 0.05, h: 74 },
  ];

  // Burj Khalifa — tapered, stepped spire with a needle, centered.
  const bx = W * 0.5;
  const s = W / 402; // scale to a ~402pt reference width
  const burj = `M${bx - 26 * s} ${horizon}
    L${bx - 17 * s} ${horizon - 120 * s}
    L${bx - 11 * s} ${horizon - 210 * s}
    L${bx - 6 * s} ${horizon - 292 * s}
    L${bx - 2.4 * s} ${horizon - 342 * s}
    L${bx} ${horizon - 400 * s}
    L${bx + 2.4 * s} ${horizon - 342 * s}
    L${bx + 6 * s} ${horizon - 292 * s}
    L${bx + 11 * s} ${horizon - 210 * s}
    L${bx + 17 * s} ${horizon - 120 * s}
    L${bx + 26 * s} ${horizon} Z`;

  // A tapered tower (trapezoid) helper on the right.
  const taper = (cx: number, base: number, top: number, height: number) =>
    `M${cx - base} ${horizon} L${cx - top} ${horizon - height} L${cx + top} ${horizon - height} L${cx + base} ${horizon} Z`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="tz-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#cfeaea" />
            <Stop offset="0.45" stopColor="#e6f5f4" />
            <Stop offset="1" stopColor="#f9fbfb" />
          </LinearGradient>
          <RadialGradient id="tz-sun" cx="0.82" cy="0.15" r="0.55">
            <Stop offset="0" stopColor="#ffe1b6" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#ffe1b6" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={W} height={H} fill="url(#tz-sky)" />
        <Rect x={0} y={0} width={W} height={H} fill="url(#tz-sun)" />

        <G fill="#5f8787" opacity={0.16}>
          {towers.map((t, i) => (
            <Rect key={i} x={t.x * W} y={horizon - t.h} width={t.w * W} height={t.h} rx={2} />
          ))}
          {/* antennas */}
          {towers
            .filter((t) => t.ant)
            .map((t, i) => (
              <Rect key={`a${i}`} x={(t.x + t.w / 2) * W - 1} y={horizon - t.h - 22 * s} width={2} height={22 * s} />
            ))}
          {/* a couple of tapered towers for variety */}
          <Path d={taper(W * 0.24, 34 * s, 12 * s, 168 * s)} />
          <Path d={taper(W * 0.75, 30 * s, 10 * s, 176 * s)} />
          <Rect x={W * 0.75 - 1} y={horizon - 176 * s - 26 * s} width={2} height={26 * s} />
          {/* Burj Khalifa */}
          <Path d={burj} />
        </G>

        {/* legibility scrim */}
        <Rect x={0} y={0} width={W} height={H} fill="#ffffff" opacity={0.36} />
      </Svg>
    </View>
  );
}
