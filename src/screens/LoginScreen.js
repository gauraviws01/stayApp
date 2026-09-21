import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SvgUri} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F9FCFA';

const LOGIN_API =
  'https://staysereno.in/api/staff/login';

const LOGO_URL =
  'https://staysereno.in/frontend/assets/images/logo-shape.svg';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Validation',
        'Please enter your email.',
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert(
        'Validation',
        'Please enter your password.',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        LOGIN_API,
        {
          method: 'POST',

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const responseText =
        await response.text();

      console.log(
        'LOGIN RAW RESPONSE:',
        responseText,
      );

      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch (error) {
        throw new Error(
          'Invalid server response.',
        );
      }

      console.log(
        'LOGIN RESPONSE:',
        JSON.stringify(
          data,
          null,
          2,
        ),
      );

      if (
        response.ok &&
        data?.status === true
      ) {
        /* ==========================================
           TOKEN
        ========================================== */

        if (data?.token) {
          await AsyncStorage.setItem(
            'authToken',
            String(data.token),
          );
        }

        /* ==========================================
           USER / ADMIN
        ========================================== */

        const user =
          data?.admin ||
          data?.user ||
          null;

        if (user) {
          await AsyncStorage.setItem(
            'user',
            JSON.stringify(user),
          );

          await AsyncStorage.setItem(
            'userData',
            JSON.stringify(user),
          );

          if (user?.id != null) {
            await AsyncStorage.setItem(
              'userId',
              String(user.id),
            );
          }
        }

        /* ==========================================
           PROPERTIES / UNITS

           IMPORTANT:
           Calendar will receive these units.
        ========================================== */

        const properties =
          Array.isArray(
            data?.properties,
          )
            ? data.properties
            : [];

        console.log(
          'LOGIN PROPERTIES:',
          properties,
        );

        await AsyncStorage.setItem(
          'properties',
          JSON.stringify(
            properties,
          ),
        );

        /* ==========================================
           COMPLETE LOGIN RESPONSE
        ========================================== */

        await AsyncStorage.setItem(
          'loginResponse',
          JSON.stringify(data),
        );

        /* ==========================================
           GO CALENDAR
        ========================================== */

        navigation.replace(
          'MainApp',
          {
            properties,
            user,
          },
        );
      } else {
        Alert.alert(
          'Login Failed',
          data?.message ||
            'Invalid email or password.',
        );
      }
    } catch (error) {
      console.log(
        'LOGIN ERROR:',
        error,
      );

      Alert.alert(
        'Network Error',
        error?.message ||
          'Unable to connect to server. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          BACKGROUND
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }>

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }>

          {/* LOGO */}

          <View
            style={
              styles.logoSection
            }>

            <View
              style={
                styles.logoWrapper
              }>

              <SvgUri
                uri={LOGO_URL}
                width={90}
                height={90}
              />

            </View>

            <View
              style={
                styles.brandRow
              }>

              <Text
                style={
                  styles.stayText
                }>
                Stay
              </Text>

              <Text
                style={
                  styles.serenoText
                }>
                Sereno
              </Text>

            </View>

            <Text
              style={
                styles.staffText
              }>
              MAINTENANCE STAFF
            </Text>

          </View>

          {/* LOGIN CARD */}

          <View
            style={
              styles.loginCard
            }>

            <Text
              style={
                styles.welcomeText
              }>
              Welcome Back
            </Text>

            <Text
              style={
                styles.subtitle
              }>
              Login to manage your maintenance tasks
            </Text>

            {/* EMAIL */}

            <View
              style={
                styles.inputGroup
              }>

              <Text
                style={
                  styles.label
                }>
                Email Address
              </Text>

              <View
                style={
                  styles.inputWrapper
                }>

                <TextInput
                  value={email}
                  onChangeText={
                    setEmail
                  }
                  placeholder="Enter your email"
                  placeholderTextColor="#9AA8A2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={
                    styles.input
                  }
                />

              </View>

            </View>

            {/* PASSWORD */}

            <View
              style={
                styles.inputGroup
              }>

              <Text
                style={
                  styles.label
                }>
                Password
              </Text>

              <View
                style={
                  styles.inputWrapper
                }>

                <TextInput
                  value={
                    password
                  }
                  onChangeText={
                    setPassword
                  }
                  placeholder="Enter your password"
                  placeholderTextColor="#9AA8A2"
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={
                    styles.input
                  }
                />

                <TouchableOpacity
                  style={
                    styles.showButton
                  }
                  activeOpacity={0.7}
                  disabled={loading}
                  onPress={() =>
                    setShowPassword(
                      previous =>
                        !previous,
                    )
                  }>

                  <Text
                    style={
                      styles.showText
                    }>
                    {showPassword
                      ? 'HIDE'
                      : 'SHOW'}
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

            {/* LOGIN */}

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading &&
                  styles.loginButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={
                handleLogin
              }>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.loginButtonText
                  }>
                  Login
                </Text>
              )}

            </TouchableOpacity>

          </View>

          <Text
            style={
              styles.footerText
            }>
            © StaySereno • Maintenance Portal
          </Text>

        </ScrollView>

      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    flex: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 45,
      paddingBottom: 25,
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
      flexDirection: 'row',
      alignItems: 'center',
    },

    stayText: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      color: DARK,
      letterSpacing: -1.5,
    },

    serenoText: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '800',
      color: PRIMARY,
      letterSpacing: -1.5,
    },

    staffText: {
      marginTop: 7,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2.2,
      color: '#687770',
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