import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#262626',
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood AI',
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'My Music',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'My Mood',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
