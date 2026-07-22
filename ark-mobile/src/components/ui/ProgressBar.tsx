import { View } from 'react-native';
import { cn } from '@/lib/cn';

type ProgressBarProps = {
  step: number;
  total: number;
  className?: string;
};

/** Thin top progress bar — fills proportionally to step/total. */
export function ProgressBar({ step, total, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, step / total));
  return (
    <View className={cn('h-1 w-full bg-line rounded-pill overflow-hidden', className)}>
      <View
        className="h-full bg-ink rounded-pill"
        style={{ width: `${pct * 100}%` }}
      />
    </View>
  );
}
