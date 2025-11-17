import React, {useState} from 'react';
import {View, Text, Button, StyleSheet, Alert, Platform} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {AuthService} from '../services/AuthService';
import {config} from '../config';
import {User} from '../types';

interface Props {
  navigation: any;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [loading, setLoading] = useState(false);
  const authService = new AuthService();

  const handleGoogleLogin = async () => {
    // Check 3-minute debounce
    const canAttempt = await authService.canAttemptLogin();
    if (!canAttempt) {
      Alert.alert('Please wait', 'Please wait 3 minutes before trying again');
      return;
    }

    setLoading(true);
    try {
      // Configure Google Sign In
      GoogleSignin.configure({
        webClientId: config.oauth.google.webClientId,
        offlineAccess: true,
      });

      // Sign in
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const email = userInfo.user.email || '';

      // Record attempt
      await authService.recordLoginAttempt();

      // Check with backend
      const response = await authService.checkUserAllowed(email);

      if (response.allowed) {
        const user: User = {
          email: email,
          firstName: userInfo.user.givenName || '',
          lastName: userInfo.user.familyName || '',
          photoUrl: userInfo.user.photo || undefined,
        };

        await authService.login(user);
        navigation.replace('Controls');
      } else {
        Alert.alert('Access Denied', response.message || 'You are not allowed to use this app');
        await GoogleSignin.signOut();
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAbout = () => {
    navigation.navigate('About');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ReachMe</Text>
      <Text style={styles.subtitle}>Stay connected, always</Text>

      <View style={styles.buttonContainer}>
        <Button title="Sign in with Google" onPress={handleGoogleLogin} disabled={loading} />
      </View>

      <Button title="About" onPress={showAbout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});

export default LoginScreen;
