import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ======================================================
// RESPONSIVE
// ======================================================

const { width, height } = Dimensions.get('window');

const wp = value => (width * value) / 100;
const hp = value => (height * value) / 100;

// ======================================================
// COLORS
// ======================================================

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F4F8F5';

// ======================================================
// API
// ======================================================

const DASHBOARD_API = 'https://staysereno.in/api/staff/booking/dashboard';

// ======================================================
// UNIT NAME HELPERS
// ======================================================

const getUnitNameOnly = item => {
  if (!item) {
    return '';
  }

  return (
    item?.final_unit_name ||
    item?.unit_name ||
    item?.unitName ||
    item?.unit?.final_unit_name ||
    item?.unit?.unit_name ||
    item?.unit?.unitName ||
    item?.unit?.name ||
    item?.name ||
    ''
  );
};

// ======================================================
// FLATTEN STORED PROPERTY / UNIT DATA
// ======================================================

const flattenPropertyUnits = list => {
  const result = [];

  const source = Array.isArray(list) ? list : [];

  source.forEach(item => {
    if (!item) {
      return;
    }

    result.push(item);

    if (Array.isArray(item?.units)) {
      item.units.forEach(unit => {
        if (unit) {
          result.push(unit);
        }
      });
    }

    if (Array.isArray(item?.properties)) {
      item.properties.forEach(property => {
        if (property) {
          result.push(property);
        }
      });
    }

    if (Array.isArray(item?.unit_list)) {
      item.unit_list.forEach(unit => {
        if (unit) {
          result.push(unit);
        }
      });
    }
  });

  return result;
};

// ======================================================
// GET PROPERTY IDS
// ======================================================

const getPropertyIds = item => {
  if (!item) {
    return [];
  }

  return [
    item?.id,
    item?.unit_id,
    item?.unitId,
    item?.property_id,
    item?.propertyId,

    item?.home?.id,
    item?.home?.unit_id,
    item?.home?.unitId,
    item?.home?.property_id,
    item?.home?.propertyId,

    item?.property?.id,
    item?.property?.unit_id,
    item?.property?.unitId,
    item?.property?.property_id,
    item?.property?.propertyId,

    item?.propertyData?.id,
    item?.propertyData?.unit_id,
    item?.propertyData?.unitId,
    item?.propertyData?.property_id,
    item?.propertyData?.propertyId,

    item?.propertyObject?.id,
    item?.propertyObject?.unit_id,
    item?.propertyObject?.unitId,
    item?.propertyObject?.property_id,
    item?.propertyObject?.propertyId,
  ].filter(value => value !== undefined && value !== null && value !== '');
};

// ======================================================
// GET TAGS FROM ANY PROPERTY SHAPE
// ======================================================
// ======================================================
// GET TAGS FROM ANY PROPERTY SHAPE
// ======================================================

const getPropertyTags = propertyData => {
  if (!propertyData) {
    return [];
  }

  // booking.home.tags
  if (Array.isArray(propertyData?.home?.tags)) {
    return propertyData.home.tags;
  }

  // direct tags
  if (Array.isArray(propertyData?.tags)) {
    return propertyData.tags;
  }

  // property.home.tags
  if (Array.isArray(propertyData?.property?.home?.tags)) {
    return propertyData.property.home.tags;
  }

  // property.tags
  if (Array.isArray(propertyData?.property?.tags)) {
    return propertyData.property.tags;
  }

  // propertyData.home.tags
  if (Array.isArray(propertyData?.propertyData?.home?.tags)) {
    return propertyData.propertyData.home.tags;
  }

  // propertyData.tags
  if (Array.isArray(propertyData?.propertyData?.tags)) {
    return propertyData.propertyData.tags;
  }

  return [];
};

// ======================================================
// RESOLVE PROPERTY DATA
// ======================================================

const resolvePropertyData = (booking, storedProperties = []) => {
  if (!booking) {
    return null;
  }

  console.log('========== RESOLVE PROPERTY DATA ==========');

  console.log('BOOKING PROPERTY ID:', booking?.property_id);

  console.log('BOOKING UNIT ID:', booking?.unit_id);

  // ==================================================
  // 1. ALREADY RESOLVED PROPERTY DATA
  // ==================================================

  if (booking?.propertyData && typeof booking.propertyData === 'object') {
    const amenities = getPropertyTags(booking.propertyData);

    if (amenities.length > 0) {
      console.log('RESOLVE PROPERTY: USING propertyData');

      return booking.propertyData;
    }
  }

  // ==================================================
  // 2. PROPERTY OBJECT
  // ==================================================

  if (booking?.propertyObject && typeof booking.propertyObject === 'object') {
    const amenities = getPropertyTags(booking.propertyObject);

    if (amenities.length > 0) {
      console.log('RESOLVE PROPERTY: USING propertyObject');

      return booking.propertyObject;
    }
  }

  // ==================================================
  // 3. DIRECT PROPERTY
  // ==================================================

  if (booking?.property && typeof booking.property === 'object') {
    const amenities = getPropertyTags(booking.property);

    if (amenities.length > 0) {
      console.log('RESOLVE PROPERTY: USING booking.property');

      return booking.property;
    }
  }

  // ==================================================
  // 4. BOOKING ITSELF MAY CONTAIN HOME/AMENITIES
  // ==================================================

  const bookingAmenities = getPropertyTags(booking);

  if (bookingAmenities.length > 0) {
    console.log('RESOLVE PROPERTY: USING BOOKING HOME/AMENITIES');

    return booking;
  }

  // ==================================================
  // 5. FIND MATCHED STORED PROPERTY
  // ==================================================

  const candidates = flattenPropertyUnits(
    Array.isArray(storedProperties) ? storedProperties : [],
  );

  console.log('RESOLVE PROPERTY: CANDIDATES:', candidates.length);

  if (!candidates.length) {
    console.log('RESOLVE PROPERTY: NO STORED CANDIDATES');

    return null;
  }

  // ==================================================
  // BOOKING IDS
  // ==================================================

  const bookingIds = [
    booking?.unit_id,
    booking?.unitId,

    booking?.property_id,
    booking?.propertyId,

    booking?.property?.id,
    booking?.property?.unit_id,
    booking?.property?.unitId,
    booking?.property?.property_id,
    booking?.property?.propertyId,

    booking?.property?.home?.id,
    booking?.property?.home?.unit_id,

    booking?.propertyData?.id,
    booking?.propertyData?.unit_id,
    booking?.propertyData?.unitId,
    booking?.propertyData?.property_id,
    booking?.propertyData?.propertyId,

    booking?.propertyObject?.id,
    booking?.propertyObject?.unit_id,
    booking?.propertyObject?.unitId,
    booking?.propertyObject?.property_id,
    booking?.propertyObject?.propertyId,
  ].filter(value => value !== undefined && value !== null && value !== '');

  console.log('RESOLVE PROPERTY BOOKING IDS:', bookingIds);

  // ==================================================
  // MATCH PROPERTY
  // ==================================================

  const matchedProperty = candidates.find(item => {
    const storedIds = getPropertyIds(item);

    return bookingIds.some(bookingId =>
      storedIds.some(storedId => String(storedId) === String(bookingId)),
    );
  });

  console.log(
    'RESOLVE PROPERTY MATCHED:',
    JSON.stringify(matchedProperty, null, 2),
  );

  return matchedProperty || null;
};

// ======================================================
// BUILD FINAL PROPERTY DATA
//
// This is important because stored property API may
// contain:
// home: null
//
// while dashboard booking/property API may contain:
// home: {
//   id: 20,
//   amenities: [...]
// }
//
// We merge both without losing amenities.
// ======================================================

const buildPropertyData = (booking, storedProperties) => {
  const resolved = resolvePropertyData(booking, storedProperties);

  const directProperty =
    booking?.propertyData ||
    booking?.propertyObject ||
    (booking?.property && typeof booking.property === 'object'
      ? booking.property
      : null);

  // --------------------------------------------
  // Find stored property using IDs
  // --------------------------------------------

  const candidates = flattenPropertyUnits(
    Array.isArray(storedProperties) ? storedProperties : [],
  );

  const bookingIds = [
    booking?.unit_id,
    booking?.unitId,
    booking?.property_id,
    booking?.propertyId,
    booking?.property?.id,
    booking?.property?.unit_id,
    booking?.property?.property_id,
  ].filter(value => value !== undefined && value !== null && value !== '');

  const storedProperty =
    candidates.find(item => {
      const storedIds = getPropertyIds(item);

      return bookingIds.some(bookingId =>
        storedIds.some(storedId => String(storedId) === String(bookingId)),
      );
    }) || null;

  // --------------------------------------------
  // Prefer actual resolved property
  // --------------------------------------------

  const baseProperty = resolved || directProperty || storedProperty || null;

  if (!baseProperty) {
    return null;
  }

  // --------------------------------------------
  // Find amenities from every possible source
  // --------------------------------------------

  let tags = getPropertyTags(booking);

  if (!Array.isArray(tags) || tags.length === 0) {
    tags = getPropertyTags(directProperty);
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    tags = getPropertyTags(resolved);
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    tags = getPropertyTags(storedProperty);
  }

  tags = Array.isArray(tags) ? tags : [];

  // --------------------------------------------
  // Resolve home
  // --------------------------------------------

  const home =
    booking?.home ||
    booking?.propertyData?.home ||
    booking?.propertyObject?.home ||
    booking?.property?.home ||
    resolved?.home ||
    baseProperty?.home ||
    null;

  const finalProperty = {
    ...(storedProperty || {}),
    ...(baseProperty || {}),
    ...(directProperty || {}),

    id: baseProperty?.id || storedProperty?.id || booking?.property_id,

    unit_id:
      baseProperty?.unit_id ||
      storedProperty?.unit_id ||
      booking?.unit_id ||
      booking?.property_id,

    property_id:
      baseProperty?.property_id ||
      storedProperty?.property_id ||
      booking?.property_id,

    unit_name:
      baseProperty?.unit_name ||
      storedProperty?.unit_name ||
      getUnitNameOnly(booking),

    final_unit_name:
      baseProperty?.final_unit_name ||
      storedProperty?.final_unit_name ||
      getUnitNameOnly(booking),

    // ACTUAL HOME OBJECT
    home: home || null,

    // ACTUAL TAGS
    tags: tags,
  };

  // --------------------------------------------
  // IMPORTANT:
  // Ensure tags are also available inside home
  // --------------------------------------------

  if (finalProperty.home && tags.length > 0) {
    finalProperty.home = {
      ...finalProperty.home,

      tags: Array.isArray(finalProperty.home?.tags)
        ? finalProperty.home.tags
        : tags,
    };
  }

  console.log('==============================================');

  console.log('BUILD FINAL PROPERTY DATA');

  console.log('PROPERTY ID:', finalProperty?.id);

  console.log('UNIT ID:', finalProperty?.unit_id);

  console.log('HOME ID:', finalProperty?.home?.id);

  console.log('TAGS COUNT:', tags.length);

  console.log(
    'TAGS:',
    tags.map(tag => ({
      id: tag?.id,
      name: tag?.name,
      icon: tag?.icon,
    })),
  );

  console.log('==============================================');

  return finalProperty;
};

// ======================================================
// RESOLVE UNIT NAME
// ======================================================

const resolveUnitName = (booking, storedProperties) => {
  const directUnitName = getUnitNameOnly(booking);

  if (directUnitName) {
    return directUnitName;
  }

  const candidates = flattenPropertyUnits(storedProperties);

  const bookingIds = [
    booking?.unit_id,
    booking?.unitId,
    booking?.property_id,
    booking?.propertyId,
    booking?.rate_plan_id,
    booking?.ratePlanId,
  ].filter(value => value !== undefined && value !== null && value !== '');

  if (!bookingIds.length) {
    return '—';
  }

  const matchedUnit = candidates.find(item => {
    const storedIds = [
      item?.unit_id,
      item?.unitId,
      item?.property_id,
      item?.propertyId,
      item?.id,
      item?.home?.id,
      item?.home?.unit_id,
    ].filter(value => value !== undefined && value !== null && value !== '');

    return bookingIds.some(bookingId =>
      storedIds.some(storedId => String(storedId) === String(bookingId)),
    );
  });

  const unitName = getUnitNameOnly(matchedUnit);

  if (unitName) {
    return unitName;
  }

  return '—';
};

// ======================================================
// CUSTOMER DETAILS
// ======================================================

const getCustomerDetails = booking => {
  if (!booking) {
    return {};
  }

  if (booking.customer_detail && typeof booking.customer_detail === 'object') {
    return booking.customer_detail;
  }

  if (typeof booking.customer_detail === 'string') {
    try {
      return JSON.parse(booking.customer_detail);
    } catch (error) {
      return {};
    }
  }

  return {};
};

// ======================================================
// DATE HELPERS
// ======================================================

const getBookingCheckinDate = booking => {
  return (
    booking?.checkin_date ||
    booking?.check_in_date ||
    booking?.checkinDate ||
    booking?.checkInDate ||
    booking?.arrival_date ||
    booking?.arrivalDate ||
    booking?.check_in ||
    booking?.checkin ||
    booking?.arrival ||
    booking?.start_date ||
    booking?.startDate ||
    booking?.from_date ||
    booking?.fromDate ||
    ''
  );
};

const getBookingCheckoutDate = booking => {
  return (
    booking?.checkout_date ||
    booking?.check_out_date ||
    booking?.checkoutDate ||
    booking?.checkOutDate ||
    booking?.departure_date ||
    booking?.departureDate ||
    booking?.check_out ||
    booking?.checkout ||
    booking?.departure ||
    booking?.end_date ||
    booking?.endDate ||
    booking?.to_date ||
    booking?.toDate ||
    ''
  );
};

// ======================================================
// NEXT 7 DAYS DIRECTION HELPER
// ======================================================

const getBookingDirection = booking => {
  const possibleValues = [
    booking?.booking_type,
    booking?.bookingType,
    booking?.arrival_departure,
    booking?.arrivalDeparture,
    booking?.booking_for,
    booking?.bookingFor,
    booking?.direction,
    booking?.movement,
    booking?.event_type,
    booking?.eventType,
    booking?.category,
    booking?.type,
  ];

  for (const value of possibleValues) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const normalized = String(value)
      .toLowerCase()
      .trim()
      .replace(/[_-]+/g, ' ');

    if (
      normalized.includes('arrival') ||
      normalized.includes('check in') ||
      normalized.includes('checkin')
    ) {
      return 'arrival';
    }

    if (
      normalized.includes('departure') ||
      normalized.includes('check out') ||
      normalized.includes('checkout')
    ) {
      return 'departure';
    }
  }

  return '';
};

// ======================================================
// SPLIT NEXT 7 DAYS
// ======================================================

const splitNextSevenDays = list => {
  const arrivals = [];
  const departures = [];

  if (!Array.isArray(list)) {
    return {
      arrivals,
      departures,
    };
  }

  list.forEach(item => {
    if (!item) {
      return;
    }

    const direction = getBookingDirection(item);

    if (direction === 'arrival') {
      arrivals.push(item);
      return;
    }

    if (direction === 'departure') {
      departures.push(item);
      return;
    }

    const checkinDate = getBookingCheckinDate(item);

    const checkoutDate = getBookingCheckoutDate(item);

    if (checkinDate) {
      arrivals.push(item);
    }

    if (checkoutDate) {
      departures.push(item);
    }
  });

  return {
    arrivals,
    departures,
  };
};

// ======================================================
// NORMALIZE BOOKING
// ======================================================

const normalizeBooking = (booking, type, storedProperties) => {
  const customer = getCustomerDetails(booking);

  const customerName =
    booking?.customer_name ||
    booking?.customerName ||
    (customer?.first_name || customer?.last_name
      ? `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()
      : 'Unknown Guest');

  const phone =
    booking?.customer_number ||
    booking?.phone ||
    customer?.phone ||
    customer?.mobile ||
    '—';

  const email =
    booking?.customer_email || booking?.email || customer?.email || '—';

  const unitName = resolveUnitName(booking, storedProperties);

  // ==================================================
  // PROPERTY DATA
  // ==================================================

  const propertyData = buildPropertyData(booking, storedProperties);

  const tags = getPropertyTags(propertyData);

  console.log('================================================');

  console.log('DYNAMIC PROPERTY TAGS');

  console.log('PROPERTY:', propertyData);

  console.log('PROPERTY ID:', propertyData?.id);

  console.log('UNIT ID:', propertyData?.unit_id);

  console.log('HOME ID:', propertyData?.home?.id);

  console.log('TAGS COUNT:', tags.length);

  console.log(
    'TAGS:',
    tags.map(tag => ({
      id: tag?.id,
      name: tag?.name,
      icon: tag?.icon,
    })),
  );

  console.log('================================================');

  const adults =
    Number(
      booking?.no_of_adult ?? booking?.adults ?? booking?.adult_count ?? 0,
    ) || 0;

  const children =
    Number(
      booking?.no_of_children ?? booking?.children ?? booking?.child_count ?? 0,
    ) || 0;

  const guestCountText = `${adults} adult${adults === 1 ? '' : 's'}${
    children > 0 ? ` · ${children} child${children === 1 ? '' : 'ren'}` : ''
  }`;

  const statusValue = String(
    booking?.property_booking_status ||
      booking?.booking_status ||
      booking?.status ||
      '',
  ).toUpperCase();

  const status = statusValue.includes('PENDING')
    ? 'PENDING'
    : statusValue === 'CONFIRMED' || statusValue === 'NEW'
    ? 'CONFIRMED'
    : statusValue || 'CONFIRMED';

  const checkinDate = getBookingCheckinDate(booking);

  const checkoutDate = getBookingCheckoutDate(booking);

  return {
    ...booking,

    propertyData: propertyData,

    propertyObject: propertyData,

    // IMPORTANT
    tags: tags,

    property_id:
      booking?.property_id ||
      propertyData?.property_id ||
      propertyData?.unit_id ||
      propertyData?.id,

    propertyId:
      booking?.propertyId ||
      booking?.property_id ||
      propertyData?.property_id ||
      propertyData?.unit_id ||
      propertyData?.id,

    unit_id:
      booking?.unit_id ||
      booking?.unitId ||
      propertyData?.unit_id ||
      propertyData?.id,

    unitId:
      booking?.unitId ||
      booking?.unit_id ||
      propertyData?.unit_id ||
      propertyData?.id,

    id: booking?.id || booking?.booking_id || booking?.bookingId,

    bookingId:
      booking?.booking_id ||
      booking?.bookingId ||
      booking?.id ||
      `booking-${Math.random()}`,

    booking_id: booking?.booking_id || booking?.bookingId || booking?.id,

    guest: customerName,

    customerName: customerName,

    customer_name: customerName,

    guest_name: customerName,

    api_property_name: booking?.property_name || '',

    property: unitName,

    property_name: unitName,

    propertyName: unitName,

    unit_name: unitName,

    unitName: unitName,

    location:
      booking?.location || booking?.location_name || booking?.city || 'GOA',

    adults: adults,

    adult_count: adults,

    children: children,

    child_count: children,

    guests: guestCountText,

    phone: phone,

    guest_phone: phone,

    email: email,

    guest_email: email,

    status: status,

    statusType: status === 'PENDING' ? 'pending' : 'confirmed',

    channel: booking?.channel || '—',

    checkin_date: checkinDate,

    checkout_date: checkoutDate,

    startDate: checkinDate,

    endDate: checkoutDate,

    start_date: checkinDate,

    end_date: checkoutDate,

    type: type,
  };
};

// ======================================================
// BOOKING CARD
// ======================================================

const BookingCard = memo(({ item, onPress }) => {
  const isPending = item.statusType === 'pending';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.bookingCard}
      onPress={() => onPress(item)}
    >
      <View style={styles.bookingTopRow}>
        <View
          style={[styles.propertyIcon, isPending && styles.propertyIconPending]}
        >
          <Text style={[styles.homeIcon, isPending && styles.homeIconPending]}>
            ⌂
          </Text>
        </View>

        <View style={styles.bookingContent}>
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>

          <Text style={styles.propertyName} numberOfLines={1}>
            {item.property || '—'}
          </Text>

          <View style={styles.guestRow}>
            <Text style={styles.peopleIcon}>♧</Text>

            <Text style={styles.guestText} numberOfLines={1}>
              {item.guest} · {item.guests}
            </Text>
          </View>
        </View>

        <View style={styles.channelContainer}>
          <Text style={styles.channelLabel} numberOfLines={1}>
            CHANNEL
          </Text>

          <Text style={styles.channelText} numberOfLines={2}>
            {item.channel || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.dateGroup}>
          <Text style={styles.dateLabel}>CHECK-IN</Text>

          <Text style={styles.dateValue} numberOfLines={1}>
            {item.checkin_date || '—'}
          </Text>
        </View>

        <View style={styles.dateArrowContainer}>
          <View style={styles.dateArrowCircle}>
            <Text style={styles.dateArrow}>›</Text>
          </View>
        </View>

        <View style={[styles.dateGroup, styles.dateGroupLast]}>
          <Text style={styles.dateLabel}>CHECK-OUT</Text>

          <Text
            style={[styles.dateValue, styles.dateValueRight]}
            numberOfLines={1}
          >
            {item.checkout_date || '—'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ======================================================
// LIST LOADER
// ======================================================

const ListLoader = () => {
  return (
    <View style={styles.listLoaderContainer}>
      <ActivityIndicator size="large" color={PRIMARY} />

      <Text style={styles.listLoaderText}>Loading bookings...</Text>
    </View>
  );
};

// ======================================================
// DASHBOARD
// ======================================================

const DashboardScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('arrivals');

  const [dateFilter, setDateFilter] = useState('Today');

  const [visibleCount, setVisibleCount] = useState(20);

  const [dashboardData, setDashboardData] = useState({
    nextArrivalDepartureList: [],
    checkinList: [],
    checkoutList: [],
    currentOccpancyList: [],
  });

  const [storedProperties, setStoredProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  const [listLoading, setListLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // ====================================================
  // GET USER ID
  // ====================================================

  const getUserId = useCallback(async () => {
    try {
      if (route?.params?.userId !== undefined && route.params.userId !== null) {
        return route.params.userId;
      }

      const storedUserId = await AsyncStorage.getItem('userId');

      if (storedUserId) {
        return storedUserId;
      }

      const userString = await AsyncStorage.getItem('user');

      if (userString) {
        try {
          const user = JSON.parse(userString);

          if (user?.id !== undefined && user?.id !== null) {
            return user.id;
          }

          if (user?.user_id !== undefined && user?.user_id !== null) {
            return user.user_id;
          }
        } catch (error) {
          console.log('DASHBOARD USER PARSE ERROR:', error);
        }
      }

      return null;
    } catch (error) {
      console.log('DASHBOARD USER ID ERROR:', error);

      return null;
    }
  }, [route]);

  // ====================================================
  // GET TOKEN
  // ====================================================

  const getToken = useCallback(async () => {
    try {
      const keys = ['authToken', 'token', 'access_token', 'userToken'];

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);

        if (value) {
          console.log(`DASHBOARD TOKEN FOUND FROM: ${key}`);

          return value;
        }
      }

      console.log('DASHBOARD TOKEN NOT FOUND');

      return null;
    } catch (error) {
      console.log('DASHBOARD TOKEN ERROR:', error);

      return null;
    }
  }, []);

  // ====================================================
  // LOAD STORED PROPERTIES / UNITS
  // ====================================================

  const loadStoredProperties = useCallback(async () => {
    try {
      const propertiesString = await AsyncStorage.getItem('properties');

      if (!propertiesString) {
        setStoredProperties([]);
        return;
      }

      const parsed = JSON.parse(propertiesString);

      const list = Array.isArray(parsed) ? parsed : [];

      setStoredProperties(list);

      console.log('================ STORED PROPERTIES ================');

      console.log('STORED PROPERTIES LENGTH:', list.length);

      console.log('STORED PROPERTIES:', JSON.stringify(list, null, 2));

      console.log('====================================================');
    } catch (error) {
      console.log('DASHBOARD PROPERTIES PARSE ERROR:', error);

      setStoredProperties([]);
    }
  }, []);

  // ====================================================
  // FETCH DASHBOARD
  // ====================================================

  const fetchDashboardData = useCallback(
    async (showLoader, selectedDateFilter, showListLoader = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        if (showListLoader) {
          setListLoading(true);
        }

        const userId = await getUserId();

        const token = await getToken();

        console.log('====================================');

        console.log('DASHBOARD USER ID:', userId);

        console.log('DASHBOARD TOKEN EXISTS:', !!token);

        console.log('DASHBOARD SELECTED FILTER:', selectedDateFilter);

        console.log('====================================');

        if (!userId) {
          console.log('DASHBOARD USER ID NOT FOUND');

          setDashboardData({
            nextArrivalDepartureList: [],
            checkinList: [],
            checkoutList: [],
            currentOccpancyList: [],
          });

          return;
        }

        let apiType = 'today';

        if (selectedDateFilter === 'Tomorrow') {
          apiType = 'tomorrow';
        }

        if (selectedDateFilter === 'Next 7 days') {
          apiType = 'next_7_days';
        }

        const requestBody = {
          user_id: userId,
          type: apiType,
        };

        console.log('====================================');

        console.log(
          'DASHBOARD REQUEST BODY:',
          JSON.stringify(requestBody, null, 2),
        );

        console.log('DASHBOARD API TYPE:', apiType);

        console.log('====================================');

        const response = await fetch(DASHBOARD_API, {
          method: 'POST',

          headers: {
            Accept: 'application/json',

            'Content-Type': 'application/json',

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify(requestBody),
        });

        const rawText = await response.text();

        console.log('DASHBOARD HTTP STATUS:', response.status);

        console.log('DASHBOARD RAW RESPONSE:', rawText);

        let json = {};

        try {
          json = JSON.parse(rawText);
        } catch (error) {
          console.log('DASHBOARD JSON PARSE ERROR:', error);
        }

        console.log('DASHBOARD JSON:', JSON.stringify(json, null, 2));

        // --------------------------------------------
        // UNAUTHENTICATED
        // --------------------------------------------

        if (response.status === 401 || json?.message === 'Unauthenticated.') {
          Alert.alert(
            'Session expired',
            'Please login again.',
            [
              {
                text: 'OK',

                onPress: async () => {
                  try {
                    await AsyncStorage.multiRemove([
                      'authToken',
                      'token',
                      'access_token',
                      'userToken',
                    ]);
                  } catch (error) {
                    console.log('CLEAR TOKEN ERROR:', error);
                  }

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
            {
              cancelable: false,
            },
          );

          return;
        }

        // --------------------------------------------
        // API ERROR
        // --------------------------------------------

        if (!response.ok) {
          Alert.alert(
            'Dashboard',
            json?.message || 'Unable to fetch dashboard data.',
          );

          return;
        }

        // --------------------------------------------
        // SUCCESS
        // --------------------------------------------

        if (json?.status === true) {
          const nextList = Array.isArray(json?.nextArrivalDepartureList)
            ? json.nextArrivalDepartureList
            : [];

          const checkinList = Array.isArray(json?.checkinList)
            ? json.checkinList
            : [];

          const checkoutList = Array.isArray(json?.checkoutList)
            ? json.checkoutList
            : [];

          const occupancyList = Array.isArray(json?.currentOccpancyList)
            ? json.currentOccpancyList
            : [];

          const newDashboardData = {
            nextArrivalDepartureList: nextList,

            checkinList: checkinList,

            checkoutList: checkoutList,

            currentOccpancyList: occupancyList,
          };

          console.log('====================================');

          console.log('FINAL DASHBOARD DATA');

          console.log('API TYPE:', apiType);

          console.log('ARRIVALS:', checkinList.length);

          console.log('DEPARTURES:', checkoutList.length);

          console.log('OCCUPANCY:', occupancyList.length);

          console.log('NEXT ARRIVAL/DEPARTURE:', nextList.length);

          console.log('====================================');

          setDashboardData(newDashboardData);

          return;
        }

        setDashboardData({
          nextArrivalDepartureList: [],
          checkinList: [],
          checkoutList: [],
          currentOccpancyList: [],
        });
      } catch (error) {
        console.log('DASHBOARD API ERROR:', error);

        Alert.alert('Dashboard', 'Unable to connect to server.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }

        if (showListLoader) {
          setListLoading(false);
        }

        setRefreshing(false);
      }
    },
    [getToken, getUserId, navigation],
  );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadStoredProperties();

    fetchDashboardData(true, 'Today', false);
  }, [loadStoredProperties, fetchDashboardData]);

  // ====================================================
  // PULL TO REFRESH
  // ====================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    await loadStoredProperties();

    await fetchDashboardData(false, dateFilter, false);
  }, [loadStoredProperties, fetchDashboardData, dateFilter]);

  // ====================================================
  // TAB CHANGE
  // ====================================================

  const selectTab = useCallback(tab => {
    setActiveTab(currentTab => {
      if (currentTab === tab) {
        return currentTab;
      }

      return tab;
    });

    setVisibleCount(20);
  }, []);

  // ====================================================
  // DATE FILTER
  // ====================================================

  const selectDateFilter = useCallback(
    async filter => {
      if (dateFilter === filter) {
        return;
      }

      console.log('DASHBOARD DATE FILTER CLICKED:', filter);

      setDateFilter(filter);

      setVisibleCount(20);

      await fetchDashboardData(false, filter, true);
    },
    [dateFilter, fetchDashboardData],
  );

  // ====================================================
  // RAW TAB DATA
  // ====================================================

  const tabBookings = useMemo(() => {
    if (activeTab === 'arrivals') {
      return Array.isArray(dashboardData.checkinList)
        ? dashboardData.checkinList
        : [];
    }

    if (activeTab === 'departures') {
      return Array.isArray(dashboardData.checkoutList)
        ? dashboardData.checkoutList
        : [];
    }

    if (activeTab === 'occupancy') {
      return Array.isArray(dashboardData.currentOccpancyList)
        ? dashboardData.currentOccpancyList
        : [];
    }

    return [];
  }, [activeTab, dashboardData]);

  // ====================================================
  // NORMALIZED BOOKINGS
  // ====================================================

  const normalizedBookings = useMemo(() => {
    return tabBookings.map(booking =>
      normalizeBooking(
        booking,
        activeTab === 'arrivals'
          ? 'arrival'
          : activeTab === 'departures'
          ? 'departure'
          : 'occupancy',
        storedProperties,
      ),
    );
  }, [tabBookings, activeTab, storedProperties]);

  // ====================================================
  // FILTERED DATA
  // ====================================================

  const filteredBookings = useMemo(() => {
    return normalizedBookings;
  }, [normalizedBookings]);

  // ====================================================
  // VISIBLE DATA
  // ====================================================

  const visibleBookings = useMemo(
    () => filteredBookings.slice(0, visibleCount),
    [filteredBookings, visibleCount],
  );

  // ====================================================
  // LOAD MORE
  // ====================================================

  const handleLoadMore = useCallback(() => {
    if (visibleCount >= filteredBookings.length) {
      return;
    }

    setVisibleCount(currentCount =>
      Math.min(currentCount + 10, filteredBookings.length),
    );
  }, [visibleCount, filteredBookings.length]);

  // ====================================================
  // OPEN BOOKING DETAIL
  // ====================================================

  const openBookingDetail = useCallback(
    item => {
      console.log('========== OPEN BOOKING DETAIL ==========');

      console.log('BOOKING UNIT ID:', item?.unit_id);

      console.log('BOOKING PROPERTY ID:', item?.property_id);

      console.log('ITEM PROPERTY DATA:', item?.propertyData);

      // ==========================================
      // GET TAGS
      // ==========================================

      const resolvedProperty =
        item?.propertyData || item?.propertyObject || null;

      const resolvedTags = Array.isArray(item?.tags)
        ? item.tags
        : getPropertyTags(resolvedProperty);

      console.log('FINAL PROPERTY ID:', resolvedProperty?.id);

      console.log('FINAL UNIT ID:', resolvedProperty?.unit_id);

      console.log('FINAL TAGS COUNT:', resolvedTags.length);

      console.log(
        'FINAL TAGS:',
        resolvedTags.map(tag => ({
          id: tag?.id,
          name: tag?.name,
          icon: tag?.icon,
        })),
      );

      console.log('===========================================');

      const propertyData =
        item?.propertyData ||
        item?.property ||
        item?.propertyObject ||
        item?.property_data ||
        null;

      const propertyTags =
        Array.isArray(item?.tags) && item.tags.length > 0
          ? item.tags
          : resolvedTags;

      navigation.navigate('DashboardDetail', {
        booking: {
          ...item,

          property: item?.propertyData || item?.property || null,

          propertyData: item?.propertyData || item?.property || null,

          propertyObject:
            item?.propertyObject ||
            item?.propertyData ||
            item?.property ||
            null,

          tags: propertyTags,

          id: item?.id || item?.bookingId,

          bookingId: item?.bookingId,

          booking_id: item?.booking_id || item?.bookingId,

          customerName: item?.guest,

          customer_name: item?.guest,

          guest_name: item?.guest,
        },
      });
    },
    [navigation],
  );

  // ====================================================
  // RENDER BOOKING
  // ====================================================

  const renderBooking = useCallback(
    ({ item }) => <BookingCard item={item} onPress={openBookingDetail} />,
    [openBookingDetail],
  );

  // ====================================================
  // EMPTY STATE
  // ====================================================

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>✓</Text>
        </View>

        <Text style={styles.emptyTitle}>No bookings found</Text>

        <Text style={styles.emptyText}>
          There are no bookings available for this selection.
        </Text>
      </View>
    ),
    [],
  );

  // ====================================================
  // HEADER
  // ====================================================

  const renderHeader = useCallback(
    () => (
      <View>
        {/* TOP TABS */}

        <View style={styles.topTabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectTab('arrivals')}
            style={[
              styles.topTab,
              activeTab === 'arrivals' && styles.activeTopTab,
            ]}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === 'arrivals' && styles.activeTopTabText,
              ]}
            >
              Arrivals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectTab('departures')}
            style={[
              styles.topTab,
              activeTab === 'departures' && styles.activeTopTab,
            ]}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === 'departures' && styles.activeTopTabText,
              ]}
            >
              Departures
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectTab('occupancy')}
            style={[
              styles.topTab,
              activeTab === 'occupancy' && styles.activeTopTab,
            ]}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === 'occupancy' && styles.activeTopTabText,
              ]}
            >
              Occupancy
            </Text>
          </TouchableOpacity>
        </View>

        {/* DATE FILTERS */}

        <View style={styles.dateFilters}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectDateFilter('Today')}
            style={[
              styles.dateFilter,
              dateFilter === 'Today' && styles.activeDateFilter,
            ]}
          >
            <Text
              style={[
                styles.dateFilterText,
                dateFilter === 'Today' && styles.activeDateFilterText,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectDateFilter('Tomorrow')}
            style={[
              styles.dateFilter,
              dateFilter === 'Tomorrow' && styles.activeDateFilter,
            ]}
          >
            <Text
              style={[
                styles.dateFilterText,
                dateFilter === 'Tomorrow' && styles.activeDateFilterText,
              ]}
            >
              Tomorrow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectDateFilter('Next 7 days')}
            style={[
              styles.dateFilter,
              dateFilter === 'Next 7 days' && styles.activeDateFilter,
            ]}
          >
            <Text
              style={[
                styles.dateFilterText,
                dateFilter === 'Next 7 days' && styles.activeDateFilterText,
              ]}
            >
              Next 7 days
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [activeTab, dateFilter, selectTab, selectDateFilter],
  );

  // ====================================================
  // FOOTER
  // ====================================================

  const renderFooter = useCallback(() => {
    if (visibleCount >= filteredBookings.length) {
      return null;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleLoadMore}
        style={styles.loadMoreButton}
      >
        <Text style={styles.loadMoreText}>Load more</Text>
      </TouchableOpacity>
    );
  }, [visibleCount, filteredBookings.length, handleLoadMore]);

  // ====================================================
  // INITIAL FULL SCREEN LOADING
  // ====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />

        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <View style={styles.container}>
      <FlatList
        data={listLoading ? [] : visibleBookings}
        keyExtractor={item => `${item.bookingId}-${item.id || ''}-${activeTab}`}
        renderItem={renderBooking}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={listLoading ? () => <ListLoader /> : renderEmpty}
        ListFooterComponent={listLoading ? null : renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={listLoading ? undefined : handleLoadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={30}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      />
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingBottom: hp(1.5),
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: hp(1.5),
    fontSize: wp(3.2),
    fontWeight: '600',
    color: '#7E8B84',
  },

  listLoaderContainer: {
    minHeight: hp(45),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
  },

  listLoaderText: {
    marginTop: hp(1.5),
    fontSize: wp(3.2),
    fontWeight: '600',
    color: '#7E8B84',
  },

  listContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },

  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.6),
  },

  topTab: {
    height: hp(4.6),
    paddingHorizontal: wp(3.2),
    borderRadius: hp(3),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    marginRight: wp(1.5),
    borderWidth: 1,
    borderColor: '#E3EBE6',
  },

  activeTopTab: {
    backgroundColor: '#164B38',
    borderColor: '#164B38',
  },

  topTabText: {
    fontSize: wp(2.75),
    fontWeight: '700',
    color: '#7E8B84',
  },

  activeTopTabText: {
    color: '#FFFFFF',
  },

  dateFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },

  dateFilter: {
    paddingHorizontal: wp(3.2),
    height: hp(4.1),
    borderRadius: hp(3),
    justifyContent: 'center',
    marginRight: wp(1.5),
  },

  activeDateFilter: {
    backgroundColor: '#DDF4E8',
  },

  dateFilterText: {
    fontSize: wp(3),
    fontWeight: '600',
    color: '#87958E',
  },

  activeDateFilterText: {
    color: PRIMARY,
  },

  unitFilterContent: {
    paddingBottom: hp(1.5),
  },

  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3.5),
    marginBottom: hp(1.1),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.25),
    borderWidth: 1,
    borderColor: '#E3EAE6',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.035,

    shadowRadius: 5,

    elevation: 1,
  },

  bookingTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: hp(7),
  },

  propertyIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    backgroundColor: '#DDF5E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  propertyIconPending: {
    backgroundColor: '#FFF0CF',
  },

  homeIcon: {
    fontSize: wp(5.5),
    color: '#15965F',
    lineHeight: wp(6),
  },

  homeIconPending: {
    color: '#C8880A',
  },

  bookingContent: {
    flex: 1,
    marginLeft: wp(2.5),
    marginRight: wp(1.5),
    minWidth: 0,
  },

  location: {
    fontSize: wp(2.3),
    fontWeight: '800',
    letterSpacing: wp(0.3),
    color: '#82918A',
    marginBottom: hp(0.25),
  },

  propertyName: {
    fontSize: wp(3.15),
    lineHeight: hp(1.95),
    fontWeight: '600',
    color: '#27342F',
  },

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.45),
  },

  peopleIcon: {
    fontSize: wp(3.2),
    color: '#91A09A',
    marginRight: wp(1),
  },

  guestText: {
    flex: 1,
    fontSize: wp(2.3),
    color: '#8A9791',
    fontWeight: '500',
  },

  channelContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: wp(30),
    minWidth: wp(21),
    alignSelf: 'flex-start',
    marginTop: hp(0.1),
  },

  channelLabel: {
    fontSize: wp(1.9),
    fontWeight: '800',
    letterSpacing: wp(0.15),
    color: '#9AA7A1',
    marginBottom: hp(0.3),
    textAlign: 'right',
  },

  channelText: {
    fontSize: wp(2.25),
    fontWeight: '700',
    color: '#586A62',
    textAlign: 'right',
    lineHeight: hp(1.65),
  },

  bookingFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    paddingTop: hp(0.8),
    borderTopWidth: 1,
    borderTopColor: '#EDF2EF',
  },

  dateGroup: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
  },

  dateGroupLast: {
    alignItems: 'flex-end',
  },

  dateLabel: {
    fontSize: wp(1.9),
    fontWeight: '800',
    letterSpacing: wp(0.15),
    color: '#9AA7A1',
  },

  dateValue: {
    fontSize: wp(2.2),
    fontWeight: '600',
    color: '#586A62',
    marginTop: hp(0.15),
    maxWidth: '100%',
  },

  dateValueRight: {
    textAlign: 'right',
  },

  dateArrowContainer: {
    width: wp(9),
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateArrowCircle: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateArrow: {
    fontSize: wp(5),
    lineHeight: wp(5.5),
    fontWeight: '700',
    color: '#7B8B84',
    marginTop: -wp(0.5),
  },

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(4),
    paddingVertical: hp(5),
    paddingHorizontal: wp(7),
    alignItems: 'center',
    marginTop: hp(1),
  },

  emptyIconCircle: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: '#DDF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },

  emptyIcon: {
    fontSize: wp(6),
    color: PRIMARY,
    fontWeight: '800',
  },

  emptyTitle: {
    fontSize: wp(4),
    fontWeight: '700',
    color: DARK,
  },

  emptyText: {
    fontSize: wp(3),
    color: '#89958F',
    textAlign: 'center',
    marginTop: hp(0.8),
    lineHeight: hp(2.2),
  },

  loadMoreButton: {
    height: hp(5),
    borderRadius: hp(3),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.5),
    marginBottom: hp(1),
  },

  loadMoreText: {
    fontSize: wp(3),
    fontWeight: '700',
    color: PRIMARY,
  },
});
