import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthService} from '@services/AuthService';
import LoginScreen from '@screens/LoginScreen';
import ControlsScreen from '@screens/ControlsScreen';
import AboutScreen from '@screens/AboutScreen';
import AlarmsScreen from '@screens/AlarmsScreen';
import {pollManager} from './services/PollManager';
import {NativeBridge} from './native/NativeBridge';
import {Platform} from 'react-native';

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const authService = new AuthService();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const loggedIn = await authService.isLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      try {
        await pollManager.ensureRunning();
        if (Platform.OS === 'android') {
          await NativeBridge.startForegroundService();
        }
      } catch (e) {
        // best-effort; avoid crashing app on startup
        console.warn('Failed to start global polling', e);
      }
    }
  };

  if (isLoggedIn === null) {
    return null; // Loading
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Controls" component={ControlsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Alarms" component={AlarmsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
