import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import PropertyDropdown from '../components/PropertyDropdown';


const {width, height} = Dimensions.get('window');

const wp = value => (width * value) / 100;
const hp = value => (height * value) / 100;

/* =====================================================
   COLORS
===================================================== */

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F3F4F8';

const BOOKING_GREEN = '#17B978';
const BLOCKED_COLOR = '#222222';

const SELECTED_GREEN = '#17B978';
const BORDER = '#DDDDDD';



const BOOKING_API =
  'https://staysereno.in/api/staff/booking';



const DAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const CALENDAR_ROWS = 6;
const CELL_HEIGHT = hp(8.5);


const CalendarScreen = ({navigation}) => {


  const [userId, setUserId] = useState(null);

  const [authToken, setAuthToken] = useState(null);


  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);


  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);


  const [currentDate, setCurrentDate] = useState(
    new Date(),
  );


  const today = new Date();

  const todayDateKey =
    `${today.getFullYear()}-` +
    `${String(today.getMonth() + 1).padStart(2, '0')}-` +
    `${String(today.getDate()).padStart(2, '0')}`;

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const monthName = currentDate.toLocaleString(
    'en-US',
    {
      month: 'long',
    },
  );


  const monthFirstDate =
    `${year}-${String(month + 1).padStart(2, '0')}-01`;


  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      const storedUser =
        await AsyncStorage.getItem('user');

      const storedUserData =
        await AsyncStorage.getItem('userData');

      const storedUserId =
        await AsyncStorage.getItem('userId');

      const storedProperties =
        await AsyncStorage.getItem('properties');

 

      let token =
        await AsyncStorage.getItem('token');

      if (!token) {
        token =
          await AsyncStorage.getItem(
            'access_token',
          );
      }

      if (!token) {
        token =
          await AsyncStorage.getItem(
            'authToken',
          );
      }

      if (!token) {
        token =
          await AsyncStorage.getItem(
            'userToken',
          );
      }


      let user = null;

      if (storedUser) {
        try {
          user =
            JSON.parse(storedUser);
        } catch (error) {
          console.log(
            'USER PARSE ERROR:',
            error,
          );
        }
      }

      if (!user && storedUserData) {
        try {
          user =
            JSON.parse(storedUserData);
        } catch (error) {
          console.log(
            'USER DATA PARSE ERROR:',
            error,
          );
        }
      }

      /* =================================================
         USER ID
      ================================================= */

      const id =
        user?.id ??
        user?.user_id ??
        user?.userId ??
        storedUserId;

      if (
        id !== null &&
        id !== undefined
      ) {
        setUserId(String(id));
      }

      /* =================================================
         TOKEN SET
      ================================================= */

      if (token) {
        setAuthToken(token);
      }

      /* =================================================
         PROPERTIES
      ================================================= */

      let propertyList = [];

      if (storedProperties) {
        try {
          const parsed =
            JSON.parse(storedProperties);

          if (Array.isArray(parsed)) {
            propertyList = parsed;
          }
        } catch (error) {
          console.log(
            'PROPERTIES PARSE ERROR:',
            error,
          );
        }
      }

      /* =================================================
         NORMALIZE PROPERTIES
      ================================================= */

      const normalizedProperties =
        propertyList.map(item => ({
          ...item,

          unit_id:
            item?.unit_id ??
            item?.id ??
            item?.property_id,

          unit_name:
            item?.unit_name ??
            item?.final_unit_name ??
            item?.name ??
            item?.property_name ??
            '',
        }));

      setUnits(
        normalizedProperties,
      );

      /* =================================================
         DEFAULT UNIT
      ================================================= */

      if (
        normalizedProperties.length >
        0
      ) {
        setSelectedUnit(
          normalizedProperties[0],
        );
      }
    } catch (error) {
      console.log(
        'LOAD CALENDAR ERROR:',
        error,
      );
    }
  };

  /* ===================================================
     GET TOKEN
  =================================================== */

  const getAuthToken = async () => {
    if (authToken) {
      return authToken;
    }

    let token =
      await AsyncStorage.getItem(
        'token',
      );

    if (!token) {
      token =
        await AsyncStorage.getItem(
          'access_token',
        );
    }

    if (!token) {
      token =
        await AsyncStorage.getItem(
          'authToken',
        );
    }

    if (!token) {
      token =
        await AsyncStorage.getItem(
          'userToken',
        );
    }

    return token;
  };


  useEffect(() => {
    if (
      userId !== null &&
      userId !== undefined &&
      selectedUnit?.unit_id !== null &&
      selectedUnit?.unit_id !== undefined &&
      authToken
    ) {
      fetchBookings(
        userId,
        selectedUnit.unit_id,
      );
    }
  }, [
    userId,
    selectedUnit,
    month,
    year,
    authToken,
  ]);

  /* ===================================================
     FETCH BOOKINGS
  =================================================== */

  const fetchBookings = async (
    currentUserId,
    unitId,
  ) => {
    try {
      setLoading(true);

      setBookings([]);

      const token =
        await getAuthToken();

      if (!token) {
        throw new Error(
          'Authentication token not found. Please login again.',
        );
      }


      const selectedMonthFirstDate =
        `${year}-${String(month + 1).padStart(2, '0')}-01`;

      /* =================================================
         REQUEST BODY
      ================================================= */

      const requestBody = {
        user_id: String(
          currentUserId,
        ),

        unit_id: Number(
          unitId,
        ),

        month:
          selectedMonthFirstDate,
      };

      console.log(
        '====================================',
      );

      console.log(
        'BOOKING API:',
        BOOKING_API,
      );

      console.log(
        'BOOKING PAYLOAD:',
        requestBody,
      );

      console.log(
        'SELECTED MONTH:',
        selectedMonthFirstDate,
      );

      console.log(
        '====================================',
      );

      /* =================================================
         API REQUEST
      ================================================= */

      const response =
        await fetch(
          BOOKING_API,
          {
            method: 'POST',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                requestBody,
              ),
          },
        );

      /* =================================================
         RESPONSE TEXT
      ================================================= */

      const responseText =
        await response.text();

      let result = null;

      try {
        result =
          JSON.parse(
            responseText,
          );
      } catch (error) {
        console.log(
          'JSON PARSE ERROR:',
          error,
        );

        console.log(
          'RAW RESPONSE:',
          responseText,
        );

        throw new Error(
          'Invalid API response.',
        );
      }

      console.log(
        'BOOKING RESPONSE:',
        result,
      );

      /* =================================================
         AUTH ERROR
      ================================================= */

      if (
        response.status === 401
      ) {
        throw new Error(
          'Session expired. Please login again.',
        );
      }

      /* =================================================
         OTHER HTTP ERROR
      ================================================= */

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            'Unable to load booking data.',
        );
      }

      /* =================================================
         API STATUS
      ================================================= */

      if (
        result?.status === false
      ) {
        throw new Error(
          result?.message ||
            'Unable to load booking data.',
        );
      }

      /* =================================================
         NORMALIZE BOOKINGS
      ================================================= */

      const normalized =
        normalizeBookings(
          result,
        );

      console.log(
        'NORMALIZED BOOKINGS:',
        normalized,
      );

      /* =================================================
         SET BOOKINGS
      ================================================= */

      setBookings(
        normalized,
      );
    } catch (error) {
      console.log(
        'BOOKING FETCH ERROR:',
        error,
      );

      setBookings([]);

      if (
        error?.message !==
        'Authentication token not found. Please login again.'
      ) {
        Alert.alert(
          'Booking Error',
          error?.message ||
            'Unable to load booking data.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================
     NORMALIZE BOOKINGS
  =================================================== */

  const normalizeBookings =
    result => {
      const finalArray =
        Array.isArray(
          result?.data
            ?.final_array,
        )
          ? result.data.final_array
          : [];

      if (
        finalArray.length ===
        0
      ) {
        return [];
      }

      const allBookings = [];

      finalArray.forEach(
        (
          unit,
          unitIndex,
        ) => {
          const dates =
            Array.isArray(
              unit?.dates,
            )
              ? unit.dates
              : [];

          const grouped = {};

          dates.forEach(
            (
              item,
              dateIndex,
            ) => {
              if (!item?.date) {
                return;
              }

              /* =========================================
                 BOOKED
              ========================================= */

              const isBooked =
                item?.is_booked ===
                  true ||
                item?.is_booked ===
                  1 ||
                item?.is_booked ===
                  '1' ||
                item?.is_booked ===
                  'true';

              /* =========================================
                 BLOCKED
              ========================================= */

              const isBlocked =
                item?.is_blocked ===
                  true ||
                item?.is_blocked ===
                  1 ||
                item?.is_blocked ===
                  '1' ||
                item?.is_blocked ===
                  'true';

              /* =========================================
                 IGNORE EMPTY DATE
              ========================================= */

              if (
                !isBooked &&
                !isBlocked
              ) {
                return;
              }

              /* =========================================
                 START DATE
              ========================================= */

              const startDate =
                formatDate(
                  item?.date_from ||
                    item?.date,
                );

              /* =========================================
                 END DATE
              ========================================= */

              const endDate =
                formatDate(
                  item?.date_to ||
                    item?.date,
                );

              if (
                !startDate ||
                !endDate
              ) {
                return;
              }

              /* =========================================
                 BOOKING ID
              ========================================= */

              const bookingId =
                item?.bookingId ??
                item?.booking_id ??
                item?.id ??
                `${unitIndex}-${dateIndex}`;

              /* =========================================
                 CHANNEL
              ========================================= */

              const channel =
                item?.channel ||
                item?.source ||
                '';

              /* =========================================
                 CUSTOMER
              ========================================= */

              const customerName =
                item?.customer_name ||
                item?.guest_name ||
                item?.name ||
                '';

              /* =========================================
                 PROPERTY
              ========================================= */

              const propertyName =
                item?.unit_name ||
                item?.final_unit_name ||
                '';

              /* =========================================
                 CHECK-IN TIME
                 
                 BLOCKED DATE:
                 No time
                 
                 BOOKED DATE:
                 Show check-in time
              ========================================= */

              const checkinTime =
                !isBlocked &&
                isBooked
                  ? (
                      item?.checkin_time ||
                      item?.checkInTime ||
                      item?.check_in_time ||
                      item?.checkinTime ||
                      ''
                    )
                  : '';

    

              const checkoutTime =
                !isBlocked &&
                isBooked
                  ? (
                      item?.checkout_time ||
                      item?.checkOutTime ||
                      item?.check_out_time ||
                      item?.checkoutTime ||
                      ''
                    )
                  : '';

              /* =========================================
                 COLOR
              ========================================= */

              let color =
                BOOKING_GREEN;

              if (isBlocked) {
                color =
                  BLOCKED_COLOR;
              }

              if (isBooked) {
                color =
                  BOOKING_GREEN;
              }

              /* =========================================
                 GROUP KEY
              ========================================= */

              const key =
                `${
                  isBlocked
                    ? 'blocked'
                    : 'booking'
                }-${bookingId}-${startDate}-${endDate}`;

              /* =========================================
                 CREATE GROUP
              ========================================= */

              if (!grouped[key]) {
                grouped[key] = {
                  id: key,

                  startDate,

                  endDate,

                  color,

                  customerName,

                  channel,

                  bookingId,

                  isBooked,

                  isBlocked,

                  propertyName,

                  /* ==============================
                     TIME
                  ============================== */

                  checkin_time:
                    checkinTime,

                  checkout_time:
                    checkoutTime,

                  checkInTime:
                    checkinTime,

                  checkOutTime:
                    checkoutTime,

                  /* ==============================
                     ORIGINAL API DATA
                  ============================== */

                  originalData:
                    item,
                };
              } else {
                /* =================================
                   PRESERVE TIME
                ================================= */

                if (
                  !grouped[key]
                    .checkin_time &&
                  checkinTime
                ) {
                  grouped[key]
                    .checkin_time =
                    checkinTime;

                  grouped[key]
                    .checkInTime =
                    checkinTime;
                }

                if (
                  !grouped[key]
                    .checkout_time &&
                  checkoutTime
                ) {
                  grouped[key]
                    .checkout_time =
                    checkoutTime;

                  grouped[key]
                    .checkOutTime =
                    checkoutTime;
                }
              }
            },
          );

          /* =========================================
             ADD GROUPED BOOKINGS
          ========================================= */

          Object.values(
            grouped,
          ).forEach(
            booking => {
              allBookings.push(
                booking,
              );
            },
          );
        },
      );

      /* =========================================
         SORT
      ========================================= */

      allBookings.sort(
        (a, b) =>
          a.startDate.localeCompare(
            b.startDate,
          ),
      );

      return allBookings;
    };

  /* ===================================================
     DATE FORMAT
  =================================================== */

  const formatDate = value => {
    if (!value) {
      return '';
    }

    const stringValue =
      String(value).trim();

    /* =================================================
       YYYY-MM-DD
    ================================================= */

    const match =
      stringValue.match(
        /^(\d{4})-(\d{2})-(\d{2})/,
      );

    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    /* =================================================
       DD-MM-YYYY
    ================================================= */

    const indianMatch =
      stringValue.match(
        /^(\d{2})-(\d{2})-(\d{4})/,
      );

    if (indianMatch) {
      return `${indianMatch[3]}-${indianMatch[2]}-${indianMatch[1]}`;
    }

    /* =================================================
       JS DATE
    ================================================= */

    const date =
      new Date(value);

    if (
      isNaN(
        date.getTime(),
      )
    ) {
      return '';
    }

    return (
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}-` +
      `${String(
        date.getDate(),
      ).padStart(2, '0')}`
    );
  };

  /* ===================================================
     CALENDAR DAYS
  =================================================== */

  const calendarDays =
    useMemo(() => {
      const firstDay =
        new Date(
          year,
          month,
          1,
        ).getDay();

      const daysInMonth =
        new Date(
          year,
          month + 1,
          0,
        ).getDate();

      const previousMonthDays =
        new Date(
          year,
          month,
          0,
        ).getDate();

      const days = [];

      for (
        let index = 0;
        index < 42;
        index++
      ) {
        const dayNumber =
          index -
          firstDay +
          1;

        let day;

        let currentMonth =
          true;

        let cellDate;

        /* =========================================
           PREVIOUS MONTH
        ========================================= */

        if (
          dayNumber < 1
        ) {
          day =
            previousMonthDays +
            dayNumber;

          currentMonth =
            false;

          cellDate =
            new Date(
              year,
              month - 1,
              day,
            );
        }

        /* =========================================
           NEXT MONTH
        ========================================= */

        else if (
          dayNumber >
          daysInMonth
        ) {
          day =
            dayNumber -
            daysInMonth;

          currentMonth =
            false;

          cellDate =
            new Date(
              year,
              month + 1,
              day,
            );
        }

        /* =========================================
           CURRENT MONTH
        ========================================= */

        else {
          day =
            dayNumber;

          cellDate =
            new Date(
              year,
              month,
              day,
            );
        }

        const dateKey =
          `${cellDate.getFullYear()}-` +
          `${String(
            cellDate.getMonth() + 1,
          ).padStart(2, '0')}-` +
          `${String(
            cellDate.getDate(),
          ).padStart(2, '0')}`;

        days.push({
          day,
          dateKey,
          currentMonth,
        });
      }

      return days;
    }, [
      month,
      year,
    ]);

  /* ===================================================
     SELECTED / TODAY DATE
  =================================================== */

  const isSelectedDate =
    item => {
      return (
        item.dateKey ===
        todayDateKey
      );
    };

  /* ===================================================
     MONTH NAVIGATION
  =================================================== */

  const previousMonth =
    () => {
    
      setCurrentDate(
        new Date(
          year,
          month - 1,
          1,
        ),
      );
    };

  const nextMonth =
    () => {
     
      setCurrentDate(
        new Date(
          year,
          month + 1,
          1,
        ),
      );
    };


  const getBookingSegments =
    (
      booking,
      rowIndex,
    ) => {
      const rowStart =
        rowIndex * 7;

      const rowDays =
        calendarDays.slice(
          rowStart,
          rowStart + 7,
        );

      if (
        rowDays.length ===
        0
      ) {
        return [];
      }

      const segments = [];

      rowDays.forEach(
        (
          day,
          index,
        ) => {
          const date =
            day.dateKey;

          if (
            date <
              booking.startDate ||
            date >
              booking.endDate
          ) {
            return;
          }

          const isStart =
            date ===
            booking.startDate;

          const isEnd =
            date ===
            booking.endDate;

          segments.push({
            date,
            index,
            isStart,
            isEnd,
          });
        },
      );

      return segments;
    };

  /* ===================================================
     OPEN BOOKING DETAIL
  =================================================== */

  const openBooking = (
    booking,
    selectedDate,
  ) => {
    console.log(
      'OPEN BOOKING:',
      booking,
    );

    navigation.navigate(
      'BookingDetail',
      {
        booking: {
          ...booking,

          selectedDate,

          /* ==============================
             EXPLICIT TIME
          ============================== */

          checkin_time:
            booking?.checkin_time ||
            '',

          checkout_time:
            booking?.checkout_time ||
            '',

          checkInTime:
            booking?.checkInTime ||
            booking?.checkin_time ||
            '',

          checkOutTime:
            booking?.checkOutTime ||
            booking?.checkout_time ||
            '',
        },

        property:
          selectedUnit,
      },
    );
  };

  /* ===================================================
     UNIT CHANGE
  =================================================== */

  const handleUnitChange =
    unit => {
      if (
        selectedUnit?.unit_id ===
        unit?.unit_id
      ) {
        return;
      }


      setBookings([]);

   

      setSelectedUnit(unit);
    };

  /* ===================================================
     UNIT NAME
  =================================================== */

  const getUnitName =
    unit => {
      return (
        unit?.final_unit_name ||
        unit?.unit_name ||
        unit?.unitName ||
        unit?.property_name ||
        unit?.propertyName ||
        unit?.name ||
        `Unit ${
          unit?.unit_id || ''
        }`
      );
    };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <View
      style={
        styles.safeArea
      }>

      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          BACKGROUND
        }
        translucent={false}
      />

      <View
        style={
          styles.container
        }>

        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled">

          {/* =================================================
              TOP ACTION
          ================================================= */}

          <View
            style={
              styles.topActionRow
            }>

            <PropertyDropdown
              selectedValue={selectedUnit?.unit_id}
              selectedLabel={
                selectedUnit
                  ? getUnitName(selectedUnit)
                  : undefined
              }
              fallbackProperties={units}
              onChange={(name, unit) => handleUnitChange(unit)}
            />

          </View>

          {/* =================================================
              CALENDAR
          ================================================= */}

          <View
            style={
              styles.calendarCard
            }>

            {/* =================================================
                MONTH HEADER
            ================================================= */}

            <View
              style={
                styles.monthHeader
              }>

              <TouchableOpacity
                activeOpacity={0.7}
                style={
                  styles.arrowButton
                }
                onPress={
                  previousMonth
                }>

                <Text
                  style={
                    styles.arrow
                  }>
                  ‹
                </Text>
              </TouchableOpacity>

              <View
                style={
                  styles.monthTitleContainer
                }>

                <Text
                  style={
                    styles.monthTitle
                  }>
                  {monthName}
                </Text>

                <Text
                  style={
                    styles.monthYear
                  }>
                  {year}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={
                  styles.arrowButton
                }
                onPress={
                  nextMonth
                }>

                <Text
                  style={
                    styles.arrow
                  }>
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* =================================================
                WEEK
            ================================================= */}

            <View
              style={
                styles.weekRow
              }>

              {DAYS.map(day => (
                <View
                  key={day}
                  style={
                    styles.weekCell
                  }>

                  <Text
                    style={
                      styles.weekText
                    }>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* =================================================
                CALENDAR BODY
            ================================================= */}

            <View
              style={
                styles.calendarBody
              }>

              {/* =================================================
                  DATE GRID
              ================================================= */}

              <View
                style={
                  styles.calendarGrid
                }>

                {calendarDays.map(
                  (
                    item,
                    index,
                  ) => {
                    const selected =
                      isSelectedDate(
                        item,
                      );

                    return (
                      <View
                        key={`${item.dateKey}-${index}`}
                        style={
                          styles.dayCell
                        }>

                        <View
                          style={[
                            styles.dateCircle,

                            selected &&
                              styles.selectedCircle,
                          ]}>

                          <Text
                            style={[
                              styles.dateText,

                              !item.currentMonth &&
                                styles.otherMonth,

                              selected &&
                                styles.selectedDate,
                            ]}>
                            {String(
                              item.day,
                            ).padStart(
                              2,
                              '0',
                            )}
                          </Text>
                        </View>
                      </View>
                    );
                  },
                )}
              </View>

              {/* =================================================
                  BOOKING OVERLAY
              ================================================= */}

              <View
                pointerEvents="box-none"
                style={
                  styles.bookingOverlay
                }>

                {bookings.map(
                  booking => (
                    <React.Fragment
                      key={String(
                        booking.id,
                      )}>

                      {Array.from({
                        length:
                          CALENDAR_ROWS,
                      }).map(
                        (
                          _,
                          rowIndex,
                        ) => {

                          const segments =
                            getBookingSegments(
                              booking,
                              rowIndex,
                            );

                          if (
                            !segments.length
                          ) {
                            return null;
                          }

                          return segments.map(
                            segment => {

                              const cellWidth =
                                100 / 7;

                              let left =
                                segment.index *
                                cellWidth;

                              let segmentWidth =
                                cellWidth;

                              /* =================================
                                 CHECK-IN
                              ================================= */

                              if (
                                segment.isStart &&
                                !segment.isEnd
                              ) {
                                left +=
                                  cellWidth /
                                  2;

                                segmentWidth =
                                  cellWidth /
                                  2;
                              }

                              /* =================================
                                 CHECKOUT
                              ================================= */

                              if (
                                segment.isEnd &&
                                !segment.isStart
                              ) {
                                segmentWidth =
                                  cellWidth /
                                  2;
                              }

                              /* =================================
                                 SAME DAY
                              ================================= */

                              if (
                                segment.isStart &&
                                segment.isEnd
                              ) {
                                left +=
                                  cellWidth /
                                  4;

                                segmentWidth =
                                  cellWidth /
                                  2;
                              }

                              return (
                                <TouchableOpacity
                                  key={`${booking.id}-${rowIndex}-${segment.date}`}
                                  activeOpacity={
                                    0.75
                                  }
                                  onPress={() =>
                                    openBooking(
                                      booking,
                                      segment.date,
                                    )
                                  }
                                  style={[
                                    styles.bookingPill,

                                    {
                                      top:
                                        rowIndex *
                                          CELL_HEIGHT +
                                        hp(6.3),

                                      left: `${left}%`,

                                      width: `${segmentWidth}%`,

                                      backgroundColor:
                                        booking.color ||
                                        BOOKING_GREEN,
                                    },

                                    segment.isStart &&
                                      !segment.isEnd &&
                                      styles.roundLeft,

                                    segment.isEnd &&
                                      !segment.isStart &&
                                      styles.roundRight,

                                    segment.isStart &&
                                      segment.isEnd &&
                                      styles.sameDayPill,
                                  ]}
                                />
                              );
                            },
                          );
                        },
                      )}
                    </React.Fragment>
                  ),
                )}
              </View>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading && (
                <View
                  style={
                    styles.loadingOverlay
                  }>

                  <View
                    style={
                      styles.loadingBox
                    }>

                    <ActivityIndicator
                      size="large"
                      color={
                        PRIMARY
                      }
                    />

                    <Text
                      style={
                        styles.loadingText
                      }>
                      Loading calendar...
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={
                        styles.loadingUnit
                      }>
                      {selectedUnit
                        ? getUnitName(
                            selectedUnit,
                          )
                        : ''}
                    </Text>

                    <Text
                      style={
                        styles.loadingMonth
                      }>
                      {monthFirstDate}
                    </Text>
                  </View>
                </View>
              )}

              {/* =================================================
                  NO DATA
              ================================================= */}

              {!loading &&
                selectedUnit &&
                bookings.length ===
                  0 && (
                  <View
                    pointerEvents="none"
                    style={
                      styles.noDataOverlay
                    }>

                    <View
                      style={
                        styles.noDataBox
                      }>

                      <Text
                        style={
                          styles.noDataTitle
                        }>
                        No booking data
                      </Text>

                      <Text
                        style={
                          styles.noDataText
                        }>
                        No bookings or blocked
                        dates for this unit.
                      </Text>
                    </View>
                  </View>
                )}
            </View>
          </View>

          {/* =================================================
              LEGEND
          ================================================= */}

          <View
            style={
              styles.legend
            }>

            <View
              style={
                styles.legendItem
              }>

              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      BOOKING_GREEN,
                  },
                ]}
              />

              <Text
                style={
                  styles.legendText
                }>
                Booked
              </Text>
            </View>

            <View
              style={
                styles.legendItem
              }>

              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      BLOCKED_COLOR,
                  },
                ]}
              />

              <Text
                style={
                  styles.legendText
                }>
                Blocked
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default CalendarScreen;

/* ======================================================
   STYLES
====================================================== */

const styles =
  StyleSheet.create({

    /* ==================================================
       SAFE AREA
    ================================================== */

    safeArea: {
      flex: 1,

      backgroundColor:
        BACKGROUND,

    //   paddingTop:
    //     Platform.OS === 'android'
    //       ? (StatusBar.currentHeight || 0) +
    //         hp(0.8)
    //       : hp(4.5),
    },

    container: {
      flex: 1,

      backgroundColor:
        BACKGROUND,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingTop:
        hp(1),

      paddingBottom:
        hp(4),
    },

    /* ==================================================
       TOP ACTION
    ================================================== */

    topActionRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginHorizontal:
        wp(4),

      zIndex: 1000,

      elevation: 30,
    },

    /* ==================================================
       DROPDOWN
    ================================================== */

    dropdownWrapper: {
      flex: 1,

      zIndex: 1000,

      elevation: 30,
    },

    dropdownButton: {
      minHeight:
        hp(7),

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#D9E2DE',

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingLeft:
        wp(4),

      paddingRight:
        wp(2.5),

      borderRadius:
        wp(3.5),
    },

    dropdownTextContainer: {
      flex: 1,

      paddingVertical:
        hp(0.8),
    },

    dropdownSmallLabel: {
      fontSize:
        wp(2.3),

      fontWeight:
        '800',

      letterSpacing:
        1,

      color:
        '#8A9892',

      marginBottom:
        hp(0.3),
    },

    dropdownText: {
      flex: 1,

      color:
        DARK,

      fontSize:
        wp(3.8),

      fontWeight:
        '700',
    },

    dropdownArrowBox: {
      width:
        wp(9.5),

      height:
        wp(9.5),

      maxWidth: 38,

      maxHeight: 38,

      borderRadius:
        wp(2.5),

      backgroundColor:
        '#F0F7F4',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginLeft:
        wp(2),
    },

    dropdownArrow: {
      fontSize:
        wp(5.5),

      lineHeight:
        wp(5.5),

      color:
        PRIMARY,

      fontWeight:
        '700',
    },

    dropdownMenu: {
      position:
        'absolute',

      top:
        hp(7.3),

      left: 0,

      right: 0,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#D9E2DE',

      borderRadius:
        wp(3.5),

      overflow:
        'hidden',

      elevation: 30,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.15,

      shadowRadius:
        12,

      shadowOffset: {
        width: 0,
        height: 6,
      },

      zIndex: 9999,
    },

    menuTitle: {
      fontSize:
        wp(2.7),

      fontWeight:
        '800',

      color:
        '#8A9892',

      textTransform:
        'uppercase',

      letterSpacing:
        0.8,

      paddingHorizontal:
        wp(4),

      paddingTop:
        hp(1.8),

      paddingBottom:
        hp(1.1),
    },

    dropdownScroll: {
      maxHeight:
        hp(32),
    },

    dropdownItem: {
      minHeight:
        hp(8),

      paddingHorizontal:
        wp(3.5),

      justifyContent:
        'center',

      borderTopWidth: 1,

      borderTopColor:
        '#F0F2F1',
    },

    activeItem: {
      backgroundColor:
        '#F1FBF7',
    },

    itemContent: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    itemDot: {
      width:
        wp(2.3),

      height:
        wp(2.3),

      maxWidth: 9,

      maxHeight: 9,

      borderRadius:
        wp(1.2),

      backgroundColor:
        '#D3DCD8',

      marginRight:
        wp(3),
    },

    activeItemDot: {
      backgroundColor:
        PRIMARY,
    },

    itemTextContainer: {
      flex: 1,
    },

    dropdownItemText: {
      fontSize:
        wp(3.7),

      color:
        '#333333',

      fontWeight:
        '600',

      lineHeight:
        hp(2.4),
    },

    activeItemText: {
      color:
        PRIMARY,

      fontWeight:
        '800',
    },

    unitIdText: {
      marginTop:
        hp(0.2),

      fontSize:
        wp(2.5),

      color:
        '#9AA59F',
    },

    checkMark: {
      fontSize:
        wp(5),

      fontWeight:
        '800',

      color:
        PRIMARY,

      marginLeft:
        wp(2),
    },

    emptyItem: {
      minHeight:
        hp(7),

      justifyContent:
        'center',

      paddingHorizontal:
        wp(4),
    },

    emptyText: {
      color:
        '#888888',

      fontSize:
        wp(3.5),
    },

    /* ==================================================
       LOGOUT
    ================================================== */

    logoutButton: {
      minHeight:
        hp(7),

      marginLeft:
        wp(2),

      paddingHorizontal:
        wp(4),

      backgroundColor:
        DARK,

      borderRadius:
        wp(3.5),

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    logoutText: {
      color:
        '#FFFFFF',

      fontSize:
        wp(3.4),

      fontWeight:
        '700',
    },

    /* ==================================================
       CALENDAR CARD
    ================================================== */

    calendarCard: {
      marginHorizontal:
        wp(4),

      marginTop:
        hp(2),

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#D5D5D5',

      overflow:
        'hidden',

      borderRadius:
        wp(3.5),
    },

    /* ==================================================
       MONTH HEADER
    ================================================== */

    monthHeader: {
      minHeight:
        hp(9),

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        wp(3),

      borderBottomWidth: 1,

      borderBottomColor:
        BORDER,
    },

    monthTitleContainer: {
      alignItems:
        'center',
    },

    monthTitle: {
      fontSize:
        wp(5),

      fontWeight:
        '800',

      color:
        DARK,
    },

    monthYear: {
      marginTop:
        hp(0.1),

      fontSize:
        wp(3),

      fontWeight:
        '600',

      color:
        '#89958F',
    },

    arrowButton: {
      width:
        wp(11),

      height:
        hp(6),

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    arrow: {
      fontSize:
        wp(9),

      lineHeight:
        wp(9),

      color:
        DARK,

      fontWeight:
        '300',
    },

    /* ==================================================
       WEEK
    ================================================== */

    weekRow: {
      flexDirection:
        'row',

      height:
        hp(6.5),

      minHeight:
        hp(5),

      borderBottomWidth: 1,

      borderBottomColor:
        BORDER,
    },

    weekCell: {
      width:
        '14.2857%',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    weekText: {
      fontSize:
        wp(3.4),

      color:
        '#66736D',

      fontWeight:
        '700',
    },

    /* ==================================================
       BODY
    ================================================== */

    calendarBody: {
      position:
        'relative',
    },

    calendarGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',
    },

    /* ==================================================
       DAY CELL
    ================================================== */

    dayCell: {
      width:
        '14.2857%',

      height:
        CELL_HEIGHT,

      alignItems:
        'center',

      paddingTop:
        hp(1.6),

      borderRightWidth: 1,

      borderBottomWidth: 1,

      borderColor:
        BORDER,

      position:
        'relative',

      backgroundColor:
        '#FFFFFF',
    },

    /* ==================================================
       DATE
    ================================================== */

    dateCircle: {
      width:
        wp(8.5),

      height:
        wp(8.5),

      minWidth:
        wp(7.5),

      minHeight:
        wp(7.5),

      maxWidth:
        wp(10),

      maxHeight:
        wp(10),

      borderRadius:
        wp(5),

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    dateText: {
      fontSize:
        wp(3.7),

      color:
        DARK,

      fontWeight:
        '500',
    },

    otherMonth: {
      color:
        '#B8B8B8',
    },

    selectedCircle: {
      backgroundColor:
        SELECTED_GREEN,
    },

    selectedDate: {
      color:
        '#FFFFFF',

      fontWeight:
        '800',
    },

    /* ==================================================
       BOOKING OVERLAY
    ================================================== */

    bookingOverlay: {
      position:
        'absolute',

      top: 0,

      left: 0,

      right: 0,

      bottom: 0,

      zIndex: 20,

      pointerEvents:
        'box-none',
    },

    /* ==================================================
       BOOKING PILL
    ================================================== */

    bookingPill: {
      position:
        'absolute',

      height:
        hp(1.25),

      minHeight:
        hp(1),

      maxHeight:
        hp(1.5),

      zIndex: 20,
    },

    roundLeft: {
      borderTopLeftRadius:
        wp(1.5),

      borderBottomLeftRadius:
        wp(1.5),
    },

    roundRight: {
      borderTopRightRadius:
        wp(1.5),

      borderBottomRightRadius:
        wp(1.5),
    },

    sameDayPill: {
      borderRadius:
        wp(1.5),
    },

    /* ==================================================
       LOADING
    ================================================== */

    loadingOverlay: {
      position:
        'absolute',

      top: 0,

      left: 0,

      right: 0,

      bottom: 0,

      backgroundColor:
        'rgba(255,255,255,0.78)',

      alignItems:
        'center',

      justifyContent:
        'center',

      zIndex: 50,
    },

    loadingBox: {
      minWidth:
        wp(48),

      maxWidth:
        wp(70),

      paddingVertical:
        hp(2.5),

      paddingHorizontal:
        wp(5),

      backgroundColor:
        '#FFFFFF',

      borderRadius:
        wp(4),

      alignItems:
        'center',

      justifyContent:
        'center',

      elevation: 7,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.12,

      shadowRadius:
        12,

      shadowOffset: {
        width: 0,
        height: 5,
      },
    },

    loadingText: {
      marginTop:
        hp(1.2),

      fontSize:
        wp(3.3),

      fontWeight:
        '700',

      color:
        DARK,
    },

    loadingUnit: {
      maxWidth:
        wp(45),

      marginTop:
        hp(0.5),

      fontSize:
        wp(2.6),

      color:
        '#8A9690',
    },

    loadingMonth: {
      marginTop:
        hp(0.5),

      fontSize:
        wp(2.5),

      fontWeight:
        '600',

      color:
        PRIMARY,
    },

    /* ==================================================
       NO DATA
    ================================================== */

    noDataOverlay: {
      position:
        'absolute',

      top: 0,

      left: 0,

      right: 0,

      bottom: 0,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    noDataBox: {
      alignItems:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.94)',

      paddingHorizontal:
        wp(5),

      paddingVertical:
        hp(1.8),

      borderRadius:
        wp(3),
    },

    noDataTitle: {
      color:
        DARK,

      fontSize:
        wp(3.4),

      fontWeight:
        '700',
    },

    noDataText: {
      marginTop:
        hp(0.5),

      color:
        '#8A8A8A',

      fontSize:
        wp(2.8),

      fontWeight:
        '500',

      textAlign:
        'center',
    },

    /* ==================================================
       LEGEND
    ================================================== */

    legend: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop:
        hp(1.5),

      gap:
        wp(5),
    },

    legendItem: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    legendDot: {
      width:
        wp(2.3),

      height:
        wp(2.3),

      maxWidth: 9,

      maxHeight: 9,

      borderRadius:
        wp(1.2),

      marginRight:
        wp(1.5),
    },

    legendText: {
      fontSize:
        wp(2.8),

      color:
        '#737E79',

      fontWeight:
        '600',
    },
  });