import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  /** Days remaining. Negative means overdue. */
  days: number;
  /** Days in the full cycle, used to fill the arc. */
  cycleDays?: number;
  size?: number;
};

/**
 * Countdown as an arc rather than a bare number.
 *
 * The comps use a ring on both the rent hero and the tenancy-health card, and
 * it does real work: a number alone gives no sense of *how close* you are, so
 * "30" and "3" look identical at a glance. The arc encodes urgency before the
 * digits are read, and the colour shifts with it.
 */
export function CountdownRing({ days, cycleDays = 90, size = 132 }: Props) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  // Fraction of the cycle already elapsed — the ring fills as the date nears.
  const remaining = Math.max(0, Math.min(days, cycleDays));
  const elapsed = 1 - remaining / cycleDays;
  const dash = circumference * (days < 0 ? 1 : elapsed);

  const overdue = days < 0;
  const urgent = days >= 0 && days <= 7;
  const [from, to] = overdue
    ? ['#ff8a80', '#d32f2f']
    : urgent
      ? ['#ffb74d', '#f57c00']
      : ['#22D3E8', '#12A9D6'];

  const label = overdue ? 'overdue' : days === 0 ? 'today' : days === 1 ? 'day' : 'days';
  const value = overdue ? Math.abs(days) : days;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(13,43,62,0.10)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress — rotated so it starts at 12 o'clock. */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <Text
        style={{
          fontFamily: tentzuFont.headlineBold,
          fontSize: 42,
          lineHeight: 46,
          letterSpacing: -1.5,
          color: overdue ? '#c62828' : tentzu.ink,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: tentzuFont.label,
          fontSize: 13,
          color: tentzu.mutedInk,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
