import React, {useCallback, useRef, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  Alert,
  StatusBar,
  useColorScheme,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BookingDetail from '../screens/BookingDetail';
import UpdateWorkProgress from '../screens/UpdateWorkProgress';
import WorkProgressDetail from '../screens/WorkProgressDetail';
import DashboardDetail from '../screens/DashboardDetail';
import CalendarScreen from '../screens/CalendarScreen';
import DailyCleaningScreen from '../screens/DailyCleaningScreen';
import InventoryDetailScreen from '../screens/InventoryDetailScreen';
import RoomLogScreen from '../screens/RoomLogScreen';
import {PropertyProvider} from '../components/PropertyContext';


const Stack = createNativeStackNavigator();

const {width} = Dimensions.get('window');


const PRIMARY = '#17B978';


// ==================================================
// CUSTOM DRAWER CONTEXT
// ==================================================

const DrawerContext = React.createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
});


// ==================================================
// DASHBOARD HOME WRAPPER
// ==================================================

const DashboardHomeScreen = () => {
  const insets = useSafeAreaInsets();

  const {
    openDrawer,
  } = React.useContext(DrawerContext);

  const navigation = useNavigation();

  return (
    <View style={styles.dashboardHomeContainer}>

      <View
        style={[
          styles.dashboardHeaderBar,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
          },
        ]}>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dashboardDrawerButton}
          onPress={openDrawer}>

          <Text style={styles.dashboardDrawerIcon}>
            ☰
          </Text>

        </TouchableOpacity>

        <Text style={styles.dashboardHeaderTitle}>Dashboard</Text>

      </View>

      <DashboardScreen
        navigation={navigation}
      />

    </View>
  );
};

const DailyCleaningHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const {openDrawer} = React.useContext(DrawerContext);
  const navigation = useNavigation();

  return (
    <View style={styles.dashboardHomeContainer}>
      <View
        style={[
          styles.dashboardHeaderBar,
          {paddingTop: Math.max(insets.top, 12) + 8},
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dashboardDrawerButton}
          onPress={openDrawer}>
          <Text style={styles.dashboardDrawerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.dashboardHeaderTitle}>Daily Cleaning</Text>
      </View>

      <DailyCleaningScreen
        navigation={navigation}
        openDrawer={openDrawer}
      />
    </View>
  );
};

const CalendarHomeScreen = () => {
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();

  return (
    <View style={styles.dashboardHomeContainer}>

      <View
        style={[
          styles.dashboardHeaderBar,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
          },
        ]}>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dashboardDrawerButton}
          onPress={() => navigation.navigate('MainApp')}>

          <Text style={styles.dashboardDrawerIcon}>
            ‹
          </Text>

        </TouchableOpacity>

      </View>

      <CalendarScreen
        navigation={navigation}
      />

    </View>
  );
};


// ==================================================
// DRAWER CONTENT
// ==================================================

const DrawerContent = ({
  closeDrawer,
}) => {

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const quickAccessItems = [
    {
      icon: '📶',
      iconColor: '#38BFA5',
      bg: '#EAF7F3',
      title: 'WiFi',
      subtitle: 'Access points & passwords',
      route: 'WifiDetail',
    },
    {
      icon: '👥',
      iconColor: '#B77CE8',
      bg: '#F5EEFF',
      title: 'Caretaker',
      subtitle: 'People on property',
      route: 'CaretakerDetail',
    },
    {
      icon: '✦',
      iconColor: '#E7A450',
      bg: '#FFF3E7',
      title: 'Daily Cleaning',
      subtitle: "Today's housekeeping plan",
      route: 'MainApp',
      targetScreen: 'DailyCleaningScreen',
    },
    {
      icon: '◫',
      iconColor: '#E36A5E',
      bg: '#FFEDEC',
      title: 'Maintenance',
      subtitle: 'Open issues & requests',
      route: 'MainApp',
      targetScreen: 'CalendarScreen',
    },
    {
      icon: '◎',
      iconColor: '#1EA86D',
      bg: '#EAF9F0',
      title: 'Inventory',
      subtitle: 'Supplies & stock levels',
      route: 'InventoryDetail',
    },
  ];


  const goToDashboard = () => {
    closeDrawer();
    navigation.navigate('MainApp', {
      screen: 'DashboardScreen',
    });
  };

  const handleQuickAccess = item => {
    closeDrawer();

    if (item?.route) {
      if (item.route === 'MainApp') {
        navigation.navigate('MainApp', {
          screen: item.targetScreen || 'DashboardScreen',
        });
        return;
      }

      navigation.navigate(item.route);
      return;
    }

    goToDashboard();
  };


  const handleLogout = () => {

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',

      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Logout',
          style: 'destructive',

          onPress: async () => {

            try {

              await AsyncStorage.multiRemove([
                'user',
                'userData',
                'userId',
                'properties',
                'token',
                'access_token',
                'authToken',
                'userToken',
              ]);

            } catch (error) {

              console.log(
                'Logout storage error:',
                error,
              );

            }


            closeDrawer();

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'Login',
                },
              ],
            });

          },
        },
      ],
    );
  };


  return (
    <View
      style={[
        styles.drawerContent,
        {paddingTop: Math.max(insets.top + 12, 28)},
      ]}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderLabel}>YOUR ACCOUNT</Text>

        <View style={styles.drawerHeaderActions}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconActionButton} onPress={closeDrawer}>
            <Text style={styles.iconActionText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.drawerTitle}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>KG</Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Kushal Garg</Text>
          <Text style={styles.profileRole}>Property manager</Text>
          <Text style={styles.profileLink}>View profile</Text>
        </View>
      </View>

      <Text style={styles.quickAccessTitle}>QUICK ACCESS</Text>

      <View style={styles.drawerMenu}>
        {quickAccessItems.map(item => (
          <TouchableOpacity
            key={item.title}
            activeOpacity={0.8}
            style={styles.drawerItem}
            onPress={() => handleQuickAccess(item)}>
            <View style={[styles.drawerItemIconBox, {backgroundColor: item.bg}]}>
              <Text style={[styles.drawerItemIcon, {color: item.iconColor}]}>{item.icon}</Text>
            </View>

            <View style={styles.drawerItemTextWrap}>
              <Text style={styles.drawerItemLabel}>{item.title}</Text>
              <Text style={styles.drawerItemSubtitle}>{item.subtitle}</Text>
            </View>

            <Text style={styles.drawerArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity activeOpacity={0.8} style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


// ==================================================

// ==================================================

const MainApp = ({route}) => {

  const selectedScreen =
    route?.params?.screen === 'CalendarScreen'
      ? 'calendar'
      : route?.params?.screen === 'DailyCleaningScreen'
        ? 'cleaning'
        : 'dashboard';

  const [drawerVisible, setDrawerVisible] = useState(false);

  const drawerAnimation = useRef(
    new Animated.Value(-width),
  ).current;


  const openDrawer = useCallback(() => {
    setDrawerVisible(true);

    Animated.timing(
      drawerAnimation,
      {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      },
    ).start();
  }, [drawerAnimation]);

  const closeDrawer = useCallback(() => {
    Animated.timing(
      drawerAnimation,
      {
        toValue: -width,
        duration: 220,
        useNativeDriver: true,
      },
    ).start(() => {
      setDrawerVisible(false);
    });
  }, [drawerAnimation]);

  return (
    <DrawerContext.Provider
      value={{
        openDrawer,
        closeDrawer,
      }}>

      <View style={styles.mainContainer}>

        {selectedScreen === 'calendar' ? (
          <CalendarHomeScreen />
        ) : selectedScreen === 'cleaning' ? (
          <DailyCleaningHomeScreen />
        ) : (
          <DashboardHomeScreen />
        )}


        {/* CUSTOM DRAWER */}

        {drawerVisible && (

          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none">

            {/* OVERLAY */}

            <Pressable
              style={styles.drawerOverlay}
              onPress={closeDrawer}
            />


            {/* DRAWER */}

            <Animated.View
              style={[
                styles.customDrawer,
                {
                  transform: [
                    {
                      translateX: drawerAnimation,
                    },
                  ],
                },
              ]}>

              <DrawerContent
                closeDrawer={closeDrawer}
              />

            </Animated.View>

          </View>

        )}

      </View>

    </DrawerContext.Provider>
  );
};


// ==================================================
// APP NAVIGATOR
// ==================================================

const AppNavigator = () => {

  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar
        animated={true}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#FFFFFF'}
        translucent={false}
      />

      <PropertyProvider>

      <NavigationContainer>

        <Stack.Navigator

        initialRouteName="Splash"

        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>


        {/* SPLASH */}

        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />


        {/* LOGIN */}

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />


        {/* MAIN APP */}

        <Stack.Screen
          name="MainApp"
          component={MainApp}
        />


        {/* BOOKING DETAIL */}

        <Stack.Screen
          name="BookingDetail"
          component={BookingDetail}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="DashboardDetail"
          component={DashboardDetail}
        />

        <Stack.Screen
          name="CalendarScreen"
          component={CalendarHomeScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="WifiDetail"
          component={require('../screens/WifiDetailScreen').default}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="CaretakerDetail"
          component={require('../screens/CaretakerDetailScreen').default}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="InventoryDetail"
          component={InventoryDetailScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AddRoom"
          component={RoomLogScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="EditRoom"
          component={RoomLogScreen}
          options={{headerShown: false}}
        />

        {/* UPDATE WORK PROGRESS */}

        <Stack.Screen
          name="UpdateWorkProgress"
          component={UpdateWorkProgress}
          options={{
            headerShown: false,
          }}
        />


        {/* WORK PROGRESS DETAIL */}

        <Stack.Screen
          name="WorkProgressDetail"
          component={WorkProgressDetail}
          options={{
            headerShown: false,
          }}
        />

        </Stack.Navigator>

      </NavigationContainer>

      </PropertyProvider>
    </>
  );
};


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  mainContainer: {
    flex: 1,
  },


  // ================================================
  // CUSTOM DRAWER
  // ================================================

  customDrawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.9,
    backgroundColor: '#F3F7F4',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 5,
      height: 0,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },


  drawerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },


  drawerContent: {
    flex: 1,
    backgroundColor: '#F3F7F4',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 26,
  },


  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  drawerHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#5B7B71',
    textTransform: 'uppercase',
  },

  drawerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DDEEE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  iconActionText: {
    fontSize: 18,
    color: '#1B2D29',
    fontWeight: '700',
  },

  drawerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2C2A',
    marginTop: 6,
    marginBottom: 16,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4F1',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E8E0',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 18,
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1DBA78',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2E2A',
  },

  profileRole: {
    fontSize: 13,
    color: '#6A7F79',
    marginTop: 2,
  },

  profileLink: {
    fontSize: 12,
    color: '#1B8F68',
    fontWeight: '700',
    marginTop: 6,
  },

  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#5B7B71',
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  drawerMenu: {
    flex: 1,
    paddingTop: 4,
  },

  drawerItem: {
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  drawerItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  drawerItemIcon: {
    fontSize: 18,
    fontWeight: '700',
  },

  drawerItemTextWrap: {
    flex: 1,
    marginLeft: 12,
  },

  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2E2A',
    marginBottom: 2,
  },

  drawerItemSubtitle: {
    fontSize: 11,
    color: '#758B82',
  },

  drawerArrow: {
    fontSize: 28,
    color: '#7A8B84',
    marginLeft: 8,
  },

  logoutButton: {
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3C5C5',
    backgroundColor: '#FFF1F1',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutIcon: {
    fontSize: 18,
    color: '#D94D4D',
    marginRight: 10,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D94D4D',
  },


  // ================================================
  // MENU SCREEN
  // ================================================

  dashboardHomeContainer: {
    flex: 1,
    // backgroundColor: BACKGROUND,
  },


  dashboardHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    // paddingTop: 12,
    // paddingBottom: 12,
    // backgroundColor: '#FFFFFF',
    // borderBottomWidth: 1,
    // borderBottomColor: '#EAEAEA',
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.05,
    // shadowRadius: 6,
    // elevation: 2,
  },


  dashboardHeaderTitle: {
    flex: 1,
    marginLeft: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2C2A',
  },


  dashboardDrawerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F9F2',
    alignItems: 'center',
    justifyContent: 'center',
  },


  dashboardDrawerIcon: {
    fontSize: 20,
    color: PRIMARY,
  },


  dashboardHeaderBadge: {
    backgroundColor: '#F3F7F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 'auto',
  },


  dashboardHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.4,
  },


  // ================================================
  // BOTTOM TAB
  // ================================================

  tabIcon: {
    fontSize: 20,
  },

});


export default AppNavigator;