import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tentzu, tentzuFont } from '@/theme/tokens';
import { todayISO } from '@/lib/schedule';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function iso(y: number, m0: number, d: number): string {
  return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

type Props = {
  value: string | null;
  onChange: (isoDate: string) => void;
  minISO?: string; // dates before this are disabled; defaults to today
};

// A calm, self-contained month calendar. Pure JS (no native date-picker module)
// so it behaves identically in Expo Go on iOS and Android.
export function TentzuCalendar({ value, onChange, minISO }: Props) {
  const min = minISO ?? todayISO();
  const [minY, minM] = min.split('-').map(Number);

  const initial = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : min;
  const [iy, im] = initial.split('-').map(Number);
  const [view, setView] = useState({ year: iy, month0: im - 1 });

  const firstWeekday = new Date(view.year, view.month0, 1).getDay();
  const daysInMonth = new Date(view.year, view.month0 + 1, 0).getDate();

  // Can't page earlier than the month that contains `min`.
  const atMinMonth = view.year < minY || (view.year === minY && view.month0 <= minM - 1);

  const go = (delta: number) => {
    setView((v) => {
      const next = v.month0 + delta;
      return { year: v.year + Math.floor(next / 12), month0: ((next % 12) + 12) % 12 };
    });
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View
      style={{
        backgroundColor: tentzu.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tentzu.fieldBorder,
        padding: 16,
        shadowColor: tentzu.primary,
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      }}
    >
      {/* Month header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Pressable
          onPress={() => !atMinMonth && go(-1)}
          disabled={atMinMonth}
          hitSlop={8}
          accessibilityLabel="Previous month"
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: atMinMonth ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-back" size={20} color={tentzu.ink} />
        </Pressable>
        <Text style={{ fontFamily: tentzuFont.label, fontSize: 15, color: tentzu.ink }}>
          {MONTHS[view.month0]} {view.year}
        </Text>
        <Pressable
          onPress={() => go(1)}
          hitSlop={8}
          accessibilityLabel="Next month"
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-forward" size={20} color={tentzu.ink} />
        </Pressable>
      </View>

      {/* Weekday row */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {WEEKDAYS.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: tentzuFont.label, fontSize: 11, color: tentzu.mutedInk }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`b${idx}`} style={{ width: `${100 / 7}%`, height: 42 }} />;
          const cellISO = iso(view.year, view.month0, day);
          const disabled = cellISO < min;
          const selected = value === cellISO;
          return (
            <View key={cellISO} style={{ width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <Pressable
                onPress={() => !disabled && onChange(cellISO)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? tentzu.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: selected ? tentzuFont.label : tentzuFont.body,
                    fontSize: 15,
                    color: selected ? '#ffffff' : disabled ? '#c4d0cf' : tentzu.ink,
                  }}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
