import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageHeader from '../components/PageHeader';

const { width, height } = Dimensions.get('window');

const wp = value => (width * value) / 100;
const hp = value => (height * value) / 100;

const Label = ({ children }) => (
  <Text style={styles.smallLabel}>{children}</Text>
);

const PriceCard = ({ title, value, valueStyle }) => (
  <View style={styles.priceCard}>
    <Text style={styles.priceCardTitle}>{title}</Text>

    <Text style={[styles.priceCardValue, valueStyle]}>{value}</Text>
  </View>
);

const BookingDetail = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const booking = route?.params?.booking || {};

  const bookingId =
    booking?.bookingId || booking?.booking_id || booking?.id || '178931752189';

  const guestName =
    booking?.customerName ||
    booking?.customer_name ||
    booking?.guest_name ||
    'kushal garg';

  const channel = booking?.channel || 'Airbnb';
  const channelDisplay = booking?.channelDisplay || booking?.channel_display || 'Airbnb Content';
  const channelRefId =
    booking?.channelRefId ||
    booking?.channel_ref_id ||
    booking?.channel_ref ||
    'HMMBYJD9H4';

  const status = booking?.status || 'Confirmed';

  const phone = booking?.phone || booking?.guest_phone || '+91 82238506688';

  const email =
    booking?.email || booking?.guest_email || 'kushalgarg1729@gmail.com';

  const adults = booking?.adults || booking?.adult_count || 9;

  const children = booking?.children || booking?.child_count || 0;

  const propertyName =
    booking?.property_name ||
    booking?.propertyName ||
    'Sereno Ikigai 4bhk villa w/private pool & breakfast cook Assamgaon';

  const location = booking?.location || 'Assagaon, Goa';

  const arrivalDate =
    booking?.checkin_date || booking?.startDate || '17 Sep 2026';

  const departureDate =
    booking?.checkout_date || booking?.endDate || '20 Sep 2026';

  const basePrice = '₹40,677.99';
  const totalPayout = '₹47,999.99';
  const guestTotal = '₹47,999.99';
  const bookingReferenceId = booking?.channel_booking_id || booking?.booking_reference_id || '1789899679360';
  const baseNightPrice = '₹8,881.11';
  const gstAmount = '₹1600.20';
  const guestTotalBreakdown = '₹10,481.31';
  const paidAmount = '₹10,481.31';
  const pendingAmount = '₹0.00';

  return (
    <View style={styles.safeArea}>
      {/* STATUS BAR */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6F8F7"
        translucent={false}
      />

      <View style={styles.container}>
        <PageHeader
          navigation={navigation}
          title={String(bookingId)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + hp(6),
            },
          ]}
        >
          {/* ================= RESERVATION ================= */}

          <Text style={styles.sectionLabel}>RESERVATION</Text>

          <View style={styles.titleRow}>
            <Text style={styles.bookingTitle} numberOfLines={2}>
              Booking details
            </Text>

            <View style={styles.confirmedBadge}>
              <View style={styles.statusDot} />

              <Text style={styles.confirmedText}>{status}</Text>
            </View>
          </View>

          <Text style={styles.createdText}>
            Created 13 Sep 2026, 10:46 PM · {channel} Reservation System
          </Text>

          {/* ================= PRICE CARDS ================= */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryGrid}
          >
            <PriceCard title="BASE PRICE" value={basePrice} />

            <PriceCard title="TOTAL PAYOUT" value={totalPayout} />

            <PriceCard title="GUEST TOTAL" value={guestTotal} />
          </ScrollView>

          {/* ================= GUEST DETAILS ================= */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>{'◔'}</Text>

              <Text style={styles.cardHeaderTitle}>GUEST DETAILS</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.guestRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>KG</Text>
                </View>

                <View style={styles.guestInfo}>
                  <Text style={styles.guestName} numberOfLines={1}>
                    {guestName}
                  </Text>

                  <Text style={styles.primaryGuest}>Primary guest</Text>
                </View>
              </View>

              <View style={styles.horizontalLine} />

              <View style={styles.rowBlock}>
                <Label>PHONE</Label>

                <Text style={styles.detailValue}>{phone}</Text>
              </View>

              <View style={styles.rowBlock}>
                <Label>EMAIL</Label>

                <Text style={styles.detailValue} numberOfLines={2}>
                  {email}
                </Text>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.halfColumn}>
                  <Label>ADULTS</Label>

                  <Text style={styles.detailValue}>{adults}</Text>
                </View>

                <View style={styles.halfColumn}>
                  <Label>CHILDREN</Label>

                  <Text style={styles.detailValue}>{children}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= STAY DETAILS ================= */}

          <View style={styles.stayCard}>
            {/* HEADER */}
            <View style={styles.stayHeader}>
              <View style={styles.stayHeaderLeft}>
                <View style={styles.stayHeaderIcon}>
                  <Text style={styles.stayHeaderIconText}>🏠</Text>
                </View>

                <View>
                  <Text style={styles.stayHeaderTitle}>STAY DETAILS</Text>

                  <Text style={styles.stayHeaderSubtitle}>
                    Your reservation stay
                  </Text>
                </View>
              </View>

              <View style={styles.nightBadgeNew}>
                <Text style={styles.nightNumber}>3</Text>

                <Text style={styles.nightLabel}>NIGHTS</Text>
              </View>
            </View>

            {/* DATE SECTION */}
            <View style={styles.stayDateSection}>
              {/* ARRIVAL */}
              <View style={styles.stayDateCard}>
                <View style={styles.dateTopRow}>
                  <View style={styles.dateIconCircle}>
                    <Text style={styles.dateIconText}>📅</Text>
                  </View>

                  <Text style={styles.dateType}>ARRIVAL</Text>
                </View>

                <Text style={styles.stayDateValue}>{arrivalDate}</Text>

                <Text style={styles.stayWeekday}>Thursday</Text>
              </View>

              {/* CONNECTOR */}
              <View style={styles.stayConnector}>
                <View style={styles.connectorLine} />

                <View style={styles.connectorCircle}>
                  <Text style={styles.connectorArrow}>{'➜'}</Text>
                </View>

                <View style={styles.connectorLine} />
              </View>

              {/* DEPARTURE */}
              <View style={styles.stayDateCard}>
                <View style={styles.dateTopRow}>
                  <View style={styles.dateIconCircle}>
                    <Text style={styles.dateIconText}>🗓</Text>
                  </View>

                  <Text style={styles.dateType}>DEPARTURE</Text>
                </View>

                <Text style={styles.stayDateValue}>{departureDate}</Text>

                <Text style={styles.stayWeekday}>Sunday</Text>
              </View>
            </View>

            {/* PROPERTY */}
            <View style={styles.propertySection}>
              <View style={styles.propertyIconBox}>
                <Text style={styles.propertyIcon}>📍</Text>
              </View>

              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitleNew} numberOfLines={3}>
                  {propertyName}
                </Text>

                <View style={styles.locationRow}>
                  <Text style={styles.locationPin}>●</Text>

                  <Text style={styles.propertyLocationNew} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              </View>
            </View>

            {/* AMENITIES */}
            <View style={styles.amenitiesSection}>
              <Text style={styles.amenitiesTitle}>PROPERTY FEATURES</Text>

              <View style={styles.pillRowNew}>
                <View style={styles.amenityPill}>
                  <Text style={styles.amenityIcon}>✓</Text>

                  <Text style={styles.amenityText}>Private Pool</Text>
                </View>

                <View style={styles.amenityPill}>
                  <Text style={styles.amenityIcon}>✦</Text>

                  <Text style={styles.amenityText}>Private Rooftop</Text>
                </View>

                <View style={styles.amenityPill}>
                  <Text style={styles.amenityIcon}>▣</Text>

                  <Text style={styles.amenityText}>Villa</Text>
                </View>
              </View>
            </View>

            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>CHANNEL</Text>
                <Text style={styles.metaValue}>{channelDisplay}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>BOOKING ID</Text>
                <Text style={styles.metaValue}>{bookingReferenceId}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>CHANNEL REF ID</Text>
                <Text style={styles.metaValue}>{channelRefId}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceBreakdownCard}>
            <View style={styles.breakdownHeader}>
              <View style={styles.breakdownIconWrap}>
                <Text style={styles.breakdownIcon}>▣</Text>
              </View>
              <Text style={styles.breakdownTitle}>PRICE BREAKDOWN</Text>
            </View>

            <View style={styles.breakdownRows}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base price (1 night)</Text>
                <Text style={styles.breakdownValue}>{baseNightPrice}</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>GST Amount</Text>
                <Text style={styles.breakdownValue}>{gstAmount}</Text>
              </View>

              <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                <Text style={styles.breakdownTotalLabel}>Guest Total</Text>
                <Text style={styles.breakdownTotalValue}>{guestTotalBreakdown}</Text>
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.paidRow}>
                  <Text style={styles.paidCheck}>✓</Text>
                  <Text style={styles.breakdownLabel}>Paid</Text>
                </View>
                <Text style={styles.paidValue}>{paidAmount}</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Pending</Text>
                <Text style={styles.pendingValue}>{pendingAmount}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default BookingDetail;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },

  container: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },

  /*
   * IMPORTANT:
   * Top padding ab inline contentContainerStyle se
   * insets.top ke according aa rahi hai.
   */
  scrollContent: {
    paddingHorizontal: wp(4),
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#5F7D72',
    marginBottom: hp(1.2),
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },

  bookingTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#1D2F2B',
    marginRight: 10,
  },

  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DFF7EC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DBA78',
    marginRight: 6,
  },

  confirmedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8C5A',
  },

  createdText: {
    fontSize: 12,
    color: '#6E8A81',
    marginBottom: hp(2.4),
  },

  summaryGrid: {
    paddingBottom: hp(1),
    marginBottom: hp(3),
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  priceCard: {
    width: width * 0.34,
    backgroundColor: '#F2F5F4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D7E5E1',
  },

  priceCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E8E86',
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  priceCardValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D2E2A',
  },

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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#4E7F71',
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1DBA78',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1E2E2B',
    textTransform: 'capitalize',
  },

  primaryGuest: {
    fontSize: 12,
    color: '#6E8A81',
    marginTop: 2,
  },

  horizontalLine: {
    height: 1,
    backgroundColor: '#E8EFEA',
    marginVertical: 14,
  },

  rowBlock: {
    marginBottom: 12,
  },

  smallLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#6E8E86',
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  detailValue: {
    fontSize: 14,
    color: '#243632',
    fontWeight: '600',
  },

  twoColumnRow: {
    flexDirection: 'row',
    marginTop: 6,
  },

  halfColumn: {
    flex: 1,
  },

  nightBadge: {
    marginLeft: 'auto',
    backgroundColor: '#1DBA78',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  nightText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.8),
  },

  dateBox: {
    flex: 1,
    backgroundColor: '#F1F7F4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },

  dateValue: {
    fontSize: 15,
    color: '#1B2E29',
    fontWeight: '700',
    marginBottom: 2,
  },

  weekday: {
    fontSize: 12,
    color: '#6E8A81',
  },

  arrow: {
    fontSize: 26,
    marginHorizontal: 10,
    color: '#8AA9A0',
  },

  propertyBox: {
    backgroundColor: '#F1F7F4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  propertyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2F2B',
    marginBottom: 4,
  },

  propertyLocation: {
    fontSize: 12,
    color: '#6E8A81',
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(1.5),
  },

  pill: {
    backgroundColor: '#EAF4F1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },

  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4E7E72',
  },

  /* ==================================================
   NEW STAY DETAILS DESIGN
================================================== */

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

  /* ================= HEADER ================= */

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
    fontSize: 21,
    fontWeight: '700',
    color: '#17B978',
  },

  stayHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#326F5E',
  },

  stayHeaderSubtitle: {
    fontSize: 11,
    color: '#7A9990',
    marginTop: 3,
  },

  /* ================= NIGHT BADGE ================= */

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

  /* ================= DATE SECTION ================= */

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
    paddingHorizontal: 12,
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
    borderRadius: 12.5,
    backgroundColor: '#DDF6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  dateIconText: {
    color: '#17B978',
    fontSize: 15,
    fontWeight: '800',
  },

  dateType: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6C8B82',
  },

  stayDateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D302B',
  },

  stayWeekday: {
    fontSize: 11,
    color: '#78938B',
    marginTop: 3,
  },

  /* ================= CONNECTOR ================= */

  stayConnector: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectorLine: {
    width: 12,
    height: 1,
    backgroundColor: '#C8DDD6',
  },

  connectorCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },

  connectorArrow: {
    fontSize: 16,
    color: '#0F9A62',
    fontWeight: '900',
    lineHeight: 16,
  },

  /* ================= PROPERTY ================= */

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
    fontSize: 19,
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
    fontSize: 9,
    color: '#17B978',
    marginRight: 6,
  },

  propertyLocationNew: {
    flex: 1,
    fontSize: 11,
    color: '#718C84',
  },

  /* ================= AMENITIES ================= */

  amenitiesSection: {
    paddingHorizontal: 14,
    paddingTop: 17,
    paddingBottom: 15,
  },

  amenitiesTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#78938B',
    marginBottom: 10,
  },

  pillRowNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF8F4',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginRight: 7,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#DCEFE8',
  },

  amenityIcon: {
    fontSize: 10,
    color: '#17B978',
    marginRight: 5,
  },

  amenityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4D7468',
  },

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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6F8B82',
    textTransform: 'uppercase',
  },

  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#213831',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },

  priceBreakdownCard: {
    backgroundColor: '#F9FCFB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7EDE5',
    overflow: 'hidden',
    marginBottom: hp(3),
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

  breakdownLabel: {
    fontSize: 13,
    color: '#405B55',
  },

  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2E2B',
  },

  breakdownTotalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
  },

  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2F2A',
  },

  breakdownTotalValue: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2E2B',
  },

  pendingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D94E4E',
  },
});
