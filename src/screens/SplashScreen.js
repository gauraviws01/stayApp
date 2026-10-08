import React, {useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import SplashscreenImg from '../assets/splashscreen_img.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearAppPin, getAppPin} from '../utils/authStorage';

const {width, height} = Dimensions.get('window');

const PRIMARY = '#07996F';
const BACKGROUND = '#07996F';
const SESSION_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;

const SplashScreen = ({navigation}) => {
  const fadeAnim = useRef(
    new Animated.Value(0),
  ).current;

  const scaleAnim = useRef(
    new Animated.Value(0.85),
  ).current;

  useEffect(() => {

    const contentAnimation =
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]);

    contentAnimation.start();


    checkLogin();


    return () => {
      contentAnimation.stop();
    };
  }, [
    checkLogin,
    fadeAnim,
    scaleAnim,
  ]);


  const checkLogin = useCallback(async () => {
    let pinConfigured = null;
    let pin = null;

    try {
      const tokenKeys = ['authToken', 'token', 'access_token', 'userToken'];
      pinConfigured = await AsyncStorage.getItem('appPinConfigured');
      let authTimestamp = await AsyncStorage.getItem('authTimestamp');
      const storedTokens = await Promise.all(
        tokenKeys.map(key => AsyncStorage.getItem(key)),
      );
      const token = storedTokens.some(Boolean);

      try {
        pin = await getAppPin();
      } catch (error) {
        console.log('SPLASH PIN READ ERROR:', error);
      }

      const hasSession =
        token ||
        Boolean(authTimestamp) ||
        pinConfigured === 'true' ||
        Boolean(pin);

      await new Promise(resolve =>
        setTimeout(resolve, 1600),
      );

      if (hasSession) {
        const now = Date.now();

        if (!authTimestamp) {
          authTimestamp = String(now);
          await AsyncStorage.setItem('authTimestamp', authTimestamp);
        }

        const authenticatedAt = Number(authTimestamp);
        const sessionExpired =
          !Number.isFinite(authenticatedAt) ||
          authenticatedAt > now ||
          now - authenticatedAt >= SESSION_LENGTH_MS;

        if (sessionExpired) {
          await AsyncStorage.removeMany([
            'user',
            'userData',
            'userId',
            'properties',
            'loginResponse',
            'authToken',
            'token',
            'access_token',
            'userToken',
            'authTimestamp',
            'appPinConfigured',
          ]);
          await clearAppPin();
          navigation.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
          return;
        }

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Login',
              params: {
                mode: pin || pinConfigured === 'true' ? 'pin' : 'setupPin',
              },
            },
          ],
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
            params: {
              mode:
                pin || pinConfigured === 'true'
                  ? 'pin'
                  : 'credentials',
            },
          },
        ],
      });
    } catch (error) {
      console.log(
        'SPLASH LOGIN CHECK ERROR:',
        error,
      );
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
            params: {
              mode:
                pin || pinConfigured === 'true'
                  ? 'pin'
                  : 'credentials',
            },
          },
        ],
      });
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          BACKGROUND
        }
      />

      {/* =================================================
          TOP BACKGROUND SHAPE
      ================================================= */}

      <View style={styles.topShape} />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: scaleAnim,
              },
            ],
          },
        ]}>

        {/* =================================================
            LOGO
        ================================================= */}

        <View
          style={
            styles.logoWrapper
          }>
          {/* <SvgUri
            uri={LOGO_URL}
            width={125}
            height={125}
            onLoad={() => {
              console.log(
                'StaySereno SVG Loaded',
              );
            }}
            onError={error => {
              console.log(
                'StaySereno SVG Error:',
                error,
              );
            }}
          /> */}
          <SplashscreenImg
            width={width * 0.94}
            height={width * 0.94 * (798 / 851)}
          />
        </View>

        {/* =================================================
            BRAND
        ================================================= */}

        <View
          style={
            styles.brandRow
          }>
          <Text
            style={
              styles.stayText
            }>
            Housekeeping
          </Text>

          <Text
            style={
              styles.serenoText
            }>
            Heroes
          </Text>
        </View>

        {/* =================================================
            DIVIDER
        ================================================= */}

        <View
          style={
            styles.divider
          }
        />

        {/* =================================================
            STAFF
        ================================================= */}

        <Text
          style={
            styles.staffText
          }>
          A <Text style={styles.productBrand}>StaySereno</Text> PRODUCT
        </Text>

        {/* =================================================
            ACCENT
        ================================================= */}

        {/* <View
          style={
            styles.accentWrapper
          }>
          <View
            style={
              styles.accentLine
            }
          />

          <View
            style={
              styles.accentDot
            }
          />

          <View
            style={
              styles.accentLine
            }
          />
        </View> */}
      </Animated.View>

        {/* =================================================
          BACKGROUND WAVES
        ================================================= */}

      <View
        style={
          styles.bottomArea
        }>

        {/* =================================================
            SKYLINE
        ================================================= */}

        <View
          style={
            styles.skyline
          }>

          <View
            style={[
              styles.building,
              styles.building1,
            ]}>
            <View
              style={
                styles.windowsColumn
              }>
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
            </View>
          </View>

          <View
            style={[
              styles.building,
              styles.building2,
            ]}>
            <View
              style={
                styles.windowGrid
              }>
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
            </View>
          </View>

          <View
            style={[
              styles.building,
              styles.building3,
            ]}>
            <View
              style={
                styles.windowGrid
              }>
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
            </View>
          </View>

          <View
            style={[
              styles.building,
              styles.building4,
            ]}>
            <View
              style={
                styles.windowGrid
              }>
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
            </View>
          </View>

          <View
            style={[
              styles.building,
              styles.building5,
            ]}>
            <View
              style={
                styles.windowGrid
              }>
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
              <View
                style={
                  styles.window
                }
              />
            </View>
          </View>
        </View>

        {/* =================================================
            BACK HILL
        ================================================= */}

        <View
          style={
            styles.hillBack
          }
        />

        {/* =================================================
            FRONT HILL
        ================================================= */}

        <View
          style={
            styles.hillFront
          }
        />

        {/* =================================================
            TREES
        ================================================= */}

        <View
          style={[
            styles.tree,
            styles.tree1,
          ]}>
          <View
            style={
              styles.treeTop
            }
          />
          <View
            style={
              styles.treeTrunk
            }
          />
        </View>

        <View
          style={[
            styles.tree,
            styles.tree2,
          ]}>
          <View
            style={
              styles.treeTopSmall
            }
          />
          <View
            style={
              styles.treeTrunk
            }
          />
        </View>

        <View
          style={[
            styles.tree,
            styles.tree3,
          ]}>
          <View
            style={
              styles.treeTop
            }
          />
          <View
            style={
              styles.treeTrunk
            }
          />
        </View>

        <View
          style={[
            styles.tree,
            styles.tree4,
          ]}>
          <View
            style={
              styles.treeTopSmall
            }
          />
          <View
            style={
              styles.treeTrunk
            }
          />
        </View>

      </View>
    </View>
  );
};

export default SplashScreen;

/* ======================================================
   STYLES
====================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor:
      BACKGROUND,

    overflow: 'hidden',
  },

  topShape: {
    position: 'absolute',

    top: -height * 0.14,

    right: -width * 0.35,

    width: width * 1.15,

    height: height * 0.34,

    borderRadius: width,

    backgroundColor:
      'rgba(255,255,255,0.035)',
  },

  content: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingBottom: 0,

    zIndex: 10,
  },

  logoWrapper: {
    width: '100%',

    height: height * 0.44,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 15,
  },

  brandRow: {
    flexDirection: 'column',

    alignItems: 'center',
  },

  stayText: {
    fontSize: 38,

    lineHeight: 46,

    fontWeight: '800',

    color: '#FFFFFF',

    letterSpacing: 0,
  },

  serenoText: {
    fontSize: 38,

    lineHeight: 46,

    fontWeight: '800',

    color: '#9BE7CB',

    letterSpacing: 0,
  },

  divider: {
    width: '64%',

    height: 1,

    borderRadius: 10,

    backgroundColor: 'rgba(255,255,255,0.45)',

    marginTop: 22,

    marginBottom: 25,
  },

  staffText: {
    fontSize: 15,

    fontWeight: '500',

    letterSpacing: 0.5,

    color: '#FFFFFF',
  },

  productBrand: {
    fontWeight: '800',
  },

  accentWrapper: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 27,

    marginBottom: 18,
  },

  accentLine: {
    width: 24,

    height: 1,

    backgroundColor:
      '#C9DED5',
  },

  accentDot: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: PRIMARY,

    marginHorizontal: 8,
  },

  bottomArea: {
    position: 'absolute',

    bottom: 0,

    left: 0,

    right: 0,

    height: height * 0.15,

    overflow: 'hidden',
  },

  skyline: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 90,

    height: 150,

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent:
      'space-around',

    display: 'none',
  },

  building: {
    backgroundColor:
      '#C8DDD4',

    justifyContent: 'center',

    alignItems: 'center',
  },

  building1: {
    height: 130,

    width: 46,
  },

  building2: {
    height: 90,

    width: 58,
  },

  building3: {
    height: 120,

    width: 40,
  },

  building4: {
    height: 75,

    width: 60,
  },

  building5: {
    height: 105,

    width: 45,
  },

  windowsColumn: {
    alignItems: 'center',

    gap: 7,
  },

  windowGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    width: 38,

    gap: 5,
  },

  window: {
    width: 8,

    height: 12,

    backgroundColor:
      '#EDF7F2',

    borderRadius: 1,
  },

  hillBack: {
    position: 'absolute',

    bottom: 30,

    left: -80,

    width: width + 160,

    height: 115,

    borderRadius: width,

    backgroundColor:
      '#0B9464',

    transform: [
      {
        rotate: '-5deg',
      },
    ],
  },

  hillFront: {
    position: 'absolute',

    bottom: -65,

    left: -90,

    width: width + 180,

    height: 155,

    borderRadius: width,

    backgroundColor:
      '#087C56',

    transform: [
      {
        rotate: '3deg',
      },
    ],
  },

  tree: {
    position: 'absolute',

    bottom: 73,

    display: 'none',

    alignItems: 'center',
  },

  tree1: {
    left: width * 0.12,
  },

  tree2: {
    left: width * 0.29,

    bottom: 68,
  },

  tree3: {
    right: width * 0.25,

    bottom: 65,
  },

  tree4: {
    right: width * 0.1,

    bottom: 76,
  },

  treeTop: {
    width: 32,

    height: 40,

    borderRadius: 20,

    backgroundColor:
      '#07865D',
  },

  treeTopSmall: {
    width: 25,

    height: 32,

    borderRadius: 18,

    backgroundColor:
      '#07865D',
  },

  treeTrunk: {
    width: 5,

    height: 18,

    backgroundColor:
      '#176B50',

    marginTop: -3,
  },

  loadingContainer: {
    position: 'absolute',

    bottom: 22,

    left: 0,

    right: 0,

    alignItems: 'center',

    display: 'none',
  },

  loader: {
    width: 38,

    height: 38,

    borderRadius: 19,

    borderWidth: 4,

    borderColor:
      'rgba(255,255,255,0.35)',

    borderTopColor:
      '#FFFFFF',

    marginBottom: 8,
  },

  loadingText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '500',

    letterSpacing: 0.3,
  },
});