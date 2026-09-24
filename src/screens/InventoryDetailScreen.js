import React, { 
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Path} from 'react-native-svg';

import PropertyDropdown from '../components/PropertyDropdown';
import PageHeader from '../components/PageHeader';

import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';

const INVENTORY_API =
  'http://staysereno.in/api/staff/inventory';


const propertyOptions = [
  'Sereno Greens - Cosy 1 BHK with Pvt Balcony',
  'Sereno Ikigai - 4BHK Villa with Pool',
  'Sereno Bloom - Penthouse Suite',
];

const INVENTORY_STORAGE_KEY =
  'inventoryDetails';


const getDateKey = date => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const CalendarIcon = () => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="#287954"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


const formatDisplayDate = value => {
  const date = new Date(value);

  return date.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );
};

/* =========================================================
   CALENDAR DAYS
========================================================= */

const getCalendarDays = monthDate => {
  const year =
    monthDate.getFullYear();

  const month =
    monthDate.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1,
    );

  const lastDay =
    new Date(
      year,
      month + 1,
      0,
    );

  const startWeekday =
    firstDay.getDay();

  const totalDays =
    lastDay.getDate();

  const cells = [];

  for (
    let i = 0;
    i < startWeekday;
    i += 1
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= totalDays;
    day += 1
  ) {
    cells.push(
      new Date(
        year,
        month,
        day,
      ),
    );
  }

  while (
    cells.length % 7 !== 0
  ) {
    cells.push(null);
  }

  return cells;
};

/* =========================================================
   GET USER ID
========================================================= */

const getLoggedInUserId = async () => {
  try {
    const userData =
      await AsyncStorage.getItem(
        'userData',
      );

    const user =
      await AsyncStorage.getItem(
        'user',
      );

    let parsedUserData = null;
    let parsedUser = null;

    try {
      parsedUserData = userData
        ? JSON.parse(userData)
        : null;
    } catch (error) {
      console.log(
        'USER DATA PARSE ERROR:',
        error,
      );
    }

    try {
      parsedUser = user
        ? JSON.parse(user)
        : null;
    } catch (error) {
      console.log(
        'USER PARSE ERROR:',
        error,
      );
    }

    const storedUserId =
      (parsedUserData &&
        (
          parsedUserData.id ||
          parsedUserData.user_id ||
          parsedUserData.userId
        )) ||
      (parsedUser &&
        (
          parsedUser.id ||
          parsedUser.user_id ||
          parsedUser.userId
        )) ||
      (await AsyncStorage.getItem(
        'userId',
      ));

    console.log(
      'INVENTORY STORED USER ID:',
      storedUserId,
    );

    return Number(
      storedUserId,
    );
  } catch (error) {
    console.log(
      'GET LOGGED IN USER ID ERROR:',
      error,
    );

    return 0;
  }
};

/* =========================================================
   GET TOKEN
========================================================= */

const getToken = async () => {
  try {
    const token =
      (await AsyncStorage.getItem(
        'authToken',
      )) ||
      (await AsyncStorage.getItem(
        'token',
      )) ||
      (await AsyncStorage.getItem(
        'access_token',
      )) ||
      (await AsyncStorage.getItem(
        'userToken',
      ));

    console.log(
      'INVENTORY TOKEN EXISTS:',
      !!token,
    );

    return token;
  } catch (error) {
    console.log(
      'GET TOKEN ERROR:',
      error,
    );

    return null;
  }
};

/* =========================================================
   SCREEN
========================================================= */

const InventoryDetailScreen = ({
  navigation,
}) => {
  const insets =
    useSafeAreaInsets();

  const today = new Date();

  /* =======================================================
     PROPERTY
  ======================================================= */

  const [
    selectedProperty,
    setSelectedProperty,
  ] = useState(
    propertyOptions[0],
  );

  /* =======================================================
     DATE
  ======================================================= */

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    new Date(),
  );

  const [
    calendarVisible,
    setCalendarVisible,
  ] = useState(false);

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ),
  );

  /* =======================================================
     RICH EDITOR
  ======================================================= */

  const richText =
    useRef(null);

  const [
    inventoryHtml,
    setInventoryHtml,
  ] = useState('');

  const [
    loadingInventory,
    setLoadingInventory,
  ] = useState(true);

  const [
    savingInventory,
    setSavingInventory,
  ] = useState(false);

  /*
   * Existing inventory ID
   *
   * Agar current date ka record GET se milta hai
   * to iska ID yahan save hoga.
   *
   * Example:
   * inventory_id = 15
   *
   * Phir save par:
   * PUT /inventory/15
   */
  const [
    inventoryId,
    setInventoryId,
  ] = useState(null);

  /* =======================================================
     CALENDAR
  ======================================================= */

  const monthDays =
    useMemo(
      () =>
        getCalendarDays(
          calendarMonth,
        ),
      [calendarMonth],
    );

  const monthLabel =
    calendarMonth.toLocaleDateString(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      },
    );

  /* =======================================================
     DATE STATUS
  ======================================================= */

  const todayKey =
    getDateKey(today);

  const selectedDateKey =
    getDateKey(
      selectedDate,
    );

  const isPastDate =
    selectedDateKey <
    todayKey;

  const isToday =
    selectedDateKey ===
    todayKey;

  const isFutureDate =
    selectedDateKey >
    todayKey;

  /*
   * IMPORTANT:
   *
   * Past date:
   * - View only
   * - No editing
   * - No Save
   *
   * Today:
   * - Editable
   * - Existing record => PUT
   * - No record => POST
   *
   * Future:
   * - Not selectable
   */

  const editorDisabled =
    isPastDate ||
    isFutureDate ||
    loadingInventory ||
    savingInventory;

  /* =======================================================
     CLEAR EDITOR
  ======================================================= */

  const clearEditor = () => {
    setInventoryHtml('');

    setInventoryId(null);

    try {
      richText.current?.setContentHTML(
        '',
      );
    } catch (error) {
      console.log(
        'CLEAR EDITOR ERROR:',
        error,
      );
    }
  };

  /* =======================================================
     FIND INVENTORY ID
  ======================================================= */

  const getInventoryId = item => {
    if (!item) {
      return null;
    }

    return (
      item?.id ??
      item?.inventory_id ??
      item?.inventoryId ??
      item?.inventory?.id ??
      null
    );
  };

  /* =======================================================
     FETCH INVENTORY
  ======================================================= */

  const fetchInventory = async () => {
    try {
      setLoadingInventory(
        true,
      );

      /*
       * Date/property change hote hi
       * previous data clear.
       */
      clearEditor();

      const userId =
        await getLoggedInUserId();

      if (!userId) {
        Alert.alert(
          'Inventory',
          'User ID not found. Please login again.',
        );

        return;
      }

      const token =
        await getToken();

      const url =
        `${INVENTORY_API}/${userId}`;

      console.log(
        '====================================',
      );

      console.log(
        'GET INVENTORY URL:',
        url,
      );

      console.log(
        'CURRENT DATE:',
        selectedDateKey,
      );

      console.log(
        'SELECTED PROPERTY:',
        selectedProperty,
      );

      console.log(
        '====================================',
      );

      const response =
        await fetch(
          url,
          {
            method: 'GET',

            headers: {
              Accept:
                'application/json',

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },
          },
        );

      const rawText =
        await response.text();

      console.log(
        'GET INVENTORY STATUS:',
        response.status,
      );

      console.log(
        'GET INVENTORY RESPONSE:',
        rawText,
      );

      let json = {};

      try {
        json =
          rawText
            ? JSON.parse(
                rawText,
              )
            : {};
      } catch (error) {
        console.log(
          'JSON PARSE ERROR:',
          error,
        );
      }

      /* =====================================================
         401
      ===================================================== */

      if (
        response.status ===
          401 ||
        json?.message ===
          'Unauthenticated.'
      ) {
        Alert.alert(
          'Session expired',
          'Please login again.',
        );

        return;
      }

      /* =====================================================
         OTHER ERROR
      ===================================================== */

      if (!response.ok) {
        Alert.alert(
          'Inventory',
          json?.message ||
            'Unable to fetch inventory.',
        );

        return;
      }

      /* =====================================================
         NORMALIZE RESPONSE
      ===================================================== */

      let inventoryList = [];

      if (
        Array.isArray(json)
      ) {
        inventoryList =
          json;
      } else if (
        Array.isArray(
          json?.data,
        )
      ) {
        inventoryList =
          json.data;
      } else if (
        Array.isArray(
          json?.inventories,
        )
      ) {
        inventoryList =
          json.inventories;
      } else if (
        Array.isArray(
          json?.inventory,
        )
      ) {
        inventoryList =
          json.inventory;
      } else if (
        json?.data &&
        typeof json.data ===
          'object'
      ) {
        inventoryList = [
          json.data,
        ];
      } else if (
        json &&
        typeof json ===
          'object'
      ) {
        /*
         * Agar API directly ek inventory object return kare
         */
        if (
          json?.id ||
          json?.inventory_id ||
          json?.comment ||
          json?.inventory_details
        ) {
          inventoryList = [
            json,
          ];
        }
      }

      console.log(
        'INVENTORY LIST:',
        JSON.stringify(
          inventoryList,
          null,
          2,
        ),
      );

      /* =====================================================
         FIND SELECTED DATE
      ===================================================== */

      const currentInventory =
        inventoryList.find(
          item => {
            if (!item) {
              return false;
            }

            const itemDate =
              item?.date ??
              item?.inventory_date ??
              item?.inventoryDate ??
              item?.date_from ??
              item?.created_date ??
              item?.created_at;

            if (!itemDate) {
              return false;
            }

            const itemDateKey =
              String(
                itemDate,
              ).substring(
                0,
                10,
              );

            console.log(
              'CHECK INVENTORY:',
              itemDateKey,
              'CURRENT:',
              selectedDateKey,
              'ID:',
              getInventoryId(
                item,
              ),
            );

            return (
              itemDateKey ===
              selectedDateKey
            );
          },
        );

      console.log(
        'CURRENT INVENTORY:',
        JSON.stringify(
          currentInventory,
          null,
          2,
        ),
      );

      /* =====================================================
         RECORD FOUND
      ===================================================== */

      if (
        currentInventory
      ) {
        const currentId =
          getInventoryId(
            currentInventory,
          );

        const comment =
          currentInventory?.comment ??
          currentInventory?.inventory_details ??
          currentInventory?.inventory_detail ??
          currentInventory?.description ??
          currentInventory?.details ??
          currentInventory?.content ??
          '';

        console.log(
          'CURRENT INVENTORY ID:',
          currentId,
        );

        console.log(
          'CURRENT INVENTORY COMMENT:',
          comment,
        );

        /*
         * Existing inventory ID save karo
         */
        setInventoryId(
          currentId,
        );

        /*
         * Editor content
         */
        setInventoryHtml(
          comment || '',
        );

        /*
         * RichEditor async update
         */
        setTimeout(() => {
          try {
            richText.current?.setContentHTML(
              comment || '',
            );
          } catch (error) {
            console.log(
              'SET EDITOR CONTENT ERROR:',
              error,
            );
          }
        }, 150);
      } else {
        /*
         * Current selected date ka
         * record nahi mila.
         *
         * Today hai => new record
         * create hoga POST se.
         */
        setInventoryId(
          null,
        );

        setInventoryHtml(
          '',
        );

        setTimeout(() => {
          try {
            richText.current?.setContentHTML(
              '',
            );
          } catch (error) {
            console.log(
              'CLEAR EDITOR ERROR:',
              error,
            );
          }
        }, 100);

        console.log(
          'CURRENT DATE INVENTORY NOT FOUND',
        );
      }
    } catch (error) {
      console.log(
        'GET INVENTORY ERROR:',
        error,
      );

      setInventoryId(
        null,
      );

      setInventoryHtml(
        '',
      );

      try {
        richText.current?.setContentHTML(
          '',
        );
      } catch (editorError) {
        console.log(
          'EDITOR CLEAR ERROR:',
          editorError,
        );
      }

      Alert.alert(
        'Inventory',
        error?.message ||
          'Unable to connect to server.',
      );
    } finally {
      setLoadingInventory(
        false,
      );
    }
  };

  /* =======================================================
     FETCH ON DATE / PROPERTY CHANGE
  ======================================================= */

  useEffect(() => {
    fetchInventory();
  }, [
    selectedProperty,
    selectedDateKey,
  ]);

  /* =======================================================
     DATE SELECT
  ======================================================= */

  const handleSelectDate =
    date => {
      const dateKey =
        getDateKey(date);

      /*
       * Future date allowed nahi
       */
      if (
        dateKey >
        todayKey
      ) {
        return;
      }

      setSelectedDate(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ),
      );

      setCalendarVisible(
        false,
      );
    };

  /* =======================================================
     CHANGE MONTH
  ======================================================= */

  const changeMonth =
    step => {
      const nextMonth =
        new Date(
          calendarMonth.getFullYear(),
          calendarMonth.getMonth() +
            step,
          1,
        );

      /*
       * Future month allowed nahi
       */
      if (
        nextMonth.getFullYear() >
          today.getFullYear() ||
        (
          nextMonth.getFullYear() ===
            today.getFullYear() &&
          nextMonth.getMonth() >
            today.getMonth()
        )
      ) {
        return;
      }

      setCalendarMonth(
        nextMonth,
      );
    };

  /* =======================================================
     SAVE INVENTORY
  ======================================================= */

  const handleSaveInventory =
    async () => {
      /*
       * Past date:
       * No save
       */
      if (
        isPastDate
      ) {
        return;
      }

      /*
       * Future date:
       * No save
       */
      if (
        isFutureDate
      ) {
        return;
      }

      /*
       * GET loading:
       * No save
       */
      if (
        loadingInventory
      ) {
        return;
      }

      /*
       * Already saving:
       * No duplicate request
       */
      if (
        savingInventory
      ) {
        return;
      }

      try {
        setSavingInventory(
          true,
        );

        const userId =
          await getLoggedInUserId();

        if (!userId) {
          Alert.alert(
            'Inventory',
            'User ID not found. Please login again.',
          );

          return;
        }

        /*
         * Current unit ID
         *
         * Abhi testing ke liye 20.
         */
        const unitId = 20;

        if (!unitId) {
          Alert.alert(
            'Inventory',
            'Unit ID not found for selected property.',
          );

          return;
        }

        /*
         * Editor ka latest HTML
         */
        const comment =
          inventoryHtml || '';

        /*
         * Token
         */
        const token =
          await getToken();

        /* =================================================
           EXISTING RECORD
           => PUT
        ================================================= */

        if (
          inventoryId
        ) {
          const putUrl =
            `${INVENTORY_API}/${inventoryId}`;

          const requestBody =
            {
              user_id:
                userId,

              unit_id:
                Number(unitId),

              comment:
                comment,
            };

          console.log(
            '====================================',
          );

          console.log(
            'INVENTORY UPDATE',
          );

          console.log(
            'PUT URL:',
            putUrl,
          );

          console.log(
            'PUT BODY:',
            JSON.stringify(
              requestBody,
              null,
              2,
            ),
          );

          console.log(
            '====================================',
          );

          const response =
            await fetch(
              putUrl,
              {
                method: 'PUT',

                headers: {
                  Accept:
                    'application/json',

                  'Content-Type':
                    'application/json',

                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                },

                body:
                  JSON.stringify(
                    requestBody,
                  ),
              },
            );

          const rawText =
            await response.text();

          console.log(
            'INVENTORY PUT STATUS:',
            response.status,
          );

          console.log(
            'INVENTORY PUT RESPONSE:',
            rawText,
          );

          let json = {};

          try {
            json =
              rawText
                ? JSON.parse(
                    rawText,
                  )
                : {};
          } catch (error) {
            console.log(
              'PUT JSON PARSE ERROR:',
              error,
            );
          }

          /*
           * 401
           */
          if (
            response.status ===
              401 ||
            json?.message ===
              'Unauthenticated.'
          ) {
            Alert.alert(
              'Session expired',
              'Please login again.',
            );

            return;
          }

          /*
           * Error
           */
          if (
            !response.ok
          ) {
            Alert.alert(
              'Inventory',
              json?.message ||
                'Unable to update inventory.',
            );

            return;
          }

          /*
           * Local storage update
           */
          try {
            const storedInventory =
              await AsyncStorage.getItem(
                INVENTORY_STORAGE_KEY,
              );

            const inventory =
              storedInventory
                ? JSON.parse(
                    storedInventory,
                  )
                : {};

            const key =
              `${selectedProperty}::${selectedDateKey}`;

            inventory[key] =
              comment;

            await AsyncStorage.setItem(
              INVENTORY_STORAGE_KEY,
              JSON.stringify(
                inventory,
              ),
            );
          } catch (
            storageError
          ) {
            console.log(
              'LOCAL STORAGE UPDATE ERROR:',
              storageError,
            );
          }

          richText.current?.blurContentEditor?.();

          Alert.alert(
            'Updated',
            json?.message ||
              'Inventory details have been updated successfully.',
          );

          console.log(
            'INVENTORY UPDATED SUCCESSFULLY',
          );

          return;
        }

        /* =================================================
           NEW RECORD
           => POST
        ================================================= */

        const postBody =
          {
            user_id:
              userId,

            unit_id:
              Number(unitId),

            comment:
              comment,
          };

        console.log(
          '====================================',
        );

        console.log(
          'NEW INVENTORY',
        );

        console.log(
          'POST URL:',
          INVENTORY_API,
        );

        console.log(
          'POST BODY:',
          JSON.stringify(
            postBody,
            null,
            2,
          ),
        );

        console.log(
          '====================================',
        );

        const response =
          await fetch(
            INVENTORY_API,
            {
              method: 'POST',

              headers: {
                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },

              body:
                JSON.stringify(
                  postBody,
                ),
            },
          );

        const rawText =
          await response.text();

        console.log(
          'INVENTORY POST STATUS:',
          response.status,
        );

        console.log(
          'INVENTORY POST RESPONSE:',
          rawText,
        );

        let json = {};

        try {
          json =
            rawText
              ? JSON.parse(
                  rawText,
                )
              : {};
        } catch (error) {
          console.log(
            'POST JSON PARSE ERROR:',
            error,
          );
        }

        /*
         * 401
         */
        if (
          response.status ===
            401 ||
          json?.message ===
            'Unauthenticated.'
        ) {
          Alert.alert(
            'Session expired',
            'Please login again.',
          );

          return;
        }

        /*
         * API ERROR
         */
        if (
          !response.ok
        ) {
          Alert.alert(
            'Inventory',
            json?.message ||
              'Unable to save inventory details.',
          );

          return;
        }

        /*
         * POST response se
         * inventory ID mil jaye to store karo
         */
        const newInventoryId =
          json?.id ??
          json?.inventory_id ??
          json?.inventoryId ??
          json?.data?.id ??
          json?.data?.inventory_id ??
          json?.inventory?.id ??
          null;

        if (
          newInventoryId
        ) {
          setInventoryId(
            newInventoryId,
          );

          console.log(
            'NEW INVENTORY ID:',
            newInventoryId,
          );
        }

        /*
         * Local storage
         */
        try {
          const storedInventory =
            await AsyncStorage.getItem(
              INVENTORY_STORAGE_KEY,
            );

          const inventory =
            storedInventory
              ? JSON.parse(
                  storedInventory,
                )
              : {};

          const key =
            `${selectedProperty}::${selectedDateKey}`;

          inventory[key] =
            comment;

          await AsyncStorage.setItem(
            INVENTORY_STORAGE_KEY,
            JSON.stringify(
              inventory,
            ),
          );
        } catch (
          storageError
        ) {
          console.log(
            'LOCAL STORAGE SAVE ERROR:',
            storageError,
          );
        }

        richText.current?.blurContentEditor?.();

        Alert.alert(
          'Saved',
          json?.message ||
            'Inventory details have been saved successfully.',
        );

        console.log(
          'INVENTORY CREATED SUCCESSFULLY',
        );
      } catch (error) {
        console.log(
          'INVENTORY SAVE/UPDATE ERROR:',
          error,
        );

        Alert.alert(
          'Inventory',
          error?.message ||
            'Unable to connect to server.',
        );
      } finally {
        setSavingInventory(
          false,
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F3F7F4"
        translucent={false}
      />

      <KeyboardAvoidingView
        style={
          styles.container
        }
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : undefined
        }>

        {/* =================================================
            HEADER
        ================================================= */}

        <PageHeader
          navigation={
            navigation
          }
          title="Inventory"
        />

        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                insets.bottom +
                30,
            },
          ]}>

          {/* =================================================
              PROPERTY
          ================================================= */}

          <View
            style={
              styles.propertySelectorWrap
            }>
            <PropertyDropdown
              selectedValue={
                selectedProperty
              }
              selectedLabel={
                selectedProperty
              }
              fallbackProperties={
                propertyOptions
              }
              onChange={property =>
                setSelectedProperty(
                  property,
                )
              }
            />
          </View>

          {/* =================================================
              DATE
          ================================================= */}

          <Text
            style={
              styles.dateLabel
            }>
            DATE
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={
              styles.dateInput
            }
            onPress={() =>
              setCalendarVisible(
                true,
              )}>
            <Text
              style={
                styles.dateInputText
              }>
              {formatDisplayDate(
                selectedDate,
              )}
            </Text>

            <CalendarIcon />
          </TouchableOpacity>

          {/* =================================================
              DETAIL SECTION
          ================================================= */}

          <View
            style={
              styles.detailSection
            }>
            <View
              style={
                styles.sectionHeader
              }>
              <View
                style={
                  styles.sectionIconWrap
                }>
                <Text
                  style={
                    styles.sectionIcon
                  }>
                  📝
                </Text>
              </View>

              <View
                style={
                  styles.sectionHeaderText
                }>
                <Text
                  style={
                    styles.sectionTitle
                  }>
                  Inventory details
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }>
                  {isPastDate
                    ? 'Previous date — view only'
                    : isToday
                    ? 'Add notes and inventory information'
                    : 'Add notes and inventory information'}
                </Text>
              </View>
            </View>

            {/* =================================================
                EDITOR
            ================================================= */}

            <View
              style={
                styles.richEditorWrapper
              }>

              <RichToolbar
                editor={
                  richText
                }
                actions={[
                  actions.undo,
                  actions.redo,
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.alignLeft,
                  actions.alignCenter,
                  actions.alignRight,
                ]}
                iconTint="#355C50"
                selectedIconTint="#17B978"
                disabledIconTint="#AAB8B3"
                disabled={
                  editorDisabled
                }
                style={
                  styles.richToolbar
                }
                flatContainerStyle={
                  styles.richToolbarContainer
                }
              />

              <View
                style={
                  styles.editorContainer
                }>
                <RichEditor
                  ref={
                    richText
                  }
                  initialContentHTML=""
                  disabled={
                    editorDisabled
                  }
                  onChange={html => {
                    /*
                     * Past date disabled hai,
                     * phir bhi safety ke liye
                     * state update nahi karenge.
                     */
                    if (
                      !isPastDate &&
                      !isFutureDate &&
                      !loadingInventory
                    ) {
                      setInventoryHtml(
                        html,
                      );
                    }
                  }}
                  placeholder="Write inventory details here..."
                  useContainer={
                    true
                  }
                  initialHeight={
                    190
                  }
                  style={
                    styles.richEditor
                  }
                  editorStyle={{
                    backgroundColor:
                      '#FFFFFF',

                    color:
                      '#1F2D2A',

                    placeholderColor:
                      '#7F918B',

                    contentCSSText: `
                      font-size: 15px;
                      line-height: 24px;
                      padding: 8px;
                      font-family: Arial;
                    `,
                  }}
                />

                {/* =================================================
                    LOADING OVERLAY
                ================================================= */}

                {loadingInventory && (
                  <View
                    style={
                      styles.editorLoader
                    }>
                    <ActivityIndicator
                      size="small"
                      color="#17B978"
                    />

                    <Text
                      style={
                        styles.loadingText
                      }>
                      Loading inventory...
                    </Text>
                  </View>
                )}

                {/* =================================================
                    PAST DATE OVERLAY
                ================================================= */}

                {isPastDate &&
                  !loadingInventory && (
                    <View
                      pointerEvents="none"
                      style={
                        styles.readOnlyOverlay
                      }>
                      <View
                        style={
                          styles.readOnlyBadge
                        }>
                        <Text
                          style={
                            styles.readOnlyBadgeText
                          }>
                          View only
                        </Text>
                      </View>
                    </View>
                  )}
              </View>
            </View>

            {/* =================================================
                INFO
            ================================================= */}

            <View
              style={
                styles.formatInfo
              }>
              <View
                style={
                  styles.formatInfoIcon
                }>
                <Text
                  style={
                    styles.formatInfoIconText
                  }>
                  i
                </Text>
              </View>

              <Text
                style={
                  styles.formatInfoText
                }>
                {isPastDate
                  ? 'Previous date inventory can only be viewed.'
                  : 'Select any text and use the toolbar to format it.'}
              </Text>
            </View>
          </View>

          {/* =================================================
              SAVE BUTTON
          ================================================= */}

          {isToday &&
            !loadingInventory && (
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={
                  savingInventory
                }
                style={[
                  styles.submitButton,
                  savingInventory &&
                    styles.submitButtonDisabled,
                ]}
                onPress={
                  handleSaveInventory
                }>

                {savingInventory ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.submitButtonText
                      }>
                      Saving...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={
                      styles.submitButtonText
                    }>
                    {inventoryId
                      ? 'Update'
                      : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* =====================================================
          CALENDAR MODAL
      ===================================================== */}

      <Modal
        visible={
          calendarVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCalendarVisible(
            false,
          )
        }>

        <View
          style={
            styles.modalOverlay
          }>
          <View
            style={
              styles.calendarModal
            }>

            {/* MODAL HEADER */}

            <View
              style={
                styles.modalHeader
              }>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  changeMonth(
                    -1,
                  )
                }
                style={
                  styles.monthNav
                }>
                <Text
                  style={
                    styles.monthNavText
                  }>
                  {'‹'}
                </Text>
              </TouchableOpacity>

              <Text
                style={
                  styles.modalMonthLabel
                }>
                {monthLabel}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  changeMonth(
                    1,
                  )
                }
                style={
                  styles.monthNav
                }>
                <Text
                  style={
                    styles.monthNavText
                  }>
                  {'›'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* WEEK DAYS */}

            <View
              style={
                styles.weekRow
              }>
              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
              ].map(day => (
                <Text
                  key={day}
                  style={
                    styles.weekLabel
                  }>
                  {day}
                </Text>
              ))}
            </View>

            {/* CALENDAR */}

            <View
              style={
                styles.calendarGrid
              }>
              {monthDays.map(
                (
                  day,
                  index,
                ) => {
                  if (!day) {
                    return (
                      <View
                        key={
                          `empty-${index}`
                        }
                        style={
                          styles.dayCellEmpty
                        }
                      />
                    );
                  }

                  const dateKey =
                    getDateKey(
                      day,
                    );

                  const isSelected =
                    dateKey ===
                    selectedDateKey;

                  const isFuture =
                    dateKey >
                    todayKey;

                  const isCurrentMonth =
                    day.getMonth() ===
                    calendarMonth.getMonth();

                  return (
                    <TouchableOpacity
                      key={
                        day.toISOString()
                      }
                      activeOpacity={
                        0.8
                      }
                      disabled={
                        isFuture
                      }
                      onPress={() =>
                        handleSelectDate(
                          day,
                        )
                      }
                      style={[
                        styles.dayCell,

                        isFuture &&
                          styles.dayCellDisabled,

                        isSelected &&
                          styles.dayCellSelected,
                      ]}>

                      <Text
                        style={[
                          styles.dayText,

                          !isCurrentMonth &&
                            styles.dayTextMuted,

                          isFuture &&
                            styles.dayTextDisabled,

                          isSelected &&
                            styles.dayTextSelected,
                        ]}>
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>

            {/* DONE */}

            <TouchableOpacity
              activeOpacity={0.9}
              style={
                styles.doneButton
              }
              onPress={() =>
                setCalendarVisible(
                  false,
                )
              }>
              <Text
                style={
                  styles.doneButtonText
                }>
                Done
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#F3F7F4',
    },

    container: {
      flex: 1,
      backgroundColor:
        '#F3F7F4',
    },

    scrollContent: {
      paddingHorizontal: 18,
    },

    /* =====================================================
       PROPERTY
    ===================================================== */

    propertySelectorWrap: {
      marginBottom: 16,
      zIndex: 10,
    },

    /* =====================================================
       DATE
    ===================================================== */

    dateInput: {
      height: 54,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D9E5DE',
      borderRadius: 13,
      paddingHorizontal: 16,
      marginBottom: 20,
    },

    dateLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: '#849890',
      marginBottom: 8,
    },

    dateInputText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#173A30',
    },

    /* =====================================================
       DETAIL
    ===================================================== */

    detailSection: {
      backgroundColor:
        '#F4F9F5',
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#D8EAE2',
      padding: 16,
      marginBottom: 18,
    },

    sectionHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 14,
    },

    sectionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        '#EAF7F3',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    sectionIcon: {
      fontSize: 17,
    },

    sectionHeaderText: {
      flex: 1,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1F2D2A',
    },

    sectionSubtitle: {
      fontSize: 11,
      color: '#78918A',
      marginTop: 3,
    },

    /* =====================================================
       EDITOR
    ===================================================== */

    richEditorWrapper: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        '#D7E5DF',
      overflow: 'hidden',
    },

    richToolbar: {
      backgroundColor:
        '#EAF5F0',
      borderBottomWidth: 1,
      borderBottomColor:
        '#D7E5DF',
      minHeight: 48,
    },

    richToolbarContainer: {
      paddingHorizontal: 4,
    },

    editorContainer: {
      minHeight: 190,
      position: 'relative',
      backgroundColor:
        '#FFFFFF',
    },

    richEditor: {
      minHeight: 190,
      backgroundColor:
        '#FFFFFF',
    },

    editorLoader: {
      position:
        'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        'rgba(255,255,255,0.94)',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 8,
      fontSize: 12,
      color: '#5F7D72',
      fontWeight: '600',
    },

    readOnlyOverlay: {
      position:
        'absolute',
      top: 8,
      right: 8,
      alignItems:
        'flex-end',
    },

    readOnlyBadge: {
      backgroundColor:
        '#EEF3F1',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },

    readOnlyBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#668078',
    },

    /* =====================================================
       INFO
    ===================================================== */

    formatInfo: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 10,
      paddingHorizontal: 2,
    },

    formatInfoIcon: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor:
        '#DDF4EB',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 7,
    },

    formatInfoIconText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#16875F',
    },

    formatInfoText: {
      flex: 1,
      fontSize: 11,
      color: '#78918A',
    },

    /* =====================================================
       SAVE
    ===================================================== */

    submitButton: {
      backgroundColor:
        '#17B978',
      borderRadius: 14,
      paddingVertical: 16,
      alignItems:
        'center',
      justifyContent:
        'center',
      flexDirection:
        'row',
      gap: 8,
      marginTop: 4,

      elevation: 3,

      shadowColor:
        '#17B978',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity:
        0.18,

      shadowRadius: 6,
    },

    submitButtonDisabled: {
      backgroundColor:
        '#8FCDB5',
    },

    submitButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    /* =====================================================
       MODAL
    ===================================================== */

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(17, 24, 39, 0.32)',
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal: 18,
    },

    calendarModal: {
      width: '100%',
      maxWidth: 420,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 18,

      elevation: 10,

      shadowColor:
        '#000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.15,

      shadowRadius: 15,
    },

    modalHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 14,
    },

    monthNav: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        '#EAF7F3',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    monthNavText: {
      fontSize: 22,
      color: '#113B32',
      fontWeight: '700',
    },

    modalMonthLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1F2D2A',
    },

    weekRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      marginBottom: 10,
    },

    weekLabel: {
      flex: 1,
      textAlign:
        'center',
      fontSize: 11,
      color: '#6E8B84',
      fontWeight: '700',
    },

    calendarGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
    },

    dayCell: {
      width: '14.285%',
      height: 40,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 8,
      borderRadius: 10,
    },

    dayCellSelected: {
      backgroundColor:
        '#17B978',
    },

    dayCellDisabled: {
      opacity: 0.35,
    },

    dayCellEmpty: {
      width: '14.285%',
      height: 40,
    },

    dayText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1F2D2A',
    },

    dayTextMuted: {
      color: '#A0AAA7',
    },

    dayTextSelected: {
      color: '#FFFFFF',
    },

    dayTextDisabled: {
      color: '#A0AAA7',
    },

    doneButton: {
      marginTop: 14,
      backgroundColor:
        '#EAF7F3',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems:
        'center',
    },

    doneButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#114433',
    },
  });

export default InventoryDetailScreen;