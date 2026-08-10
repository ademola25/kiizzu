import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, tentzu } from '@/theme/tokens';
import { TentzuBackground } from '@/components/onboarding/TentzuBackground';
import { useAuth } from '@/store/auth';

export default function TabsLayout() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  // Dashboard is the final destination — hard-gated. Anyone not signed in goes
  // back to the single front door (the gate routes them into onboarding); a
  // signed-in user who hasn't finished onboarding resumes it.
  if (status === 'signedOut') return <Redirect href="/" />;
  if (status === 'signedIn' && user && !user.onboarding_complete) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <TentzuBackground />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarActiveTintColor: tentzu.primary,
          tabBarInactiveTintColor: colors.muted,
          // Glass tab bar: translucent over the backdrop with a real blur
          // behind it, so the chrome belongs to the same material as the cards.
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopColor: 'rgba(255,255,255,0.7)',
            elevation: 0,
          },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              <BlurView
                intensity={Platform.OS === 'android' ? 28 : 48}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: `rgba(255,255,255,${
                      Platform.OS === 'android' ? 0.74 : 0.55
                    })`,
                  },
                ]}
              />
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
