import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

type CardProps = ViewProps & {
  className?: string;
};

/** White rounded card with soft shadow — the Cal AI surface primitive. */
export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-card bg-paper border border-line p-5',
        'shadow-sm shadow-black/5',
        className,
      )}
      {...props}
    />
  );
}
