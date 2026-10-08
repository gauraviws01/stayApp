import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  assertSecureStorageAvailable,
  clearRememberedCredentials,
  getAppPin,
  getRememberedCredentials,
  saveAppPin,
  saveRememberedCredentials,
} from '../utils/authStorage';

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F9FCFA';

const LOGIN_API = 'https://staysereno.in/api/staff/login';

// const LOGO_URL = 'https://staysereno.in/frontend/assets/images/logo-shape.svg';

const PIN_LENGTH = 4;

const LoginScreen = ({navigation, route}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(route?.params?.mode || 'credentials');
  const [rememberMe, setRememberMe] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  useEffect(() => {
    if (route?.params?.mode) {
      setMode(route.params.mode);
      setPin('');
      setConfirmPin('');
    }
  }, [route?.params?.mode]);

  useEffect(() => {
    const loadRememberedCredentials = async () => {
      try {
        const credentials = await getRememberedCredentials();

        if (credentials) {
          setEmail(credentials.email);
          setPassword(credentials.password);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('REMEMBERED CREDENTIALS ERROR:', error);
        Alert.alert(
          'Secure Storage Error',
          'Saved credentials could not be loaded. Please enter them manually.',
        );
      }
    };

    if (mode === 'credentials') {
      loadRememberedCredentials();
    }
  }, [mode]);

  const openMainApp = async () => {
    const [storedProperties, storedUser] = await Promise.all([
      AsyncStorage.getItem('properties'),
      AsyncStorage.getItem('user'),
    ]);
    const properties = storedProperties ? JSON.parse(storedProperties) : [];
    const user = storedUser ? JSON.parse(storedUser) : null;

    navigation.replace('MainApp', {properties, user});
  };

  const handlePinSubmit = async () => {
    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Validation', 'Please enter a 4-digit PIN.');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'setupPin') {
        if (pin !== confirmPin) {
          Alert.alert('PIN Mismatch', 'The PINs do not match. Try again.');
          setConfirmPin('');
          return;
        }

        await saveAppPin(pin);
        const savedPin = await getAppPin();

        if (savedPin !== pin) {
          throw new Error(
            'The PIN could not be verified in secure storage. Please try again.',
          );
        }
      } else {
        const storedPin = await getAppPin();

        if (!storedPin) {
          throw new Error(
            'Your saved PIN is unavailable. Log in with your email and password to set a new PIN.',
          );
        }

        if (storedPin !== pin) {
          Alert.alert('Incorrect PIN', 'Please enter the correct PIN.');
          setPin('');
          return;
        }
      }

      await AsyncStorage.setItem('appPinConfigured', 'true');
      await openMainApp();
    } catch (error) {
      console.log('PIN ERROR:', error);
      Alert.alert(
        'PIN Error',
        error?.message || 'Unable to verify your PIN. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your email.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      assertSecureStorageAvailable();

      const response = await fetch(LOGIN_API, {
        method: 'POST',

        headers: {
          Accept: 'application/json',

          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const responseText = await response.text();

      console.log('LOGIN RAW RESPONSE:', responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        throw new Error('Invalid server response.');
      }

      console.log('LOGIN RESPONSE:', JSON.stringify(data, null, 2));

      if (response.ok && data?.status === true) {
        if (rememberMe) {
          await saveRememberedCredentials(email.trim(), password);
        } else {
          await clearRememberedCredentials();
        }

        /* ==========================================
           TOKEN
        ========================================== */

        if (data?.token) {
          const token = String(data.token).trim();
          await AsyncStorage.setMany({
            authToken: token,
            token,
            access_token: token,
            userToken: token,
          });
        }

        /* ==========================================
           USER / ADMIN
        ========================================== */

        const user = data?.admin || data?.user || null;

        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));

          await AsyncStorage.setItem('userData', JSON.stringify(user));

          if (user?.id != null) {
            await AsyncStorage.setItem('userId', String(user.id));
          }
        }

        /* ==========================================
           PROPERTIES / UNITS

           IMPORTANT:
           Calendar will receive these units.
        ========================================== */

        const properties = Array.isArray(data?.properties)
          ? data.properties
          : [];

        console.log('LOGIN PROPERTIES:', properties);

        await AsyncStorage.setItem('properties', JSON.stringify(properties));

        /* ==========================================
           COMPLETE LOGIN RESPONSE
        ========================================== */

        await AsyncStorage.setItem('loginResponse', JSON.stringify(data));
        await AsyncStorage.setItem('authTimestamp', String(Date.now()));
        setPin('');
        setConfirmPin('');
        setMode('setupPin');
      } else {
        Alert.alert(
          'Login Failed',
          data?.message || 'Invalid email or password.',
        );
      }
    } catch (error) {
      console.log('LOGIN ERROR:', error);

      Alert.alert(
        error?.message?.includes('Secure storage is unavailable')
          ? 'Secure Storage Unavailable'
          : 'Network Error',
        error?.message?.includes('Secure storage is unavailable')
          ? error.message
          : error?.message || 'Unable to connect to server. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        > */}

          <View style={styles.logoSection}>

            <View style={styles.brandRow}>
              <Text style={styles.stayText}>Housekeeping</Text>

              <Text style={styles.serenoText}>Heroes</Text>
            </View>

            <View style={styles.brandDivider} />

            <Text style={styles.staffText}>
              A <Text style={styles.productBrand}>StaySereno</Text> PRODUCT
            </Text>
          </View>

          {/* LOGIN CARD */}

          <View style={styles.loginCard}>
            <Text style={styles.welcomeText}>
              {mode === 'setupPin'
                ? 'Create Your PIN'
                : 'Welcome Back'}
            </Text>

            <Text style={styles.subtitle}>
              {mode === 'setupPin'
                ? 'Set a 4-digit PIN to unlock the app each time you open it'
                : mode === 'pin'
                  ? 'Enter your PIN to continue'
                  : 'Login to manage your maintenance tasks'}
            </Text>

            {mode === 'credentials' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>

                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#9AA8A2"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>

                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#9AA8A2"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      style={styles.input}
                    />

                    <TouchableOpacity
                      style={styles.showButton}
                      activeOpacity={0.7}
                      disabled={loading}
                      onPress={() => setShowPassword(previous => !previous)}>
                      <Text style={styles.showText}>
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.rememberRow}
                  activeOpacity={0.75}
                  disabled={loading}
                  onPress={() => setRememberMe(previous => !previous)}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: rememberMe}}>
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}>
                    {rememberMe ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {mode === 'setupPin' ? '4-digit PIN' : 'PIN'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={pin}
                      onChangeText={value =>
                        setPin(value.replace(/\D/g, '').slice(0, PIN_LENGTH))
                      }
                      placeholder="Enter 4-digit PIN"
                      placeholderTextColor="#9AA8A2"
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={PIN_LENGTH}
                      editable={!loading}
                      style={styles.input}
                    />
                  </View>
                </View>

                {mode === 'setupPin' ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm PIN</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={confirmPin}
                        onChangeText={value =>
                          setConfirmPin(
                            value.replace(/\D/g, '').slice(0, PIN_LENGTH),
                          )
                        }
                        placeholder="Re-enter your PIN"
                        placeholderTextColor="#9AA8A2"
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={PIN_LENGTH}
                        editable={!loading}
                        style={styles.input}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    disabled={loading}
                    onPress={() => {
                      setPin('');
                      setMode('credentials');
                    }}>
                    <Text style={styles.recoveryText}>
                      Forgot PIN? Log in with email and password
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* LOGIN */}

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={mode === 'credentials' ? handleLogin : handlePinSubmit}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {mode === 'setupPin'
                    ? 'Set PIN'
                    : mode === 'pin'
                      ? 'Unlock'
                      : 'Login'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            © StaySereno • Maintenance Portal
          </Text>
        {/* </ScrollView> */}
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    
    alignItems: 'center',
    justifyContent: 'center',
  },

  flex: {
    // flex: ,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 45,
    paddingBottom: 300,
    
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 35,
  },

  logoWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  brandRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },

  stayText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: DARK,
    letterSpacing: 0,
  },

  serenoText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0,
  },

  brandDivider: {
    width: '64%',
    height: 1,
    marginTop: 16,
    marginBottom: 15,
    backgroundColor: '#D6E5DD',
  },

  staffText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: '#687770',
  },

  productBrand: {
    fontWeight: '800',
    color: DARK,
  },

  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,

    shadowColor: '#173C2F',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,

    elevation: 5,
  },

  welcomeText: {
    fontSize: 27,
    fontWeight: '800',
    color: DARK,
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#7A8882',
    marginBottom: 27,
  },

  inputGroup: {
    marginBottom: 20,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -5,
    marginBottom: 16,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#B8C9C1',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  checkboxChecked: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '800',
  },

  rememberText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '600',
  },

  recoveryText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '700',
    marginTop: -6,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 9,
  },

  inputWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: '#DDE7E2',
    borderRadius: 13,
    backgroundColor: '#FBFDFC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    color: DARK,
    fontSize: 15,
  },

  showButton: {
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
  },

  showText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: PRIMARY,
  },

  loginButton: {
    height: 55,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,

    shadowColor: PRIMARY,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,

    elevation: 4,
  },

  loginButtonDisabled: {
    opacity: 0.75,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  footerText: {
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: 30,
    fontSize: 11,
    color: '#9AA7A1',
  },
});
