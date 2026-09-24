import React, {useMemo} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';

import PropertyDropdown from '../components/PropertyDropdown';
import {useProperty} from '../components/PropertyContext';
import PageHeader from '../components/PageHeader';

const CaretakerDetailScreen = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();

  const {
    units,
    selectedUnit,
    handleUnitChange,
  } = useProperty();

  /* =====================================================
     PROPERTY LIST
     
     Login API se aane wale units hi use honge.
     Koi hardcoded property nahi.
  ===================================================== */

  const propertyList = Array.isArray(units)
    ? units
    : [];

  /* =====================================================
     SELECTED PROPERTY
     
     Dropdown me jo property selected hai,
     uske unit_id ke basis par actual unit object
     find hoga.
  ===================================================== */

  const selectedProperty = useMemo(() => {
    if (!propertyList.length) {
      return null;
    }

    if (!selectedUnit) {
      return propertyList[0];
    }

    const selectedUnitId =
      selectedUnit?.unit_id ??
      selectedUnit?.id;

    if (
      selectedUnitId !== undefined &&
      selectedUnitId !== null
    ) {
      const matchedProperty =
        propertyList.find(property => {
          const propertyUnitId =
            property?.unit_id ??
            property?.id;

          return (
            String(propertyUnitId) ===
            String(selectedUnitId)
          );
        });

      if (matchedProperty) {
        return matchedProperty;
      }
    }

    return propertyList[0];
  }, [
    propertyList,
    selectedUnit,
  ]);

  /* =====================================================
     CARETAKER DETAILS
     
     Login API field:
     caretaker_details
  ===================================================== */

  const caretakerHtml = useMemo(() => {
    if (!selectedProperty) {
      return '';
    }

    const details =
      selectedProperty?.caretaker_details;

    if (
      details === null ||
      details === undefined
    ) {
      return '';
    }

    return String(details).trim();
  }, [selectedProperty]);

  /* =====================================================
     SELECTED PROPERTY NAME
  ===================================================== */

  const selectedPropertyName =
    selectedProperty?.unit_name ||
    selectedProperty?.final_unit_name ||
    selectedProperty?.name ||
    'Select Property';

  /* =====================================================
     HTML STYLES
  ===================================================== */

  const tagsStyles = {
    p: {
      color: '#1F2D2A',
      fontSize: 16,
      lineHeight: 25,
      margin: 0,
      marginBottom: 6,
    },

    strong: {
      color: '#000000',
      fontWeight: 'bold',
    },

    b: {
      color: '#000000',
      fontWeight: 'bold',
    },

    div: {
      color: '#1F2D2A',
      fontSize: 16,
      lineHeight: 25,
    },

    span: {
      color: '#1F2D2A',
      fontSize: 16,
    },
  };

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  const renderEmptyDetails = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          No caretaker details
        </Text>

        <Text style={styles.emptyText}>
          Caretaker details are not available
          for {selectedPropertyName}.
        </Text>
      </View>
    );
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F3F7F4"
        translucent={false}
      />

      <View style={styles.container}>

        {/* =============================================
            HEADER
        ============================================= */}

        <PageHeader
          navigation={navigation}
          title="Caretaker"
        />

        {/* =============================================
            PROPERTY DROPDOWN
        ============================================= */}

        {propertyList.length > 0 && (
          <View
            style={
              styles.propertySelectorWrap
            }>

            <PropertyDropdown
              selectedValue={
                selectedProperty?.unit_id ??
                selectedProperty?.id
              }

              selectedLabel={
                selectedPropertyName
              }

              fallbackProperties={
                propertyList
              }

              onChange={(_, property) => {
                console.log(
                  'CARETAKER PROPERTY SELECTED:',
                  property,
                );

                handleUnitChange(property);
              }}
            />

          </View>
        )}

        {/* =============================================
            CONTENT
        ============================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                insets.bottom + 32,
            },
          ]}>

          <View style={styles.networkCard}>

            {/* =========================================
                CARD HEADER
            ========================================= */}

            <View
              style={
                styles.networkHeader
              }>

              <Text
                style={
                  styles.networkName
                }>
                Caretaker details
              </Text>

            </View>

            {/* =========================================
                SELECTED PROPERTY
            ========================================= */}

            <Text
              numberOfLines={2}
              style={
                styles.selectedPropertyText
              }>
              {selectedPropertyName}
            </Text>

            {/* =========================================
                CARETAKER API DATA
            ========================================= */}

            <View
              style={
                styles.editorContentWrap
              }>

              {caretakerHtml ? (
                <RenderHtml
                  contentWidth={
                    width - 64
                  }
                  source={{
                    html: caretakerHtml,
                  }}
                  tagsStyles={
                    tagsStyles
                  }
                />
              ) : (
                renderEmptyDetails()
              )}

            </View>

          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },

  container: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 28,
    color: '#111827',
    lineHeight: 28,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2D2A',
  },

  placeholder: {
    width: 36,
    height: 36,
  },

  propertySelectorWrap: {
    paddingHorizontal: 18,
    marginBottom: 16,
    zIndex: 10,
  },

  propertyLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#5F7D72',
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF5F0',
    borderWidth: 1,
    borderColor: '#D8EAE2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  propertyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2D2A',
    marginRight: 10,
  },

  propertyChevron: {
    fontSize: 18,
    color: '#1F2D2A',
    fontWeight: '700',
  },

  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    marginTop: 8,
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
  },

  dropdownItemActive: {
    backgroundColor: '#EAF7F2',
  },

  dropdownItemText: {
    fontSize: 13,
    color: '#1F2D2A',
    fontWeight: '600',
  },

  dropdownItemTextActive: {
    color: '#0E8C66',
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },

  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    padding: 18,
  },

  networkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    padding: 16,
  },

  networkHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
    paddingBottom: 10,
    marginBottom: 12,
  },

  networkName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2D2A',
    letterSpacing: 0.5,
  },

  selectedPropertyText: {
    fontSize: 13,
    color: '#17B978',
    fontWeight: '600',
    marginBottom: 8,
  },

  editorContentWrap: {
    paddingVertical: 4,
  },

  detailText: {
    color: '#1F2D2A',
    fontSize: 16,
    lineHeight: 25,
  },

  emptyContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#777',
    textAlign: 'center',
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F4EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  icon: {
    fontSize: 30,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2D2A',
  },

  heroSubtitle: {
    fontSize: 14,
    color: '#5F7D72',
    fontWeight: '600',
    marginTop: 4,
  },

  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },

  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1DBA78',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  personInfo: {
    marginBottom: 12,
  },

  personName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2D2A',
  },

  personRole: {
    color: '#6E8B84',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },

  statusWrap: {
    marginBottom: 12,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
  },

  metaBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E8B84',
    textTransform: 'uppercase',
  },

  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2D2A',
  },
});

export default CaretakerDetailScreen;