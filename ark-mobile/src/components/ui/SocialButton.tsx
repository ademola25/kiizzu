import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';

type Provider = 'apple' | 'google';

type SocialButtonProps = PressableProps & {
  provider: Provider;
  className?: string;
};

const config: Record<
  Provider,
  { label: string; icon: keyof typeof Ionicons.glyphMap; filled: boolean }
> = {
  apple: { label: 'Sign in with Apple', icon: 'logo-apple', filled: true },
  google: { label: 'Sign in with Google', icon: 'logo-google', filled: false },
};

/** Apple/Google sign-in pill. Apple is filled-black; Google is outlined. */
export function SocialButton({ provider, className, ...props }: SocialButtonProps) {
  const { label, icon, filled } = config[provider];
  return (
    <Pressable
      className={cn(
        'h-14 rounded-pill flex-row items-center justify-center gap-3 px-6',
        filled ? 'bg-ink' : 'bg-paper border border-line',
        className,
      )}
      {...props}
    >
      <Ionicons name={icon} size={20} color={filled ? '#FFFFFF' : '#000000'} />
      <Text
        className={cn('text-base font-semibold', filled ? 'text-paper' : 'text-ink')}
      >
        {label}
      </Text>
    </Pressable>
  );
}
