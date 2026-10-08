import React, {useEffect, useMemo, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageHeader from '../components/PageHeader';

// ======================================================
// FIND TAGS FROM ANY PROPERTY / BOOKING SHAPE
// ======================================================

/* =========================
   TAGS RESOLVER
========================= */

const findTags = object => {
  if (!object || typeof object !== 'object') {
    return [];
  }

  // Direct / known locations first
  const directSources = [
    object?.tags,

    object?.home?.tags,
    object?.home_property?.tags,

    object?.propertyData?.tags,
    object?.propertyData?.home?.tags,
    object?.propertyData?.home_property?.tags,

    object?.propertyObject?.tags,
    object?.propertyObject?.home?.tags,
    object?.propertyObject?.home_property?.tags,

    object?.property_data?.tags,
    object?.property_data?.home?.tags,
    object?.property_data?.home_property?.tags,

    object?.property?.tags,
    object?.property?.home?.tags,
    object?.property?.home_property?.tags,
  ];

  for (const source of directSources) {
    if (Array.isArray(source) && source.length > 0) {
      return source;
    }
  }

  // Recursive fallback
  // API structure agar kisi unknown nested key ke andar
  // tags contain karti hai to yahan se mil jayenge.
  const visited = new Set();

  const recursiveFind = current => {
    if (!current || typeof current !== 'object') {
      return [];
    }

    if (visited.has(current)) {
      return [];
    }

    visited.add(current);

    if (Array.isArray(current)) {
      return [];
    }

    // Direct tags on current object
    if (Array.isArray(current.tags) && current.tags.length > 0) {
      return current.tags;
    }

    for (const key of Object.keys(current)) {
      const value = current[key];

      if (!value || typeof value !== 'object') {
        continue;
      }

      // Avoid recursively scanning huge/unrelated structures
      if (
        key === 'amenities' ||
        key === 'amenity' ||
        key === 'images' ||
        key === 'gallery' ||
        key === 'media'
      ) {
        continue;
      }

      const result = recursiveFind(value);

      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
    }

    return [];
  };

  return recursiveFind(object);
};

const getTagName = tag =>
  tag?.name ||
  tag?.tag_name ||
  tag?.tagName ||
  tag?.title ||
  tag?.label ||
  '';

const {width, height} = Dimensions.get('window');

const BOOKING_DETAIL_API =
  'https://staysereno.in/api/staff/booking/detail';

const wp = value => (width * value) / 100;
const hp = value => (height * value) / 100;

/* =========================================================
   BASIC HELPERS
/* =========================================================
========================================================= */

const getBookingValue = (
  booking,
  keys,
  fallback = '—',
) => {
  for (const key of keys) {
    const value = booking?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return fallback;
};

const getTextValue = (value, fallback = '—') => {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  if (value && typeof value === 'object') {
    return getTextValue(
      value.final_unit_name ||
        value.unit_name ||
        value.unitName ||
        value.name ||
        value.title,
      fallback,
    );
  }

  return fallback;
};

const getNestedBookingValue = (
  value,
  key,
  fallback,
) => {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  if (
    value[key] !== undefined &&
    value[key] !== null &&
    value[key] !== ''
  ) {
    return value[key];
  }

  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') {
      const result = getNestedBookingValue(
        child,
        key,
        undefined,
      );

      if (result !== undefined) {
        return result;
      }
    }
  }

  return fallback;
};

const normalizeGuestName = value => {
  if (
    !value ||
    value === '—' ||
    value === 'null' ||
    value === 'undefined'
  ) {
    return 'Unknown Guest';
  }

  return String(value).trim();
};

/* =========================================================
   JSON PARSER
========================================================= */

const parseJsonSafely = value => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.log(
      'BOOKING JSON PARSE ERROR:',
      error,
    );

    return {};
  }
};

/* =========================================================
   DATE PARSER

   Supports:
   24 September 2026
   2026-09-24
   2026-09-24 07:17:37
   ISO dates
========================================================= */

const parseBookingDate = value => {
  if (
    !value ||
    value === '—'
  ) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  const stringValue = String(value).trim();

  // --------------------------------------------
  // DD Month YYYY
  // Example: 24 September 2026
  // --------------------------------------------

  const longDateMatch =
    stringValue.match(
      /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
    );

  if (longDateMatch) {
    const day =
      Number(longDateMatch[1]);

    const monthName =
      longDateMatch[2];

    const year =
      Number(longDateMatch[3]);

    const monthMap = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };

    const month =
      monthMap[
        monthName.toLowerCase()
      ];

    if (
      month !== undefined
    ) {
      const date = new Date(
        year,
        month,
        day,
      );

      if (
        !Number.isNaN(
          date.getTime(),
        )
      ) {
        return date;
      }
    }
  }

  // --------------------------------------------
  // YYYY-MM-DD
  // --------------------------------------------

  const isoDateMatch =
    stringValue.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (isoDateMatch) {
    const year =
      Number(isoDateMatch[1]);

    const month =
      Number(isoDateMatch[2]) - 1;

    const day =
      Number(isoDateMatch[3]);

    const date = new Date(
      year,
      month,
      day,
    );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date;
    }
  }

  // --------------------------------------------
  // YYYY-MM-DD HH:mm:ss
  // --------------------------------------------

  const sqlDateMatch =
    stringValue.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

  if (sqlDateMatch) {
    const year =
      Number(sqlDateMatch[1]);

    const month =
      Number(sqlDateMatch[2]) - 1;

    const day =
      Number(sqlDateMatch[3]);

    const hour =
      Number(sqlDateMatch[4]);

    const minute =
      Number(sqlDateMatch[5]);

    const second =
      Number(sqlDateMatch[6] || 0);

    const date = new Date(
      year,
      month,
      day,
      hour,
      minute,
      second,
    );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date;
    }
  }

  // --------------------------------------------
  // Normal fallback
  // --------------------------------------------

  const date =
    new Date(stringValue);

  if (
    !Number.isNaN(
      date.getTime(),
    )
  ) {
    return date;
  }

  return null;
};

const formatDisplayDate = value => {
  const date = parseBookingDate(value);

  if (!date) {
    return '—';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCreatedDate = value => {
  const stringValue = String(value ?? '').trim();
  const parsedDate =
    parseBookingDate(stringValue) ||
    parseBookingDate(
      stringValue.match(/^\d{1,2}\s+[A-Za-z]+\s+\d{4}/)?.[0],
    );

  if (!parsedDate) {
    return '—';
  }

  const dateText = formatDisplayDate(parsedDate);
  const timeMatch = stringValue.match(
    /(\d{1,2}):(\d{2})(?::\d{2})?\s*:?[ ]*(AM|PM)/i,
  );

  if (!timeMatch) {
    return dateText;
  }

  return `${dateText} ${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
};

/* =========================================================
========================================================= */

const getWeekdayName = value => {
  const date =
    parseBookingDate(value);

  if (!date) {
    return '—';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
    },
  );
};

/* =========================================================
   NIGHT COUNT
========================================================= */

const calculateNightCount = (
  arrival,
  departure,
  apiNightCount,
) => {
  // API ka exact no_of_nights
  if (
    apiNightCount !== undefined &&
    apiNightCount !== null &&
    apiNightCount !== ''
  ) {
    const numeric =
      Number(apiNightCount);

    if (
      !Number.isNaN(numeric)
    ) {
      return numeric;
    }
  }

  const start =
    parseBookingDate(arrival);

  const end =
    parseBookingDate(departure);

  if (!start || !end) {
    return 0;
  }

  const diff =
    end.getTime() -
    start.getTime();

  const days =
    Math.round(
      diff /
        (1000 *
          60 *
          60 *
          24),
    );

  return days > 0
    ? days
    : 0;
};

/* =========================================================
   CURRENCY
========================================================= */

const formatCurrency = value => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '₹0.00';
  }

  const numericValue =
    Number(
      String(value).replace(
        /[^0-9.-]/g,
        '',
      ),
    );

  if (
    Number.isNaN(
      numericValue,
    )
  ) {
    return String(value);
  }

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(numericValue);
};

const parseAmount = value => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0;
  }

  const numericValue = Number(
    String(value).replace(/[^0-9.-]/g, ''),
  );

  return Number.isNaN(numericValue)
    ? 0
    : numericValue;
};

const parseAdditionalCharges = value => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
};

const getAdditionalChargeLabel = (charge, index) => {
  if (typeof charge === 'string') {
    return charge;
  }

  return (
    charge?.name ||
    charge?.title ||
    charge?.label ||
    charge?.charge_name ||
    charge?.additional_charge_name ||
    charge?.description ||
    `Additional charge ${index + 1}`
  );
};

const getAdditionalChargeAmount = charge => {
  if (typeof charge === 'number') {
    return charge;
  }

  return (
    charge?.amount ??
    charge?.charge_amount ??
    charge?.additional_charge_amount ??
    charge?.price ??
    charge?.total ??
    charge?.value
  );
};

/* =========================================================
   LABEL
========================================================= */

const Label = ({
  children,
}) => (
  <Text style={styles.smallLabel}>
    {children}
  </Text>
);

/* =========================================================
   PRICE CARD
========================================================= */

const PriceCard = ({
  title,
  value,
  valueStyle,
}) => (
  <View style={styles.priceCard}>
    <Text style={styles.priceCardTitle}>
      {title}
    </Text>

    <Text
      style={[
        styles.priceCardValue,
        valueStyle,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);

/* =========================================================
   MAIN SCREEN
========================================================= */

const BookingDetail = ({
  navigation,
  route,
  embedded = false,
  onClose,
}) => {
  const insets =
    useSafeAreaInsets();

  const routeBooking =
    route?.params?.booking ||
    route?.params?.item ||
    {};

  const [bookingDetail, setBookingDetail] =
    useState(null);

  const [requestedBookingId, setRequestedBookingId] =
    useState(null);

  const booking =
    bookingDetail || routeBooking;

  /* =======================================================
     CUSTOMER DETAIL
  ======================================================= */

  const customer =
    useMemo(
      () =>
        parseJsonSafely(
          booking?.customer_detail,
        ),
      [booking],
    );

  /* =======================================================
     OTA RESPONSE
  ======================================================= */

  const otaResponse =
    useMemo(
      () =>
        parseJsonSafely(
          booking?.booking_notes,
        ),
      [booking],
    );

  const otaReservation =
    Array.isArray(
      otaResponse?.reservations,
    )
      ? otaResponse.reservations[0] ||
        {}
      : {};

  /* =======================================================
     ROOM DATA FROM OTA
  ======================================================= */

  const otaRoom =
    Array.isArray(
      otaReservation?.rooms,
    )
      ? otaReservation.rooms[0] ||
        {}
      : {};

  /* =======================================================
     BOOKING ID
  ======================================================= */

  const bookingId =
    getBookingValue(
      routeBooking,
      [
        'bookingId',
        'booking_id',
        'id',
      ],
      '—',
    );

  const hasPaymentDetails = [
    'guest_total_payable_amount',
    'detail_paid_amount',
    'detail_pending_amount',
  ].every(
    key =>
      getNestedBookingValue(
        booking,
        key,
        undefined,
      ) !== undefined,
  );

  useEffect(() => {
    const normalizedBookingId = String(bookingId || '').trim();

    if (
      hasPaymentDetails ||
      !normalizedBookingId ||
      normalizedBookingId === '—' ||
      requestedBookingId === normalizedBookingId
    ) {
      return undefined;
    }

    let active = true;
    setRequestedBookingId(normalizedBookingId);

    const fetchBookingDetails = async () => {
      try {
        const token =
          (await AsyncStorage.getItem('authToken')) ||
          (await AsyncStorage.getItem('token')) ||
          (await AsyncStorage.getItem('access_token')) ||
          (await AsyncStorage.getItem('userToken'));

        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const response = await fetch(
          `${BOOKING_DETAIL_API}/${encodeURIComponent(
            normalizedBookingId,
          )}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const responseText = await response.text();
        let result;

        try {
          result = JSON.parse(responseText);
        } catch (error) {
          throw new Error('Invalid booking detail response.');
        }

        if (!response.ok || result?.status === false) {
          throw new Error(
            result?.message ||
              result?.error ||
              'Unable to load booking details.',
          );
        }

        console.log('DASHBOARD BOOKING DETAIL RESPONSE:', result);
        console.log('UPDATED BASE PRICE FIELD:', result?.data?.bookingDetail?.detail_updated_base_price || result?.data?.booking_detail?.detail_updated_base_price || result?.data?.booking?.detail_updated_base_price || result?.bookingDetail?.detail_updated_base_price || result?.booking_detail?.detail_updated_base_price || result?.booking?.detail_updated_base_price || result?.detail_updated_base_price);

        const detail =
          result?.data?.bookingDetail ||
          result?.data?.booking_detail ||
          result?.data?.booking ||
          result?.bookingDetail ||
          result?.booking_detail ||
          result?.booking ||
          result?.data ||
          result;

        if (
          !detail ||
          typeof detail !== 'object' ||
          Array.isArray(detail)
        ) {
          throw new Error('Booking details were not found.');
        }

        if (active) {
          const property =
            detail?.property ||
            detail?.propertyData ||
            detail?.propertyObject ||
            routeBooking?.property ||
            routeBooking?.propertyData ||
            routeBooking?.propertyObject;

          setBookingDetail({
            ...routeBooking,
            ...detail,
            id:
              detail?.id ||
              detail?.booking_id ||
              detail?.bookingId ||
              normalizedBookingId,
            bookingId:
              detail?.bookingId ||
              detail?.booking_id ||
              normalizedBookingId,
            booking_id:
              detail?.booking_id ||
              detail?.bookingId ||
              normalizedBookingId,
            property,
            propertyData: property,
            propertyObject: property,
          });
        }
      } catch (error) {
        console.log(
          'DASHBOARD BOOKING DETAIL FETCH ERROR:',
          error?.message || error,
        );
      }
    };

    fetchBookingDetails();

    return () => {
      active = false;
    };
  }, [
    bookingId,
    hasPaymentDetails,
    requestedBookingId,
    routeBooking,
  ]);

  /* =======================================================
     GUEST NAME
  ======================================================= */

  const customerFullName =
    [
      customer?.first_name,
      customer?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

  const guestName =
    normalizeGuestName(
      getBookingValue(
        booking,
        [
          'customerName',
          'customer_name',
          'guest_name',
          'guest',
          'name',
        ],
        customerFullName ||
          otaRoom?.guest_name ||
          'Unknown Guest',
      ),
    );

  /* =======================================================
     CHANNEL
  ======================================================= */

  const channel =
    getBookingValue(
      booking,
      [
        'channel',
        'channel_name',
        'channelName',
      ],
      otaReservation?.affiliation
        ?.source ||
        '—',
    );

  const channelDisplay =
    getBookingValue(
      booking,
      [
        'channelDisplay',
        'channel_display',
        'channelDisplayName',
        'channel_display_name',
      ],
      channel,
    );

  /* =======================================================
     CHANNEL REFERENCE
  ======================================================= */

  const channelRefId =
    getBookingValue(
      booking,
      [
        'channel_booking_id',
        'booking_reference_id',
        'bookingReferenceId',
        'confirmation_id',
      ],
      otaReservation?.channel_booking_id ||
        '—',
    );

  /* =======================================================
     STATUS
  ======================================================= */

  const status =
    getBookingValue(
      booking,
      [
        'property_booking_status',
        'status',
        'booking_status',
      ],
      'Confirmed',
    );

  /* =======================================================
     PHONE
  ======================================================= */

  const phone =
    customer?.mobile_number ||
    customer?.mobile ||
    customer?.phone ||
    customer?.phone_number ||
    getBookingValue(
      booking,
      [
        'phone',
        'guest_phone',
        'customer_number',
        'customer_phone',
        'phone_number',
        'mobile',
        'mobile_number',
        'guest_mobile',
        'contact_number',
        'customerMobile',
      ],
      otaReservation?.customer
        ?.telephone ||
        otaReservation?.customer
          ?.phone ||
        '—',
    );

  /* =======================================================
     EMAIL
  ======================================================= */

  const email =
    getBookingValue(
      booking,
      [
        'email',
        'guest_email',
        'customer_email',
        'email_address',
      ],
      customer?.email ||
        otaReservation?.customer
          ?.email ||
        '—',
    );

  /* =======================================================
     ADULT / CHILDREN
  ======================================================= */

  const adults =
    getBookingValue(
      booking,
      [
        'adults',
        'adult_count',
        'no_of_adult',
      ],
      otaRoom?.numberofadults ||
        0,
    );

  const children =
    getBookingValue(
      booking,
      [
        'children',
        'child_count',
        'no_of_children',
      ],
      otaRoom?.numberofchildren ||
        0,
    );

  /* =======================================================
     PROPERTY NAME
  ======================================================= */

  const propertyName =
    getTextValue(
      booking?.final_unit_name ||
        booking?.property?.final_unit_name ||
        booking?.propertyData?.final_unit_name ||
        booking?.propertyObject?.final_unit_name ||
        booking?.home_property?.final_unit_name ||
        booking?.home?.final_unit_name ||
        '—',
    );

  /* =======================================================
     LOCATION
  ======================================================= */

  const customerLocation =
    parseJsonSafely(
      booking?.customer_location_detail,
    );

  const location =
    getBookingValue(
      booking,
      [
        'location',
        'location_name',
        'city',
        'property_location',
      ],
      customerLocation?.city ||
        customerLocation?.location ||
        booking?.property?.location ||
        booking?.property?.home?.location ||
        booking?.propertyData?.location ||
        booking?.home?.location ||
        booking?.location_name ||
        otaReservation?.customer
          ?.city ||
        '—',
    );

  /* =======================================================
     TAGS
  ======================================================= */

  const tags = useMemo(() => {
    console.log(
      '========== BOOKING DETAIL TAGS ==========',
    );

    console.log(
      'BOOKING:',
      booking,
    );

    console.log(
      'BOOKING UNIT ID:',
      booking?.unit_id,
    );

    console.log(
      'BOOKING PROPERTY DATA:',
      booking?.propertyData,
    );

    console.log(
      'BOOKING PROPERTY OBJECT:',
      booking?.propertyObject,
    );

    console.log(
      'BOOKING PROPERTY DATA 2:',
      booking?.property_data,
    );

    console.log(
      'DIRECT BOOKING TAGS:',
      booking?.tags,
    );

    const list = findTags(booking);

    console.log(
      'RESOLVED TAGS COUNT:',
      Array.isArray(list)
        ? list.length
        : 0,
    );

    console.log(
      'RESOLVED TAGS:',
      list,
    );
 
    const filtered =
      Array.isArray(list)
        ? list.filter(item => {
            if (
              !item ||
              typeof item !== 'object' ||
              !getTagName(item)
            ) {
              return false;
            }
            if (
              item?.status === undefined ||
              item?.status === null ||
              item?.status === ''
            ) {
              return true;
            }

            return Number(item?.status) === 1;
          })
        : [];

    console.log(
      'FINAL TAGS COUNT:',
      filtered.length,
    );

    console.log(
      'FINAL TAGS:',
      filtered.map(item => ({
        id: item?.id,
        tags_id: item?.tags_id,
        name: item?.name,
        icon: item?.icon,
        status: item?.status,
      })),
    );

    console.log(
      '==============================================',
    );

    return filtered;
  }, [booking]);

  /* =======================================================
     ARRIVAL / DEPARTURE
  ======================================================= */

  const arrivalRaw =
    getBookingValue(
      booking,
      [
        'checkin_date',
        'check_in_date',
        'checkinDate',
        'checkInDate',
        'arrival_date',
        'startDate',
        'start_date',
      ],
      otaRoom?.arrival_date ||
        '—',
    );

  const departureRaw =
    getBookingValue(
      booking,
      [
        'checkout_date',
        'check_out_date',
        'checkoutDate',
        'checkOutDate',
        'departure_date',
        'endDate',
        'end_date',
      ],
      otaRoom?.departure_date ||
        '—',
    );

  const arrivalDate =
    formatDisplayDate(
      arrivalRaw,
    );

  const departureDate =
    formatDisplayDate(
      departureRaw,
    );

  const arrivalWeekday =
    getWeekdayName(
      arrivalRaw,
    );

  const departureWeekday =
    getWeekdayName(
      departureRaw,
    );

  /* =======================================================
     NIGHT COUNT
  ======================================================= */

  const nightCount =
    calculateNightCount(
      arrivalRaw,
      departureRaw,
      booking?.no_of_nights,
    );

  const isQuotationChannel =
    String(channel).trim().toLowerCase() === 'quotation';

  const quotationSubtotalRaw =
    booking?.detail_sub_total;

  const quotationAddOnDiscountRaw =
    booking?.detail_add_on_discount;

  const quotationTotalRaw =
    booking?.detail_total_amount;

  /* =======================================================
     FINANCIAL DATA
  ======================================================= */

  const basePriceValue = parseAmount(
    booking?.base_price ??
      booking?.basePrice ??
      booking?.base_amount ??
      booking?.room_price ??
      booking?.subtotal ??
      otaRoom?.totalbeforetax ??
      otaRoom?.subtotal ??
      otaRoom?.price?.[0]?.amount ??
      0,
  );

  const updatedBasePriceRaw =
    booking?.detail_updated_base_price ??
    booking?.updated_base_price ??
    booking?.updatedBasePrice ??
    null;

  const taxAmountValue =
    parseAmount(
      getBookingValue(
        booking,
        [
          'tax_amount',
          'gst_amount',
          'gstAmount',
          'tax',
          'taxes',
        ],
        otaRoom?.tax ||
          otaRoom?.taxes ||
          otaRoom?.price?.[0]?.tax ||
          0,
      ),
    );

  const additionalCharges =
    parseAdditionalCharges(
      booking?.detail_new_additional_charges,
    );

  const extraGuestChargeRaw =
    getNestedBookingValue(
      booking,
      'extra_guest_charge',
      undefined,
    );

  const hasExtraGuestCharge =
    extraGuestChargeRaw !== undefined &&
    extraGuestChargeRaw !== null &&
    extraGuestChargeRaw !== '';

  const extraGuestChargeValue =
    parseAmount(extraGuestChargeRaw);

  const discountDetails =
    parseJsonSafely(
      booking?.detail_discount_amount,
    );

  const discountAmountRaw =
    discountDetails &&
    typeof discountDetails === 'object'
      ? discountDetails?.amount
      : discountDetails;

  const hasDiscountAmount =
    discountAmountRaw !== undefined &&
    discountAmountRaw !== null &&
    discountAmountRaw !== '';

  const discountAmountValue =
    parseAmount(discountAmountRaw);

  const discountCouponCode =
    discountDetails?.coupon_code ||
    booking?.applied_discount_coupon ||
    '';

  const appliedCreditRaw =
    getNestedBookingValue(
      booking,
      'apply_credit_amount',
      undefined,
    );

  const convenienceFeeRaw =
    getNestedBookingValue(
      booking,
      'convenience_fee',
      undefined,
    );

  const convenienceTaxRaw =
    getNestedBookingValue(
      booking,
      'convenience_tax',
      undefined,
    );

  const totalBeforeTaxRaw =
    getNestedBookingValue(
      booking,
      'totalbeforetax',
      undefined,
    );

  const showConvenienceFee =
    parseAmount(convenienceFeeRaw) > 0;

  const hasAppliedCredit =
    appliedCreditRaw !== undefined &&
    appliedCreditRaw !== null &&
    appliedCreditRaw !== '';

  const appliedCreditValue =
    parseAmount(appliedCreditRaw);

  const guestTotalValue =
    parseAmount(
      getNestedBookingValue(
        booking,
        'guest_total_payable_amount',
        0,
      ),
    );

  const paidAmountValue =
    parseAmount(
      getNestedBookingValue(
        booking,
        'detail_paid_amount',
        0,
      ),
    );

  /* =======================================================
     PENDING
  ======================================================= */

  const pendingAmountValue =
    parseAmount(
      getNestedBookingValue(
        booking,
        'detail_pending_amount',
        0,
      ),
    );

  /* =======================================================
     PAYOUT
  ======================================================= */

  const totalPayoutValue =
    parseAmount(
      getNestedBookingValue(
        booking,
        'payable_amount',
        0,
      ),
    );

  /* =======================================================
     PRICE BREAKDOWN
  ======================================================= */

  const baseNightPriceValue =
    parseAmount(
      updatedBasePriceRaw ??
        booking?.base_price ??
        booking?.basePrice ??
        basePriceValue,
    );

  const guestTotalBreakdownValue =
    guestTotalValue;

  const basePrice =
    formatCurrency(
      basePriceValue,
    );

  const totalPayout =
    formatCurrency(
      totalPayoutValue,
    );

  const guestTotal =
    formatCurrency(
      guestTotalValue,
    );

  const baseNightPrice =
    formatCurrency(
      baseNightPriceValue,
    );

  const gstAmount =
    formatCurrency(
      taxAmountValue,
    );

  const guestTotalBreakdown =
    formatCurrency(
      guestTotalBreakdownValue,
    );

  const paidAmount =
    formatCurrency(
      paidAmountValue,
    );

  const pendingAmount =
    formatCurrency(
      pendingAmountValue,
    );

  /* =======================================================
     CREATED DATE
  ======================================================= */

  const createdRaw =
    getBookingValue(
      booking,
      [
        'created_at',
        'createdAt',
        'reservation_created_at',
      ],
      otaReservation?.processed_at ||
        otaReservation?.booked_at ||
        '—',
    );

  const createdAt =
    formatCreatedDate(
      createdRaw,
    );

  /* =======================================================
     BOOKING REFERENCE
  ======================================================= */

  const bookingReferenceId =
    getBookingValue(
      booking,
      [
        'channel_booking_id',
        'booking_reference_id',
        'bookingReferenceId',
        'confirmation_id',
      ],
      otaReservation?.channel_booking_id ||
        bookingId,
    );

  /* =======================================================
     BOOKING NOTES
  ======================================================= */

  const bookingNotes =
    getBookingValue(
      booking,
      [
        'booking_notes',
        'bookingNotes',
        'notes',
        'note',
        'remarks',
        'special_requests',
        'specialRequests',
        'guest_notes',
        'customer_notes',
        'comment',
      ],
      otaReservation
        ?.customer
        ?.remarks ||
        otaReservation?.remarks ||
        otaReservation?.notes ||
        '',
    );

  /* =======================================================
     AVATAR INITIALS
  ======================================================= */

  const avatarText =
    guestName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(name =>
        name.charAt(0),
      )
      .join('')
      .toUpperCase() || 'GU';

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6F8F7"
        translucent={false}
      />

      <View style={styles.container}>
        <PageHeader
          navigation={
            embedded
              ? {
                  canGoBack: () => true,
                  goBack: onClose,
                }
              : navigation
          }
          title={String(bookingId)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                insets.bottom +
                hp(6),
            },
          ]}
        >
          {/* =================================================
              RESERVATION
          ================================================= */}

          <Text style={styles.sectionLabel}>
            RESERVATION
          </Text>

          <View style={styles.titleRow}>
            <Text
              style={styles.bookingTitle}
              numberOfLines={2}
            >
              Booking {bookingId}
            </Text>

            <View style={styles.confirmedBadge}>
              <View
                style={styles.statusDot}
              />

              <Text
                style={
                  styles.confirmedText
                }
              >
                {status}
              </Text>
            </View>
          </View>

          <Text style={styles.createdText}>
            {createdAt !== '—'
              ? `Created ${createdAt} · ${channelDisplay}`
              : channelDisplay}
          </Text>

          {/* =================================================
              PRICE CARDS
          ================================================= */}

          <View style={styles.summaryGrid}>
            <PriceCard
              title="BASE PRICE"
              value={basePrice}
            />

            <PriceCard
              title="TOTAL PAYOUT"
              value={totalPayout}
            />

            <PriceCard
              title="GUEST TOTAL"
              value={guestTotal}
            />

            <PriceCard
              title="PAID"
              value={paidAmount}
              valueStyle={
                styles.paidCardValue
              }
            />

            <PriceCard
              title="PENDING"
              value={pendingAmount}
              valueStyle={
                styles.pendingCardValue
              }
            />
          </View>

          {/* =================================================
              GUEST DETAILS
          ================================================= */}

          <View style={styles.card}>
            <View
              style={styles.cardHeader}
            >
              <Text
                style={
                  styles.cardHeaderIcon
                }
              >
                ◔
              </Text>

              <Text
                style={
                  styles.cardHeaderTitle
                }
              >
                GUEST DETAILS
              </Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.guestRow}>
                <View style={styles.avatar}>
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {avatarText}
                  </Text>
                </View>

                <View
                  style={
                    styles.guestInfo
                  }
                >
                  <Text
                    style={
                      styles.guestName
                    }
                    numberOfLines={2}
                  >
                    {guestName}
                  </Text>

                  <Text
                    style={
                      styles.primaryGuest
                    }
                  >
                    Primary guest
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.horizontalLine
                }
              />

              <View
                style={styles.rowBlock}
              >
                <Label>
                  PHONE
                </Label>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {phone}
                </Text>
              </View>

              <View
                style={styles.rowBlock}
              >
                <Label>
                  EMAIL
                </Label>

                <Text
                  style={
                    styles.detailValue
                  }
                  numberOfLines={2}
                >
                  {email}
                </Text>
              </View>

              <View
                style={
                  styles.twoColumnRow
                }
              >
                <View
                  style={
                    styles.halfColumn
                  }
                >
                  <Label>
                    ADULTS
                  </Label>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {adults}
                  </Text>
                </View>

                <View
                  style={
                    styles.halfColumn
                  }
                >
                  <Label>
                    CHILDREN
                  </Label>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {children}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =================================================
              STAY DETAILS
          ================================================= */}

          <View style={styles.stayCard}>
            <View
              style={styles.stayHeader}
            >
              <View
                style={
                  styles.stayHeaderLeft
                }
              >
                <View
                  style={
                    styles.stayHeaderIcon
                  }
                >
                  <Text
                    style={
                      styles.stayHeaderIconText
                    }
                  >
                    🏠
                  </Text>
                </View>

                <View>
                  <Text
                    style={
                      styles.stayHeaderTitle
                    }
                  >
                    STAY DETAILS
                  </Text>

                  <Text
                    style={
                      styles.stayHeaderSubtitle
                    }
                  >
                    Your reservation stay
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.nightBadgeNew
                }
              >
                <Text
                  style={
                    styles.nightNumber
                  }
                >
                  {nightCount}
                </Text>

                <Text
                  style={
                    styles.nightLabel
                  }
                >
                  NIGHTS
                </Text>
              </View>
            </View>

            {/* DATE */}

            <View
              style={
                styles.stayDateSection
              }
            >
              <View
                style={
                  styles.stayDateCard
                }
              >
                <View
                  style={
                    styles.dateTopRow
                  }
                >
                  <View
                    style={
                      styles.dateIconCircle
                    }
                  >
                    <Text
                      style={
                        styles.dateIconText
                      }
                    >
                      📅
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.dateType
                    }
                  >
                    ARRIVAL
                  </Text>
                </View>

                <Text
                  style={
                    styles.stayDateValue
                  }
                >
                  {arrivalDate}
                </Text>

                <Text
                  style={
                    styles.stayWeekday
                  }
                >
                  {arrivalWeekday}
                </Text>
              </View>

              <View
                style={
                  styles.stayConnector
                }
              >
                <View
                  style={
                    styles.connectorLine
                  }
                />

                <View
                  style={
                    styles.connectorCircle
                  }
                >
                  <Text
                    style={
                      styles.connectorArrow
                    }
                  >
                    ➜
                  </Text>
                </View>

                <View
                  style={
                    styles.connectorLine
                  }
                />
              </View>

              <View
                style={
                  styles.stayDateCard
                }
              >
                <View
                  style={
                    styles.dateTopRow
                  }
                >
                  <View
                    style={
                      styles.dateIconCircle
                    }
                  >
                    <Text
                      style={
                        styles.dateIconText
                      }
                    >
                      🗓
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.dateType
                    }
                  >
                    DEPARTURE
                  </Text>
                </View>

                <Text
                  style={
                    styles.stayDateValue
                  }
                >
                  {departureDate}
                </Text>

                <Text
                  style={
                    styles.stayWeekday
                  }
                >
                  {departureWeekday}
                </Text>
              </View>
            </View>

            {/* PROPERTY */}

            <View
              style={
                styles.propertySection
              }
            >
              <View
                style={
                  styles.propertyIconBox
                }
              >
                <Text
                  style={
                    styles.propertyIcon
                  }
                >
                  📍
                </Text>
              </View>

              <View
                style={
                  styles.propertyInfo
                }
              >
                <Text
                  style={
                    styles.propertyTitleNew
                  }
                  numberOfLines={3}
                >
                  {propertyName}
                </Text>

                <View
                  style={
                    styles.locationRow
                  }
                >
                  <Text
                    style={
                      styles.locationPin
                    }
                  >
                    ●
                  </Text>

                  <Text
                    style={
                      styles.propertyLocationNew
                    }
                    numberOfLines={1}
                  >
                    {location}
                  </Text>
                </View>

                {tags.length > 0 && (
                  <View style={styles.propertyTagsRow}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={
                        styles.tagsScrollContent
                      }
                    >
                      {tags.map((item, index) => {
                        const iconPath = item?.icon
                          ? item.icon.startsWith('http')
                            ? item.icon
                            : `https://staysereno.in/storage/${item.icon.replace(
                                /^\/+/, '',
                              )}`
                          : null;

                        return (
                          <View
                            key={`${item?.id || item?.tags_id || index}`}
                            style={styles.tagCard}
                          >
                            <View style={styles.tagIconBox}>
                              {iconPath ? (
                                <Image
                                  source={{uri: iconPath}}
                                  style={styles.tagIcon}
                                  resizeMode="contain"
                                />
                              ) : (
                                <Text style={styles.tagFallbackIcon}>
                                  ✓
                                </Text>
                              )}
                            </View>

                            <Text
                              style={styles.tagName}
                              numberOfLines={1}
                            >
                              {getTagName(item) || 'Tag'}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* META */}

            <View
              style={
                styles.metaSection
              }
            >
              <View
                style={
                  styles.metaRow
                }
              >
                <Text
                  style={
                    styles.metaLabel
                  }
                >
                  CHANNEL
                </Text>

                <Text
                  style={
                    styles.metaValue
                  }
                  numberOfLines={2}
                >
                  {channelDisplay}
                </Text>
              </View>

              <View
                style={
                  styles.metaRow
                }
              >
                <Text
                  style={
                    styles.metaLabel
                  }
                >
                  BOOKING ID
                </Text>

                <Text
                  style={
                    styles.metaValue
                  }
                  numberOfLines={2}
                >
                  {bookingId}
                </Text>
              </View>

              <View
                style={
                  styles.metaRow
                }
              >
                <Text
                  style={
                    styles.metaLabel
                  }
                >
                  CHANNEL REF ID
                </Text>

                <Text
                  style={
                    styles.metaValue
                  }
                  numberOfLines={2}
                >
                  {channelRefId}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              PRICE BREAKDOWN
          ================================================= */}

          <View
            style={
              styles.priceBreakdownCard
            }
          >
            <View
              style={
                styles.breakdownHeader
              }
            >
              <View
                style={
                  styles.breakdownIconWrap
                }
              >
                <Text
                  style={
                    styles.breakdownIcon
                  }
                >
                  ▣
                </Text>
              </View>

              <Text
                style={
                  styles.breakdownTitle
                }
              >
                PRICE BREAKDOWN
              </Text>
            </View>

            <View
              style={
                styles.breakdownRows
              }
            >
              <View
                style={
                  styles.breakdownRow
                }
              >
                <Text
                  style={
                    styles.breakdownLabel
                  }
                >
                  Base price (
                  {nightCount || 1}{' '}
                  {nightCount === 1
                    ? 'night'
                    : 'nights'}
                  )
                </Text>

                <Text
                  style={
                    styles.breakdownValue
                  }
                >
                  {baseNightPrice}
                </Text>
              </View>

              {updatedBasePriceRaw !== undefined &&
                updatedBasePriceRaw !== null &&
                updatedBasePriceRaw !== '' && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      Updated base price
                    </Text>

                    <Text style={styles.breakdownValue}>
                      {formatCurrency(updatedBasePriceRaw)}
                    </Text>
                  </View>
                )}

              {isQuotationChannel && (
                <>
                  {quotationSubtotalRaw !== undefined &&
                    quotationSubtotalRaw !== null &&
                    quotationSubtotalRaw !== '' && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Sub Total</Text>
                        <Text style={styles.breakdownValue}>
                          {formatCurrency(quotationSubtotalRaw)}
                        </Text>
                      </View>
                    )}

                  {quotationAddOnDiscountRaw !== undefined &&
                    quotationAddOnDiscountRaw !== null &&
                    quotationAddOnDiscountRaw !== '' && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Add-on Discount</Text>
                        <Text style={styles.breakdownValue}>
                          {formatCurrency(-Math.abs(parseAmount(quotationAddOnDiscountRaw)))}
                        </Text>
                      </View>
                    )}

                  {quotationTotalRaw !== undefined &&
                    quotationTotalRaw !== null &&
                    quotationTotalRaw !== '' && (
                      <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                        <Text style={styles.breakdownTotalLabel}>Total Amount</Text>
                        <Text style={styles.breakdownTotalValue}>
                          {formatCurrency(quotationTotalRaw)}
                        </Text>
                      </View>
                    )}
                </>
              )}

              {hasExtraGuestCharge && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Extra guest charge
                  </Text>
                  <Text style={styles.breakdownValue}>
                    {formatCurrency(extraGuestChargeValue)}
                  </Text>
                </View>
              )}

              {additionalCharges.map((charge, index) => {
                const amount =
                  getAdditionalChargeAmount(charge);

                return (
                  <View
                    key={
                      charge?.id ??
                      charge?.additional_charge_id ??
                      `${index}-${getAdditionalChargeLabel(charge, index)}`
                    }
                    style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      {getAdditionalChargeLabel(charge, index)}
                    </Text>

                    <Text style={styles.breakdownValue}>
                      {amount === undefined || amount === null || amount === ''
                        ? '—'
                        : formatCurrency(parseAmount(amount))}
                    </Text>
                  </View>
                );
              })}

              {hasDiscountAmount && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    {discountCouponCode
                      ? `Discount (${discountCouponCode})`
                      : 'Discount'}
                  </Text>
                  <Text style={styles.breakdownValue}>
                    {formatCurrency(-discountAmountValue)}
                  </Text>
                </View>
              )}

              {hasAppliedCredit && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Applied credit
                  </Text>
                  <Text style={styles.breakdownValue}>
                    {formatCurrency(-appliedCreditValue)}
                  </Text>
                </View>
              )}

              {showConvenienceFee && (
                <>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      Convenience Fee {convenienceTaxRaw ?? ''}%
                    </Text>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(convenienceFeeRaw)}
                    </Text>
                  </View>

                  {totalBeforeTaxRaw !== undefined &&
                    totalBeforeTaxRaw !== null &&
                    totalBeforeTaxRaw !== '' && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Total</Text>
                        <Text style={styles.breakdownValue}>
                          {formatCurrency(totalBeforeTaxRaw)}
                        </Text>
                      </View>
                    )}
                </>
              )}

              <View
                style={
                  styles.breakdownRow
                }
              >
                <Text
                  style={
                    styles.breakdownLabel
                  }
                >
                  GST Amount
                </Text>

                <Text
                  style={
                    styles.breakdownValue
                  }
                >
                  {gstAmount}
                </Text>
              </View>

              <View
                style={[
                  styles.breakdownRow,
                  styles.breakdownTotalRow,
                ]}
              >
                <Text
                  style={
                    styles.breakdownTotalLabel
                  }
                >
                  Guest Total
                </Text>

                <Text
                  style={
                    styles.breakdownTotalValue
                  }
                >
                  {guestTotalBreakdown}
                </Text>
              </View>

              <View
                style={
                  styles.breakdownRow
                }
              >
                <View
                  style={
                    styles.paidRow
                  }
                >
                  <Text
                    style={
                      styles.paidCheck
                    }
                  >
                    ✓
                  </Text>

                  <Text
                    style={
                      styles.breakdownLabel
                    }
                  >
                    Paid
                  </Text>
                </View>

                <Text
                  style={
                    styles.paidValue
                  }
                >
                  {paidAmount}
                </Text>
              </View>

              <View
                style={[
                  styles.breakdownRow,
                  styles.lastBreakdownRow,
                ]}
              >
                <Text
                  style={
                    styles.breakdownLabel
                  }
                >
                  Pending
                </Text>

                <Text
                  style={
                    styles.pendingValue
                  }
                >
                  {pendingAmount}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              BOOKING NOTES
          ================================================= */}

          {!!bookingNotes && (
            <View
              style={
                styles.notesCard
              }
            >
              <View
                style={
                  styles.notesHeader
                }
              >
                <Text
                  style={
                    styles.notesIcon
                  }
                >
                  ✦
                </Text>

                <Text
                  style={
                    styles.notesTitle
                  }
                >
                  BOOKING NOTES
                </Text>
              </View>

              <Text
                style={
                  styles.notesText
                }
              >
                {bookingNotes}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default BookingDetail;

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },

  container: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },

  scrollContent: {
    paddingHorizontal: wp(4),
  },

  /* =======================================================
     RESERVATION
  ======================================================= */

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#5F7D72',
    marginBottom: hp(1.2),
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },

  bookingTitle: {
    flex: 1,
    fontSize: 25,
    fontWeight: '800',
    color: '#1D2F2B',
    marginRight: 10,
  },

  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DFF7EC',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1DBA78',
    marginRight: 6,
  },

  confirmedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D8C5A',
  },

  createdText: {
    fontSize: 11,
    color: '#6E8A81',
    marginBottom: hp(2.2),
  },

  /* =======================================================
     PRICE CARDS
  ======================================================= */

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 8,
    marginBottom: hp(1.5),
  },

  priceCard: {
    width: '31%',
    minHeight: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 9,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D7E5E1',
    justifyContent: 'center',
  },

  priceCardTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6E8E86',
    letterSpacing: 0.3,
    marginBottom: 5,
  },

  priceCardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D2E2A',
  },

  paidCardValue: {
    color: '#17B978',
  },

  pendingCardValue: {
    color: '#D94E4E',
  },

  /* =======================================================
     COMMON CARD
  ======================================================= */

  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEAE5',
    overflow: 'hidden',
    marginBottom: hp(2.2),
  },

  cardHeader: {
    backgroundColor: '#EAF4F1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEAE5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardHeaderIcon: {
    fontSize: 15,
    color: '#4E8C7A',
    marginRight: 8,
  },

  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#4E7F71',
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  /* =======================================================
     GUEST
  ======================================================= */

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#17B978',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  guestInfo: {
    flex: 1,
  },

  guestName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E2E2B',
    textTransform: 'capitalize',
  },

  primaryGuest: {
    fontSize: 11,
    color: '#6E8A81',
    marginTop: 3,
  },

  horizontalLine: {
    height: 1,
    backgroundColor: '#E8EFEA',
    marginVertical: 15,
  },

  rowBlock: {
    marginBottom: 13,
  },

  smallLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6E8E86',
    marginBottom: 5,
    textTransform: 'uppercase',
  },

  detailValue: {
    fontSize: 13,
    color: '#243632',
    fontWeight: '600',
  },

  twoColumnRow: {
    flexDirection: 'row',
    marginTop: 3,
  },

  halfColumn: {
    flex: 1,
  },

  /* =======================================================
     STAY CARD
  ======================================================= */

  stayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCEAE5',
    overflow: 'hidden',
    marginBottom: hp(2.2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  stayHeader: {
    backgroundColor: '#EAF7F2',
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DCEAE5',
  },

  stayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  stayHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderWidth: 1,
    borderColor: '#D7EBE3',
  },

  stayHeaderIconText: {
    fontSize: 20,
  },

  stayHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#326F5E',
  },

  stayHeaderSubtitle: {
    fontSize: 10,
    color: '#7A9990',
    marginTop: 3,
  },

  nightBadgeNew: {
    minWidth: 58,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#17B978',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },

  nightNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },

  nightLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 2,
  },

  /* =======================================================
     DATES
  ======================================================= */

  stayDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 15,
  },

  stayDateCard: {
    flex: 1,
    backgroundColor: '#F5FAF8',
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E0EEE9',
  },

  dateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  dateIconCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#DDF6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  dateIconText: {
    fontSize: 14,
  },

  dateType: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6C8B82',
  },

  stayDateValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D302B',
  },

  stayWeekday: {
    fontSize: 10,
    color: '#78938B',
    marginTop: 3,
  },

  stayConnector: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectorLine: {
    width: 10,
    height: 1,
    backgroundColor: '#C8DDD6',
  },

  connectorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },

  connectorArrow: {
    fontSize: 14,
    color: '#0F9A62',
    fontWeight: '900',
  },

  /* =======================================================
     PROPERTY
  ======================================================= */

  propertySection: {
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E4EEEA',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  propertyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E4F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  propertyIcon: {
    fontSize: 18,
  },

  propertyInfo: {
    flex: 1,
  },

  propertyTitleNew: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#213631',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  locationPin: {
    fontSize: 8,
    color: '#17B978',
    marginRight: 6,
  },

  propertyLocationNew: {
    flex: 1,
    fontSize: 11,
    color: '#718C84',
  },

  propertyTagsRow: {
    marginTop: 8,
    maxWidth: '100%',
  },

  /* =======================================================
     BOOKING INFO
  ======================================================= */

  infoSection: {
    paddingHorizontal: 14,
    paddingTop: 17,
    paddingBottom: 5,
  },

  infoSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#78938B',
    marginBottom: 10,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  infoItem: {
    width: '50%',
    paddingRight: 8,
    marginBottom: 13,
  },

  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#79958C',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#294139',
  },

  /* =======================================================
     META
  ======================================================= */

  metaSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
  },

  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6F8B82',
    textTransform: 'uppercase',
  },

  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#213831',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },

  /* =======================================================
     PRICE BREAKDOWN
  ======================================================= */

  priceBreakdownCard: {
    backgroundColor: '#F9FCFB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7EDE5',
    overflow: 'hidden',
    marginBottom: hp(2.2),
  },

  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7F2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D7EDE5',
  },

  breakdownIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#DFF6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  breakdownIcon: {
    fontSize: 12,
    color: '#16B77A',
  },

  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#2F6B5D',
  },

  breakdownRows: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
  },

  lastBreakdownRow: {
    borderBottomWidth: 0,
  },

  breakdownLabel: {
    fontSize: 12,
    color: '#405B55',
  },

  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2E2B',
  },

  breakdownTotalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDEAE5',
  },

  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B2F2A',
  },

  breakdownTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D2E2A',
  },

  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  paidCheck: {
    fontSize: 12,
    color: '#17B978',
    marginRight: 8,
    fontWeight: '900',
  },

  paidValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17B978',
  },

  pendingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D94E4E',
  },

  /* =======================================================
     NOTES
  ======================================================= */

  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCEAE5',
    marginBottom: hp(3),
    overflow: 'hidden',
  },

  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#EAF7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#DCEAE5',
  },

  notesIcon: {
    color: '#17B978',
    fontSize: 14,
    marginRight: 8,
  },

  notesTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#326F5E',
  },

  notesText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#405B55',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  tagsCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#DCEAE5',
  overflow: 'hidden',
  marginBottom: hp(2.2),
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 8,
},

tagsHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#EAF7F2',
  paddingHorizontal: 16,
  paddingVertical: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#DCEAE5',
},

tagsIconWrap: {
  width: 42,
  height: 42,
  borderRadius: 13,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 11,
  borderWidth: 1,
  borderColor: '#D7EBE3',
},

tagsHeaderIcon: {
  fontSize: 20,
  color: '#17B978',
},

tagsTitle: {
  fontSize: 13,
  fontWeight: '800',
  letterSpacing: 0.6,
  color: '#326F5E',
},

tagsSubtitle: {
  fontSize: 10,
  color: '#7A9990',
  marginTop: 3,
},

tagsContent: {
  paddingHorizontal: 12,
  paddingTop: 10,
  paddingBottom: 10,
},

tagsScrollContent: {
  paddingRight: 16,
},

tagCard: {
  minWidth: 58,
  height: 30,
  backgroundColor: '#EAF9F2',
  borderRadius: 16,
  marginRight: 8,
  paddingHorizontal: 9,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},

tagIconBox: {
  width: 18,
  height: 18,
  borderRadius: 9,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 5,
},

tagIcon: {
  width: 14,
  height: 14,
},

tagFallbackIcon: {
  fontSize: 12,
  fontWeight: '800',
  color: '#17B978',
},

tagName: {
  fontSize: 10,
  lineHeight: 12,
  fontWeight: '600',
  color: '#159B68',
  textAlign: 'left',
},
});