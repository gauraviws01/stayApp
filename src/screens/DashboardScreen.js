import React, {useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import PropertyDropdown from '../components/PropertyDropdown';


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

const propertyOptions = [
  'All properties',
  'Sereno Horizon 3bhk Penthouse pvt jacuzzi rooftop',
  'Sereno Foresta cosy 1 bhk greenery view w/pool+game',
  'Sereno Blossom - luxury 1bhk w/pool near Baga',
];

const bookingProperties = propertyOptions.slice(1);
const fallbackPropertyOptions = propertyOptions.slice(1);

const dateSets = {
  Today: {
    checkin: ['21 September 2026', '21 September 2026'],
    checkout: ['23 September 2026', '24 September 2026'],
  },
  Tomorrow: {
    checkin: ['22 September 2026', '22 September 2026'],
    checkout: ['25 September 2026', '26 September 2026'],
  },
  'Next 7 days': {
    checkin: ['24 September 2026', '26 September 2026'],
    checkout: ['27 September 2026', '30 September 2026'],
  },
};

const createBookings = (dateFilter, count = 20) =>
  Array.from({length: count}, (_, index) => {
    const propertyIndex = index % bookingProperties.length;
    const isPending = index % 4 === 1;
    const dates = dateSets[dateFilter];

    return {
      bookingId: `${dateFilter}-${index + 1}`,
      location: ['ASSAGAO, GOA', 'ANJUNA, GOA', 'SIOLIM, GOA'][index % 3],
      property: bookingProperties[propertyIndex],
      guest: ['Kushal Garg', 'Maya Shah', 'Arjun Mehta', 'Rhea Kapoor'][index % 4],
      guests: `${4 + (index % 6)} adults`,
      adults: 4 + (index % 6),
      children: index % 3,
      phone: '+91 7259442216',
      email: 'Unknown',
      status: isPending ? 'PENDING' : 'CONFIRMED',
      statusType: isPending ? 'pending' : 'confirmed',
      dateFilter,
      checkin_date: dates.checkin[index % dates.checkin.length],
      checkout_date: dates.checkout[index % dates.checkout.length],
      channel: index % 2 === 0 ? 'Central Reservation System' : 'Airbnb Content',
      type: index % 2 === 0 ? 'arrival' : 'departure',
    };
  });

const bookings = [
  ...createBookings('Today', 60),
  ...createBookings('Tomorrow', 60),
  ...createBookings('Next 7 days', 60),
];


// ======================================================
// DASHBOARD
// ======================================================

const DashboardScreen = ({navigation, route}) => {

  const [activeTab, setActiveTab] = useState('arrivals');

  const [dateFilter, setDateFilter] = useState('Today');

  const [selectedProperty, setSelectedProperty] = useState('All properties');

  const [visibleCount, setVisibleCount] = useState(20);


  // ====================================================
  // OPEN BOOKING DETAIL
  // ====================================================

  const openBookingDetail = item => {

    navigation.navigate('DashboardDetail', {
      booking: {
        id: item.bookingId,

        bookingId: item.bookingId,

        booking_id: item.bookingId,

        customerName: item.guest,

        customer_name: item.guest,

        guest_name: item.guest,

        property_name: item.property,

        propertyName: item.property,

        location: item.location,

        status: item.status,

        channel: item.channel,

        phone: item.phone,

        guest_phone: item.phone,

        email: item.email,

        guest_email: item.email,

        adults: item.adults,

        adult_count: item.adults,

        children: item.children,

        child_count: item.children,

        checkin_date: item.checkin_date,

        checkout_date: item.checkout_date,

        startDate: item.checkin_date,

        endDate: item.checkout_date,

        start_date: item.checkin_date,

        end_date: item.checkout_date,
      },
    });

  };


  // ====================================================
  // BOOKING CARD
  // ====================================================

  const renderBooking = item => {

    return (
      <TouchableOpacity
        key={`${item.bookingId}-${item.date}`}
        activeOpacity={0.85}
        style={styles.bookingCard}
        onPress={() => openBookingDetail(item)}>


        <View style={styles.bookingTopRow}>
          <View
            style={[
              styles.propertyIcon,
              item.statusType === 'pending' && styles.propertyIconPending,
            ]}>
            <Text
              style={[
                styles.homeIcon,
                item.statusType === 'pending' && styles.homeIconPending,
              ]}>
              ⌂
            </Text>
          </View>

          <View style={styles.bookingContent}>
            <View style={styles.bookingSourceRow}>
              <View
                style={[
                  styles.statusPill,
                  item.statusType === 'pending' && styles.pendingPill,
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    item.statusType === 'pending' && styles.pendingText,
                  ]}
                  numberOfLines={1}>
                  {item.channel}
                </Text>
              </View>
            </View>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.propertyName} numberOfLines={3}>
              {item.property}
            </Text>

            <View style={styles.guestRow}>
              <Text style={styles.peopleIcon}>♧</Text>
              <Text style={styles.guestText}>
                {item.guest} · {item.guests}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.dateSummary}>
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>CHECK-IN</Text>
              <Text style={styles.dateValue}>{item.checkin_date}</Text>
            </View>
            <View style={styles.dateGroupLast}>
              <Text style={styles.dateLabel}>CHECK-OUT</Text>
              <Text style={styles.dateValue}>{item.checkout_date}</Text>
            </View>
          </View>

        </View>

      </TouchableOpacity>
    );
  };

  const filteredBookings = bookings.filter(
    item =>
      item.dateFilter === dateFilter &&
      (selectedProperty === 'All properties' ||
        item.property === selectedProperty),
  );

  const visibleBookings = filteredBookings.slice(0, visibleCount);

  const loadMoreBookings = event => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 160;

    if (isNearBottom && visibleCount < filteredBookings.length) {
      setVisibleCount(currentCount =>
        Math.min(currentCount + 10, filteredBookings.length),
      );
    }
  };

  const selectDateFilter = filter => {
    setDateFilter(filter);
    setVisibleCount(20);
  };

  const selectProperty = property => {
    setSelectedProperty(property);
    setVisibleCount(20);
  };


  // ====================================================
  // UI
  // ====================================================

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={loadMoreBookings}
        scrollEventThrottle={200}>

        <View style={styles.propertySelectorSection}>
          <PropertyDropdown
            selectedValue={selectedProperty}
            onChange={selectProperty}
            fallbackProperties={fallbackPropertyOptions}
            includeAll
          />
        </View>


        {/* ========================================= */}
        {/* TOP TABS */}
        {/* ========================================= */}

        <View style={styles.topTabs}>


          {/* NEXT ARRIVALS */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              setActiveTab('arrivals')
            }
            style={[
              styles.topTab,

              activeTab === 'arrivals' &&
                styles.activeTopTab,
            ]}>

            <Text
              style={[
                styles.topTabText,

                activeTab === 'arrivals' &&
                  styles.activeTopTabText,
              ]}>

              Next arrivals / departures

            </Text>

          </TouchableOpacity>


          {/* OCCUPANCY */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              setActiveTab('occupancy')
            }
            style={[
              styles.topTab,

              activeTab === 'occupancy' &&
                styles.activeTopTab,
            ]}>

            <Text
              style={[
                styles.topTabText,

                activeTab === 'occupancy' &&
                  styles.activeTopTabText,
              ]}>

              Current occupancy

            </Text>

          </TouchableOpacity>

        </View>


        {/* ========================================= */}
        {/* DATE HEADER */}
        {/* ========================================= */}

   


        {/* ========================================= */}
        {/* DATE FILTERS */}
        {/* ========================================= */}

        <View style={styles.dateFilters}>


          {/* TODAY */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectDateFilter('Today')}
            style={[
              styles.dateFilter,

              dateFilter === 'Today' &&
                styles.activeDateFilter,
            ]}>

            <Text
              style={[
                styles.dateFilterText,

                dateFilter === 'Today' &&
                  styles.activeDateFilterText,
              ]}>

              Today

            </Text>

          </TouchableOpacity>


          {/* TOMORROW */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectDateFilter('Tomorrow')}
            style={[
              styles.dateFilter,

              dateFilter === 'Tomorrow' &&
                styles.activeDateFilter,
            ]}>

            <Text
              style={[
                styles.dateFilterText,

                dateFilter === 'Tomorrow' &&
                  styles.activeDateFilterText,
              ]}>

              Tomorrow

            </Text>

          </TouchableOpacity>


          {/* NEXT 7 DAYS */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectDateFilter('Next 7 days')}
            style={[
              styles.dateFilter,

              dateFilter === 'Next 7 days' &&
                styles.activeDateFilter,
            ]}>

            <Text
              style={[
                styles.dateFilterText,

                dateFilter === 'Next 7 days' &&
                  styles.activeDateFilterText,
              ]}>

              Next 7 days

            </Text>

          </TouchableOpacity>

        </View>


        {/* ========================================= */}
        {/* ARRIVALS / DEPARTURES */}
        {/* ========================================= */}

        {activeTab === 'arrivals' ? (

          <>


            {visibleBookings.map(renderBooking)}

          </>

        ) : (

          /* ======================================= */
          /* CURRENT OCCUPANCY */
          /* ======================================= */

          <View style={styles.emptyOccupancy}>

            <Text style={styles.emptyTitle}>
              Current occupancy
            </Text>

            <Text style={styles.emptyText}>
              Occupancy details will appear here.
            </Text>

          </View>

        )}

      </ScrollView>

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
    backgroundColor: BACKGROUND,
  },


  scrollContent: {
    paddingHorizontal: wp(5.5),
    paddingTop: hp(2.5),
    paddingBottom: hp(5),
  },


  propertySelectorSection: {
    marginBottom: hp(2.5),
    zIndex: 10,
  },


  // ====================================================
  // TOP TABS
  // ====================================================

  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },


  topTab: {
    height: hp(5.2),

    paddingHorizontal: wp(4),

    borderRadius: hp(3),

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',

    marginRight: wp(2),
  },


  activeTopTab: {
    backgroundColor: '#164B38',
  },


  topTabText: {
    fontSize: wp(3),

    fontWeight: '700',

    color: '#7E8B84',
  },


  activeTopTabText: {
    color: '#FFFFFF',
  },


  // ====================================================
  // DATE HEADER
  // ====================================================

  dateHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: hp(1.5),
  },


  viewingDate: {
    flexDirection: 'row',

    alignItems: 'center',
  },


  calendarIcon: {
    fontSize: wp(3.5),

    color: '#719083',

    marginRight: wp(1.5),
  },


  viewingText: {
    fontSize: wp(3.1),

    fontWeight: '600',

    color: '#687A72',
  },


  todayButton: {
    height: hp(5.2),

    minWidth: wp(18),

    paddingHorizontal: wp(3.5),

    borderRadius: hp(3),

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#DCE4DF',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },


  todayButtonText: {
    fontSize: wp(3),

    fontWeight: '600',

    color: '#64746D',
  },


  chevron: {
    fontSize: wp(4),

    color: '#64746D',

    marginLeft: wp(2),

    marginTop: -hp(0.5),
  },


  // ====================================================
  // DATE FILTERS
  // ====================================================

  dateFilters: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: hp(2),
  },


  dateFilter: {
    paddingHorizontal: wp(3.8),

    height: hp(4.6),

    borderRadius: hp(3),

    justifyContent: 'center',

    marginRight: wp(2),
  },


  activeDateFilter: {
    backgroundColor: '#DDF4E8',
  },


  dateFilterText: {
    fontSize: wp(3.4),

    fontWeight: '600',

    color: '#87958E',
  },


  activeDateFilterText: {
    color: PRIMARY,
  },


  // ====================================================
  // SECTION
  // ====================================================

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

    marginBottom: hp(2.2),
  },


  sectionTitle: {
    fontSize: wp(2.8),

    fontWeight: '700',

    letterSpacing: wp(0.45),

    color: '#82918A',

    flex: 1,
  },


  staysContainer: {
    alignItems: 'center',

    marginLeft: wp(4),
  },


  staysCount: {
    fontSize: wp(3),

    fontWeight: '600',

    color: '#8A9791',

    lineHeight: hp(2),
  },


  staysText: {
    fontSize: wp(2.6),

    color: '#89968F',
  },


  subTitle: {
    fontSize: wp(2.7),

    fontWeight: '700',

    letterSpacing: wp(0.3),

    color: '#96A19C',

    marginBottom: hp(1.8),

    marginLeft: wp(1),
  },


  departureTitle: {
    marginTop: hp(3),
  },


  // ====================================================
  // BOOKING CARD
  // ====================================================

  bookingCard: {
    minHeight: hp(19),

    backgroundColor: '#FFFFFF',

    borderRadius: wp(5),

    marginBottom: hp(2),

    paddingHorizontal: wp(3.5),

    paddingVertical: hp(2.1),

    flexDirection: 'column',

    borderWidth: 1,

    borderColor: '#E2E9E5',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.04,

    shadowRadius: 8,

    elevation: 2,
  },


  bookingTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },


  // ====================================================
  // PROPERTY ICON
  // ====================================================

  propertyIcon: {
    width: wp(11.5),

    height: wp(11.5),

    borderRadius: wp(3.5),

    backgroundColor: '#DDF5E8',

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'center',
  },


  propertyIconPending: {
    backgroundColor: '#FFF0CF',
  },


  homeIcon: {
    fontSize: wp(7),

    color: '#15965F',

    lineHeight: wp(7),
  },


  homeIconPending: {
    color: '#C8880A',
  },


  // ====================================================
  // CARD CONTENT
  // ====================================================

  bookingContent: {
    flex: 1,

    marginLeft: wp(3),

    paddingRight: wp(1),
  },


  bookingSourceRow: {
    alignItems: 'flex-end',
    marginBottom: hp(0.8),
  },


  location: {
    fontSize: wp(2.7),

    fontWeight: '700',

    letterSpacing: wp(0.35),

    color: '#82918A',

    marginBottom: hp(0.7),
  },


  propertyName: {
    fontSize: wp(3.6),

    lineHeight: hp(2.35),

    fontWeight: '600',

    color: '#27342F',
  },


  guestRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: hp(1.1),
  },


  peopleIcon: {
    fontSize: wp(4),

    color: '#91A09A',

    marginRight: wp(1.5),
  },


  guestText: {
    fontSize: wp(2.6),

    color: '#8A9791',

    fontWeight: '500',
  },


  // ====================================================
  // RIGHT SIDE
  // ====================================================

  bookingFooter: {
    width: '100%',
    alignItems: 'stretch',
    marginTop: hp(1.8),
    borderTopWidth: 1,
    borderTopColor: '#EDF2EF',
    paddingTop: hp(1.2),
  },


  statusPill: {
    paddingHorizontal: wp(2.8),

    minHeight: hp(3.2),

    maxWidth: '85%',

    borderRadius: hp(2),

    backgroundColor: '#DDF5E8',

    alignItems: 'center',

    justifyContent: 'center',
  },


  pendingPill: {
    backgroundColor: '#FFF0CF',
  },


  statusText: {
    fontSize: wp(2.3),

    fontWeight: '800',

    color: '#17965F',

    letterSpacing: wp(0.1),
  },


  pendingText: {
    color: '#B87A08',
  },


  dateText: {
    fontSize: wp(2.55),

    fontWeight: '500',

    color: '#718078',

    textAlign: 'right',

    marginTop: hp(1),
  },


  dateSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginLeft: 0,
  },


  dateGroup: {
    alignItems: 'flex-start',
    flex: 1,
  },


  dateGroupLast: {
    alignItems: 'flex-end',
    flex: 1,
  },


  dateLabel: {
    fontSize: wp(2.1),
    fontWeight: '800',
    letterSpacing: wp(0.2),
    color: '#9AA7A1',
    marginTop: hp(0.4),
  },


  dateValue: {
    fontSize: wp(2.45),
    fontWeight: '600',
    color: '#586A62',
    textAlign: 'left',
    marginTop: hp(0.15),
  },


  // ====================================================
  // OCCUPANCY
  // ====================================================

  emptyOccupancy: {
    backgroundColor: '#FFFFFF',

    borderRadius: wp(4),

    padding: wp(6),

    marginTop: hp(2),
  },


  emptyTitle: {
    fontSize: wp(4),

    fontWeight: '700',

    color: DARK,
  },


  emptyText: {
    fontSize: wp(3.2),

    color: '#89958F',

    marginTop: hp(1),
  },

});