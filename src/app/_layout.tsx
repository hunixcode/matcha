import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Tinos_400Regular } from '@expo-google-fonts/tinos/400Regular';
import { Tinos_400Regular_Italic } from '@expo-google-fonts/tinos/400Regular_Italic';
import { Tinos_700Bold } from '@expo-google-fonts/tinos/700Bold';
import { Tinos_700Bold_Italic } from '@expo-google-fonts/tinos/700Bold_Italic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavBar } from '@/components/NavBar';
import { DraftsProvider, useDrafts } from '@/store/drafts';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Tinos_400Regular,
    Tinos_400Regular_Italic,
    Tinos_700Bold,
    Tinos_700Bold_Italic,
  });

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <DraftsProvider>
        <StatusBar style="dark" />
        <AppStack />
      </DraftsProvider>
    </SafeAreaProvider>
  );
}

/** Garde l'écran de démarrage tant que les brouillons ne sont pas rechargés. */
function AppStack() {
  const { hydrated } = useDrafts();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Onglets : on bascule de l'un à l'autre sans empiler d'écrans. */}
        <Stack.Screen name="salles" options={{ animation: 'fade' }} />
      </Stack>
      <NavBar />
    </>
  );
}
