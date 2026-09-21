import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

// ======================================================
// RESPONSIVE
// ======================================================

const {width, height} = Dimensions.get('window');

const wp = value => (width * value) / 100;
const hp = value => (height * value) / 100;

// ======================================================
// COLORS
// ======================================================

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F4F8F5';

// ======================================================
// PROPERTY DATA
// ======================================================

const propertyOptions = [
  'All properties',
  'Sereno Horizon 3bhk Penthouse pvt jacuzzi rooftop',
  'Sereno Foresta cosy 1 bhk greenery view w/pool+game',
  'Sereno Blossom - luxury 1bhk w/pool near Baga',
];

const bookingProperties = propertyOptions.slice(1);

// ======================================================
// DATE DATA
// ======================================================

const dateSets = {
  Today: {
    checkin: [
      '21 September 2026',
      '21 September 2026',
    ],

    checkout: [
      '23 September 2026',
      '24 September 2026',
    ],
  },

  Tomorrow: {
    checkin: [
      '22 September 2026',
      '22 September 2026',
    ],

    checkout: [
      '25 September 2026',
      '26 September 2026',
    ],
  },

  'Next 7 days': {
    checkin: [
      '24 September 2026',
      '26 September 2026',
    ],

    checkout: [
      '27 September 2026',
      '30 September 2026',
    ],
  },
};

// ======================================================
// CREATE BOOKINGS
// ======================================================

const createBookings = (
  dateFilter,
  count = 20,
) =>
  Array.from(
    {length: count},
    (_, index) => {
      const propertyIndex =
        index % bookingProperties.length;

      const isPending =
        index % 4 === 1;

      const dates =
        dateSets[dateFilter];

      const isDeparture =
        index % 2 !== 0;

      return {
        bookingId:
          `${dateFilter}-${index + 1}`,

        location: [
          'ASSAGAO, GOA',
          'ANJUNA, GOA',
          'SIOLIM, GOA',
        ][index % 3],

        property:
          bookingProperties[propertyIndex],

        guest: [
          'Kushal Garg',
          'Maya Shah',
          'Arjun Mehta',
          'Rhea Kapoor',
        ][index % 4],

        guests:
          `${4 + (index % 6)} adults`,

        adults:
          4 + (index % 6),

        children:
          index % 3,

        phone:
          '+91 7259442216',

        email:
          'Unknown',

        status:
          isPending
            ? 'PENDING'
            : 'CONFIRMED',

        statusType:
          isPending
            ? 'pending'
            : 'confirmed',

        dateFilter,

        checkin_date:
          dates.checkin[
            index %
              dates.checkin.length
          ],

        checkout_date:
          dates.checkout[
            index %
              dates.checkout.length
          ],

        // =================================================
        // CHANNEL
        // =================================================

        channel:
          index % 2 === 0
            ? 'Central Reservation System'
            : 'Airbnb Content',

        type:
          isDeparture
            ? 'departure'
            : 'arrival',
      };
    },
  );

// ======================================================
// ALL BOOKINGS
// ======================================================

const bookings = [
  ...createBookings(
    'Today',
    60,
  ),

  ...createBookings(
    'Tomorrow',
    60,
  ),

  ...createBookings(
    'Next 7 days',
    60,
  ),
];

// ======================================================
// BOOKING CARD
// ======================================================

const BookingCard = memo(
  ({
    item,
    onPress,
  }) => {
    const isPending =
      item.statusType ===
      'pending';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.bookingCard}
        onPress={() =>
          onPress(item)
        }>

        {/* ========================================= */}
        {/* CARD TOP */}
        {/* ========================================= */}

        <View
          style={
            styles.bookingTopRow
          }>

          {/* ICON */}

          <View
            style={[
              styles.propertyIcon,

              isPending &&
                styles.propertyIconPending,
            ]}>

            <Text
              style={[
                styles.homeIcon,

                isPending &&
                  styles.homeIconPending,
              ]}>

              ⌂

            </Text>

          </View>

          {/* CONTENT */}

          <View
            style={
              styles.bookingContent
            }>

            {/* LOCATION */}

            <Text
              style={
                styles.location
              }
              numberOfLines={1}>

              {item.location}

            </Text>

            {/* PROPERTY */}

            <Text
              style={
                styles.propertyName
              }
              numberOfLines={1}>

              {item.property}

            </Text>

            {/* GUEST */}

            <View
              style={
                styles.guestRow
              }>

              <Text
                style={
                  styles.peopleIcon
                }>

                ♧

              </Text>

              <Text
                style={
                  styles.guestText
                }
                numberOfLines={1}>

                {item.guest} · {item.guests}

              </Text>

            </View>

          </View>

          {/* ================================================= */}
          {/* CHANNEL - STATUS KI JAGAH */}
          {/* ================================================= */}

          <View
            style={
              styles.channelContainer
            }>

            <Text
              style={
                styles.channelLabel
              }
              numberOfLines={1}>

              CHANNEL

            </Text>

            <Text
              style={
                styles.channelText
              }
              numberOfLines={2}>

              {item.channel || '—'}

            </Text>

          </View>

        </View>

        {/* ========================================= */}
        {/* CARD FOOTER */}
        {/* ========================================= */}

        <View
          style={
            styles.bookingFooter
          }>

          {/* CHECK IN */}

          <View
            style={
              styles.dateGroup
            }>

            <Text
              style={
                styles.dateLabel
              }>

              CHECK-IN

            </Text>

            <Text
              style={
                styles.dateValue
              }
              numberOfLines={1}>

              {item.checkin_date}

            </Text>

          </View>

          {/* ARROW */}

          <View
            style={
              styles.dateArrowContainer
            }>

            <View
              style={
                styles.dateArrowCircle
              }>

              <Text
                style={
                  styles.dateArrow
                }>

                ›

              </Text>

            </View>

          </View>

          {/* CHECK OUT */}

          <View
            style={[
              styles.dateGroup,

              styles.dateGroupLast,
            ]}>

            <Text
              style={
                styles.dateLabel
              }>

              CHECK-OUT

            </Text>

            <Text
              style={[
                styles.dateValue,

                styles.dateValueRight,
              ]}
              numberOfLines={1}>

              {item.checkout_date}

            </Text>

          </View>

        </View>

      </TouchableOpacity>
    );
  },
);

// ======================================================
// DASHBOARD
// ======================================================

const DashboardScreen = ({
  navigation,
}) => {

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'arrivals',
  );

  const [
    dateFilter,
    setDateFilter,
  ] = useState(
    'Today',
  );

  const [
    selectedProperty,
    setSelectedProperty,
  ] = useState(
    'All properties',
  );

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(20);

  // ====================================================
  // TAB CHANGE
  // ====================================================

  const selectTab =
    useCallback(tab => {

      setActiveTab(
        currentTab => {
          if (
            currentTab ===
            tab
          ) {
            return currentTab;
          }

          return tab;
        },
      );

      setVisibleCount(20);

    }, []);

  // ====================================================
  // DATE FILTER
  // ====================================================

  const selectDateFilter =
    useCallback(filter => {

      setDateFilter(
        currentFilter => {
          if (
            currentFilter ===
            filter
          ) {
            return currentFilter;
          }

          return filter;
        },
      );

      setVisibleCount(20);

    }, []);

  // ====================================================
  // OPEN BOOKING DETAIL
  // ====================================================

  const openBookingDetail =
    useCallback(
      item => {

        navigation.navigate(
          'DashboardDetail',
          {
            booking: {

              id:
                item.bookingId,

              bookingId:
                item.bookingId,

              booking_id:
                item.bookingId,

              customerName:
                item.guest,

              customer_name:
                item.guest,

              guest_name:
                item.guest,

              property_name:
                item.property,

              propertyName:
                item.property,

              location:
                item.location,

              status:
                item.status,

              channel:
                item.channel,

              phone:
                item.phone,

              guest_phone:
                item.phone,

              email:
                item.email,

              guest_email:
                item.email,

              adults:
                item.adults,

              adult_count:
                item.adults,

              children:
                item.children,

              child_count:
                item.children,

              checkin_date:
                item.checkin_date,

              checkout_date:
                item.checkout_date,

              startDate:
                item.checkin_date,

              endDate:
                item.checkout_date,

              start_date:
                item.checkin_date,

              end_date:
                item.checkout_date,
            },
          },
        );

      },
      [navigation],
    );

  // ====================================================
  // FILTERED DATA
  // ====================================================

  const filteredBookings =
    useMemo(() => {

      const result = [];

      for (
        let i = 0;
        i < bookings.length;
        i++
      ) {

        const item =
          bookings[i];

        // DATE

        if (
          item.dateFilter !==
          dateFilter
        ) {
          continue;
        }

        // PROPERTY

        if (
          selectedProperty !==
            'All properties' &&
          item.property !==
            selectedProperty
        ) {
          continue;
        }

        // ARRIVALS

        if (
          activeTab ===
            'arrivals' &&
          item.type !==
            'arrival'
        ) {
          continue;
        }

        // DEPARTURES

        if (
          activeTab ===
            'departures' &&
          item.type !==
            'departure'
        ) {
          continue;
        }

        // OCCUPANCY

        if (
          activeTab ===
            'occupancy' &&
          item.status !==
            'CONFIRMED'
        ) {
          continue;
        }

        result.push(item);
      }

      return result;

    }, [
      activeTab,
      dateFilter,
      selectedProperty,
    ]);

  // ====================================================
  // VISIBLE DATA
  // ====================================================

  const visibleBookings =
    useMemo(
      () =>
        filteredBookings.slice(
          0,
          visibleCount,
        ),
      [
        filteredBookings,
        visibleCount,
      ],
    );

  // ====================================================
  // LOAD MORE
  // ====================================================

  const handleLoadMore =
    useCallback(() => {

      if (
        visibleCount >=
        filteredBookings.length
      ) {
        return;
      }

      setVisibleCount(
        currentCount =>
          Math.min(
            currentCount + 10,
            filteredBookings.length,
          ),
      );

    }, [
      visibleCount,
      filteredBookings.length,
    ]);

  // ====================================================
  // RENDER BOOKING
  // ====================================================

  const renderBooking =
    useCallback(
      ({item}) => (
        <BookingCard
          item={item}
          onPress={
            openBookingDetail
          }
        />
      ),
      [
        openBookingDetail,
      ],
    );

  // ====================================================
  // EMPTY STATE
  // ====================================================

  const renderEmpty =
    useCallback(
      () => (
        <View
          style={
            styles.emptyContainer
          }>

          <View
            style={
              styles.emptyIconCircle
            }>

            <Text
              style={
                styles.emptyIcon
              }>

              ✓

            </Text>

          </View>

          <Text
            style={
              styles.emptyTitle
            }>

            No bookings found

          </Text>

          <Text
            style={
              styles.emptyText
            }>

            There are no bookings
            available for this
            selection.

          </Text>

        </View>
      ),
      [],
    );

  // ====================================================
  // HEADER
  // ====================================================

  const renderHeader =
    useCallback(
      () => (
        <View>

          {/* ========================================= */}
          {/* TOP TABS */}
          {/* ========================================= */}

          <View
            style={
              styles.topTabs
            }>

            {/* ARRIVALS */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectTab(
                  'arrivals',
                )
              }
              style={[
                styles.topTab,

                activeTab ===
                  'arrivals' &&
                  styles.activeTopTab,
              ]}>

              <Text
                style={[
                  styles.topTabText,

                  activeTab ===
                    'arrivals' &&
                    styles.activeTopTabText,
                ]}>

                Arrivals

              </Text>

            </TouchableOpacity>

            {/* DEPARTURES */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectTab(
                  'departures',
                )
              }
              style={[
                styles.topTab,

                activeTab ===
                  'departures' &&
                  styles.activeTopTab,
              ]}>

              <Text
                style={[
                  styles.topTabText,

                  activeTab ===
                    'departures' &&
                    styles.activeTopTabText,
                ]}>

                Departures

              </Text>

            </TouchableOpacity>

            {/* OCCUPANCY */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectTab(
                  'occupancy',
                )
              }
              style={[
                styles.topTab,

                activeTab ===
                  'occupancy' &&
                  styles.activeTopTab,
              ]}>

              <Text
                style={[
                  styles.topTabText,

                  activeTab ===
                    'occupancy' &&
                    styles.activeTopTabText,
                ]}>

                Occupancy

              </Text>

            </TouchableOpacity>

          </View>

          {/* ========================================= */}
          {/* DATE FILTERS */}
          {/* ========================================= */}

          <View
            style={
              styles.dateFilters
            }>

            {/* TODAY */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectDateFilter(
                  'Today',
                )
              }
              style={[
                styles.dateFilter,

                dateFilter ===
                  'Today' &&
                  styles.activeDateFilter,
              ]}>

              <Text
                style={[
                  styles.dateFilterText,

                  dateFilter ===
                    'Today' &&
                    styles.activeDateFilterText,
                ]}>

                Today

              </Text>

            </TouchableOpacity>

            {/* TOMORROW */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectDateFilter(
                  'Tomorrow',
                )
              }
              style={[
                styles.dateFilter,

                dateFilter ===
                  'Tomorrow' &&
                  styles.activeDateFilter,
              ]}>

              <Text
                style={[
                  styles.dateFilterText,

                  dateFilter ===
                    'Tomorrow' &&
                    styles.activeDateFilterText,
                ]}>

                Tomorrow

              </Text>

            </TouchableOpacity>

            {/* NEXT 7 DAYS */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                selectDateFilter(
                  'Next 7 days',
                )
              }
              style={[
                styles.dateFilter,

                dateFilter ===
                  'Next 7 days' &&
                  styles.activeDateFilter,
              ]}>

              <Text
                style={[
                  styles.dateFilterText,

                  dateFilter ===
                    'Next 7 days' &&
                    styles.activeDateFilterText,
                ]}>

                Next 7 days

              </Text>

            </TouchableOpacity>

          </View>


        </View>
      ),
      [
        activeTab,
        dateFilter,
        filteredBookings.length,
        selectTab,
        selectDateFilter,
      ],
    );

  // ====================================================
  // FOOTER
  // ====================================================

  const renderFooter =
    useCallback(() => {

      if (
        visibleCount >=
        filteredBookings.length
      ) {
        return null;
      }

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={
            handleLoadMore
          }
          style={
            styles.loadMoreButton
          }>

          <Text
            style={
              styles.loadMoreText
            }>

            Load more

          </Text>

        </TouchableOpacity>
      );

    }, [
      visibleCount,
      filteredBookings.length,
      handleLoadMore,
    ]);

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <View
      style={
        styles.container
      }>

      <FlatList

        data={
          visibleBookings
        }

        keyExtractor={item =>
          `${item.bookingId}-${item.dateFilter}`
        }

        renderItem={
          renderBooking
        }

        ListHeaderComponent={
          renderHeader
        }

        ListEmptyComponent={
          renderEmpty
        }

        ListFooterComponent={
          renderFooter
        }

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.listContent
        }

        onEndReached={
          handleLoadMore
        }

        onEndReachedThreshold={
          0.5
        }

        keyboardShouldPersistTaps="handled"

        removeClippedSubviews={
          true
        }

        initialNumToRender={
          6
        }

        maxToRenderPerBatch={
          6
        }

        updateCellsBatchingPeriod={
          30
        }

        windowSize={
          5
        }

      />

    </View>
  );
};

export default DashboardScreen;

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ====================================================
  // CONTAINER
  // ====================================================

  container: {
    flex: 1,

    backgroundColor:
      BACKGROUND,
  },

  listContent: {
    paddingHorizontal:
      wp(4.5),

    paddingTop:
      hp(2),

    paddingBottom:
      hp(4),
  },

  // ====================================================
  // TOP TABS
  // ====================================================

  topTabs: {
    flexDirection:
      'row',

    alignItems:
      'center',

    marginBottom:
      hp(1.6),
  },

  topTab: {
    height:
      hp(4.6),

    paddingHorizontal:
      wp(3.2),

    borderRadius:
      hp(3),

    backgroundColor:
      '#FFFFFF',

    justifyContent:
      'center',

    marginRight:
      wp(1.5),

    borderWidth:
      1,

    borderColor:
      '#E3EBE6',
  },

  activeTopTab: {
    backgroundColor:
      '#164B38',

    borderColor:
      '#164B38',
  },

  topTabText: {
    fontSize:
      wp(2.75),

    fontWeight:
      '700',

    color:
      '#7E8B84',
  },

  activeTopTabText: {
    color:
      '#FFFFFF',
  },

  // ====================================================
  // DATE FILTERS
  // ====================================================

  dateFilters: {
    flexDirection:
      'row',

    alignItems:
      'center',

    marginBottom:
      hp(1.5),
  },

  dateFilter: {
    paddingHorizontal:
      wp(3.2),

    height:
      hp(4.1),

    borderRadius:
      hp(3),

    justifyContent:
      'center',

    marginRight:
      wp(1.5),
  },

  activeDateFilter: {
    backgroundColor:
      '#DDF4E8',
  },

  dateFilterText: {
    fontSize:
      wp(3),

    fontWeight:
      '600',

    color:
      '#87958E',
  },

  activeDateFilterText: {
    color:
      PRIMARY,
  },

  // ====================================================
  // RESULT HEADER
  // ====================================================

  resultHeader: {
    flexDirection:
      'row',

    alignItems:
      'center',

    justifyContent:
      'space-between',

    marginBottom:
      hp(1.2),

    paddingHorizontal:
      wp(0.5),
  },

  resultTitle: {
    fontSize:
      wp(2.45),

    fontWeight:
      '800',

    letterSpacing:
      wp(0.35),

    color:
      '#87958F',
  },

  resultCountCircle: {
    minWidth:
      wp(7),

    height:
      wp(7),

    borderRadius:
      wp(3.5),

    backgroundColor:
      '#DDF4E8',

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  resultCount: {
    color:
      PRIMARY,

    fontSize:
      wp(2.5),

    fontWeight:
      '800',

    textAlign:
      'center',
  },

  // ====================================================
  // BOOKING CARD
  // ====================================================

  bookingCard: {
    backgroundColor:
      '#FFFFFF',

    borderRadius:
      wp(3.5),

    marginBottom:
      hp(1.1),

    paddingHorizontal:
      wp(3),

    paddingVertical:
      hp(1.25),

    borderWidth:
      1,

    borderColor:
      '#E3EAE6',

    shadowColor:
      '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity:
      0.035,

    shadowRadius:
      5,

    elevation:
      1,
  },

  // ====================================================
  // CARD TOP
  // ====================================================

  bookingTopRow: {
    width:
      '100%',

    flexDirection:
      'row',

    alignItems:
      'center',

    minHeight:
      hp(7),
  },

  // ====================================================
  // PROPERTY ICON
  // ====================================================

  propertyIcon: {
    width:
      wp(10),

    height:
      wp(10),

    borderRadius:
      wp(3),

    backgroundColor:
      '#DDF5E8',

    alignItems:
      'center',

    justifyContent:
      'center',

    flexShrink:
      0,
  },

  propertyIconPending: {
    backgroundColor:
      '#FFF0CF',
  },

  homeIcon: {
    fontSize:
      wp(5.5),

    color:
      '#15965F',

    lineHeight:
      wp(6),
  },

  homeIconPending: {
    color:
      '#C8880A',
  },

  // ====================================================
  // CARD CONTENT
  // ====================================================

  bookingContent: {
    flex:
      1,

    marginLeft:
      wp(2.5),

    marginRight:
      wp(1.5),

    minWidth:
      0,
  },

  location: {
    fontSize:
      wp(2.3),

    fontWeight:
      '800',

    letterSpacing:
      wp(0.3),

    color:
      '#82918A',

    marginBottom:
      hp(0.25),
  },

  propertyName: {
    fontSize:
      wp(3.15),

    lineHeight:
      hp(1.95),

    fontWeight:
      '600',

    color:
      '#27342F',
  },

  guestRow: {
    flexDirection:
      'row',

    alignItems:
      'center',

    marginTop:
      hp(0.45),
  },

  peopleIcon: {
    fontSize:
      wp(3.2),

    color:
      '#91A09A',

    marginRight:
      wp(1),
  },

  guestText: {
    flex:
      1,

    fontSize:
      wp(2.3),

    color:
      '#8A9791',

    fontWeight:
      '500',
  },

  // ====================================================
  // CHANNEL
  // ====================================================

  channelContainer: {
    alignItems:
      'flex-end',

    justifyContent:
      'center',

    maxWidth:
      wp(30),

    minWidth:
      wp(21),

    alignSelf:
      'flex-start',

    marginTop:
      hp(0.1),
  },

  channelLabel: {
    fontSize:
      wp(1.9),

    fontWeight:
      '800',

    letterSpacing:
      wp(0.15),

    color:
      '#9AA7A1',

    marginBottom:
      hp(0.3),

    textAlign:
      'right',
  },

  channelText: {
    fontSize:
      wp(2.25),

    fontWeight:
      '700',

    color:
      '#586A62',

    textAlign:
      'right',

    lineHeight:
      hp(1.65),
  },

  // ====================================================
  // CARD FOOTER
  // ====================================================

  bookingFooter: {
    width:
      '100%',

    flexDirection:
      'row',

    alignItems:
      'center',

    marginTop:
      hp(1),

    paddingTop:
      hp(0.8),

    borderTopWidth:
      1,

    borderTopColor:
      '#EDF2EF',
  },

  dateGroup: {
    flex:
      1,

    alignItems:
      'flex-start',

    minWidth:
      0,
  },

  dateGroupLast: {
    alignItems:
      'flex-end',
  },

  dateLabel: {
    fontSize:
      wp(1.9),

    fontWeight:
      '800',

    letterSpacing:
      wp(0.15),

    color:
      '#9AA7A1',
  },

  dateValue: {
    fontSize:
      wp(2.2),

    fontWeight:
      '600',

    color:
      '#586A62',

    marginTop:
      hp(0.15),

    maxWidth:
      '100%',
  },

  dateValueRight: {
    textAlign:
      'right',
  },

  // ====================================================
  // DATE ARROW
  // ====================================================

  dateArrowContainer: {
    width:
      wp(9),

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  dateArrowCircle: {
    width:
      wp(6),

    height:
      wp(6),

    borderRadius:
      wp(3),

    backgroundColor:
      '#F0F5F2',

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  dateArrow: {
    fontSize:
      wp(5),

    lineHeight:
      wp(5.5),

    fontWeight:
      '700',

    color:
      '#7B8B84',

    marginTop:
      -wp(0.5),
  },

  // ====================================================
  // EMPTY
  // ====================================================

  emptyContainer: {
    backgroundColor:
      '#FFFFFF',

    borderRadius:
      wp(4),

    paddingVertical:
      hp(5),

    paddingHorizontal:
      wp(7),

    alignItems:
      'center',

    marginTop:
      hp(1),
  },

  emptyIconCircle: {
    width:
      wp(15),

    height:
      wp(15),

    borderRadius:
      wp(7.5),

    backgroundColor:
      '#DDF4E8',

    alignItems:
      'center',

    justifyContent:
      'center',

    marginBottom:
      hp(1.5),
  },

  emptyIcon: {
    fontSize:
      wp(6),

    color:
      PRIMARY,

    fontWeight:
      '800',
  },

  emptyTitle: {
    fontSize:
      wp(4),

    fontWeight:
      '700',

    color:
      DARK,
  },

  emptyText: {
    fontSize:
      wp(3),

    color:
      '#89958F',

    textAlign:
      'center',

    marginTop:
      hp(0.8),

    lineHeight:
      hp(2.2),
  },

  // ====================================================
  // LOAD MORE
  // ====================================================

  loadMoreButton: {
    height:
      hp(5),

    borderRadius:
      hp(3),

    backgroundColor:
      '#FFFFFF',

    borderWidth:
      1,

    borderColor:
      '#DCE6E0',

    alignItems:
      'center',

    justifyContent:
      'center',

    marginTop:
      hp(0.5),

    marginBottom:
      hp(1),
  },

  loadMoreText: {
    fontSize:
      wp(3),

    fontWeight:
      '700',

    color:
      PRIMARY,
  },

});