import { Platform, StyleSheet, View } from 'react-native';
import { Frost } from '@/components/ui/Frost';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, tentzu } from '@/theme/tokens';
import { TentzuBackground } from '@/components/onboarding/TentzuBackground';
import { useAuth } from '@/store/auth';

export default function TabsLayout() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  // Dashboard is the final destination — hard-gated. Anyone not signed in goes
  // back to the single front door, which decides where they belong based on
  // WHY they are signed out. This guard deliberately does NOT pick a
  // destination itself: when it did, it raced the caller's own navigation after
  // logout and usually won, dumping the user into the survey.
  if (status === 'signedOut') return <Redirect href="/" />;
  if (status === 'signedIn' && user && !user.onboarding_complete) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <TentzuBackground variant="deep" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarActiveTintColor: tentzu.primary,
          tabBarInactiveTintColor: colors.muted,
          // Glass tab bar: translucent over the backdrop with a real blur
          // behind it, so the chrome belongs to the same material as the cards.
          // Detached floating pill, inset from the edges — the comps never run
          // the bar edge to edge. SPEC §6.
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 18,
            height: 66,
            borderRadius: 28,
            borderTopWidth: 0,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: 'transparent',
            elevation: 0,
            shadowColor: '#0b3b45',
            shadowOpacity: 0.14,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
          },
          tabBarItemStyle: { borderRadius: 20 },
          tabBarBackground: () => (
            <View style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}>
              <Frost intensity={48} />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
      </Tabs>
    </View>
  );
}
