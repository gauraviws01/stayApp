import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import LogoShape from '../assets/logo-shape.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window');

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F9FCFA';

const SplashScreen = ({navigation}) => {
  const fadeAnim = useRef(
    new Animated.Value(0),
  ).current;

  const scaleAnim = useRef(
    new Animated.Value(0.85),
  ).current;

  const loadingAnim = useRef(
    new Animated.Value(0),
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


    const loadingLoop = Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loadingLoop.start();


    checkLogin();


    return () => {
      loadingLoop.stop();
      contentAnimation.stop();
    };
  }, [
    navigation,
    fadeAnim,
    scaleAnim,
    loadingAnim,
  ]);


  const checkLogin = async () => {
    try {
      console.log(
        '================================',
      );

      console.log(
        'SPLASH: CHECKING LOGIN...',
      );


      let token =
        await AsyncStorage.getItem(
          'authToken',
        );

      console.log(
        'AUTH TOKEN:',
        token
          ? 'FOUND'
          : 'NOT FOUND',
      );


      if (!token) {
        token =
          await AsyncStorage.getItem(
            'token',
          );

        console.log(
          'TOKEN:',
          token
            ? 'FOUND'
            : 'NOT FOUND',
        );
      }

      if (!token) {
        token =
          await AsyncStorage.getItem(
            'access_token',
          );

        console.log(
          'ACCESS TOKEN:',
          token
            ? 'FOUND'
            : 'NOT FOUND',
        );
      }

      if (!token) {
        token =
          await AsyncStorage.getItem(
            'userToken',
          );

        console.log(
          'USER TOKEN:',
          token
            ? 'FOUND'
            : 'NOT FOUND',
        );
      }

      const storedUser =
        await AsyncStorage.getItem(
          'user',
        );

      console.log(
        'STORED USER:',
        storedUser
          ? 'FOUND'
          : 'NOT FOUND',
      );

      console.log(
        '================================',
      );

      if (token) {
        console.log(
          'SPLASH: USER ALREADY LOGGED IN',
        );


        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainApp',
            },
          ],
        });

        return;
      }

      console.log(
        'SPLASH: USER NOT LOGGED IN',
      );

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
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
          },
        ],
      });
    }
  };

  const rotate =
    loadingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        '0deg',
        '360deg',
      ],
    });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
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
          <LogoShape
  width={125}
  height={125}
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
            Stay
          </Text>

          <Text
            style={
              styles.serenoText
            }>
            Sereno
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
          MAINTENANCE APP
        </Text>

        {/* =================================================
            ACCENT
        ================================================= */}

        <View
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
        </View>
      </Animated.View>

      {/* =================================================
          BOTTOM ILLUSTRATION
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

        {/* =================================================
            LOADING
        ================================================= */}

        <View
          style={
            styles.loadingContainer
          }>

          <Animated.View
            style={[
              styles.loader,
              {
                transform: [
                  {
                    rotate,
                  },
                ],
              },
            ]}
          />

          <Text
            style={
              styles.loadingText
            }>
            Loading...
          </Text>
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
      '#F1F8F4',
  },

  content: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingBottom:
      height * 0.16,

    zIndex: 10,
  },

  logoWrapper: {
    width: 135,

    height: 125,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 5,
  },

  brandRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  stayText: {
    fontSize: 46,

    lineHeight: 55,

    fontWeight: '700',

    color: DARK,

    letterSpacing: -2,
  },

  serenoText: {
    fontSize: 46,

    lineHeight: 55,

    fontWeight: '800',

    color: PRIMARY,

    letterSpacing: -2,
  },

  divider: {
    width: 70,

    height: 3,

    borderRadius: 10,

    backgroundColor: PRIMARY,

    marginTop: 18,

    marginBottom: 15,
  },

  staffText: {
    fontSize: 14,

    fontWeight: '600',

    letterSpacing: 3,

    color: DARK,
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

    height: height * 0.31,

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

    opacity: 0.35,
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