import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import AuthService from '../services/AuthService';

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwMode, setPwMode] = useState(false);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing data', 'Email and password required');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await AuthService.passwordLogin(email, password);
      await AuthService.login(user, token);
      navigation.replace('Controls');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ReachMe</Text>
      <Text style={styles.subtitle}>Stay connected, always</Text>

      {!pwMode && (
        <View style={styles.buttonContainer}>
          <Button
            title="Sign in with Google"
            onPress={() => Alert.alert('Google login not wired in this build')}
            disabled={loading}
          />
        </View>
      )}

      {pwMode && (
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <Button
            title="Login"
            onPress={handlePasswordLogin}
            disabled={loading}
          />
        </View>
      )}

      <View style={styles.switchContainer}>
        <Button
          title={pwMode ? 'Use Google Login' : 'Use Email/Password'}
          onPress={() => setPwMode(m => !m)}
        />
      </View>

      <Button title="About" onPress={() => navigation.navigate('About')} />
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
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  buttonContainer: { marginBottom: 20 },
  formContainer: { width: '80%', marginBottom: 20, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  switchContainer: { marginBottom: 20 },
});

export default LoginScreen;
