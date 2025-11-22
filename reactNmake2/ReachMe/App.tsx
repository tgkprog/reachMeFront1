/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import ControlsScreen from './src/screens/ControlsScreen';
import AboutScreen from './src/screens/AboutScreen';
import AlarmsScreen from './src/screens/AlarmsScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Controls" component={ControlsScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Alarms" component={AlarmsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
