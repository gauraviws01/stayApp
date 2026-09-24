import React, {useMemo} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

import PropertyDropdown from '../components/PropertyDropdown';
import {useProperty} from '../components/PropertyContext';
import PageHeader from '../components/PageHeader';

export default function WiFiDetailsScreen({
  navigation,
  insets,
}) {
  const {width} = useWindowDimensions();

  const {
    units,
    selectedUnit,
    handleUnitChange,
  } = useProperty();

  /* =====================================================
     ALL PROPERTIES / UNITS
  ===================================================== */

  const propertyList = Array.isArray(units)
    ? units
    : [];

  /* =====================================================
     SELECTED PROPERTY
     
     Dropdown se selectedUnit aayega.
     Usi unit_id ke basis par actual object find hoga.
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
  }, [propertyList, selectedUnit]);

  /* =====================================================
     WIFI / ELECTRICITY DETAILS
     
     Selected dropdown property ke object se directly
     internal_wifi_electricity_account_details liya ja raha hai.
  ===================================================== */

  const wifiHtml = useMemo(() => {
    if (!selectedProperty) {
      return '';
    }

    const details =
      selectedProperty
        ?.internal_wifi_electricity_account_details;

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
      color: '#495057',
      fontSize: 15,
      lineHeight: 22,
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
      color: '#495057',
      fontSize: 15,
      lineHeight: 22,
    },

    span: {
      color: '#495057',
      fontSize: 15,
    },
  };

  /* =====================================================
     EMPTY DATA
  ===================================================== */

  const renderEmptyDetails = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          No WiFi/Electricity details
        </Text>

        <Text style={styles.emptyText}>
          Details are not available for{' '}
          {selectedPropertyName}.
        </Text>
      </View>
    );
  };

  /* =====================================================
     MAIN UI
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
          title="Wifi/Electricity details"
        />

        {/* =============================================
            PROPERTY DROPDOWN
        ============================================= */}

        {propertyList.length > 0 && (
          <View
            style={styles.propertySelectorWrap}>

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
                  'WIFI PROPERTY SELECTED:',
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
          contentContainerStyle={
            styles.content
          }>

          <View style={styles.networkCard}>

            {/* =========================================
                CARD HEADER
            ========================================= */}

            <View
              style={styles.networkHeader}>

              <Text
                style={styles.networkName}>
                Wifi/Electricity details
              </Text>

            </View>

            {/* =========================================
                SELECTED PROPERTY
            ========================================= */}

            <Text
              numberOfLines={2}
              style={styles.selectedPropertyText}>
              {selectedPropertyName}
            </Text>

            {/* =========================================
                API CONTENT
            ========================================= */}

            <View
              style={
                styles.editorContentWrap
              }>

              {wifiHtml ? (
                <RenderHtml
                  contentWidth={
                    width - 64
                  }
                  source={{
                    html: wifiHtml,
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
}

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
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  backButton: {
    padding: 8,
  },

  backText: {
    fontSize: 28,
    color: '#000',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  placeholder: {
    width: 40,
  },

  propertySelectorWrap: {
    paddingHorizontal: 16,
    marginTop: 16,
    zIndex: 10,
  },

  propertyLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },

  propertySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  propertyText: {
    fontSize: 16,
    color: '#000',
  },

  propertyChevron: {
    fontSize: 16,
    color: '#666',
  },

  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    zIndex: 50,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  dropdownItemActive: {
    backgroundColor: '#F3F7F4',
  },

  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },

  dropdownItemTextActive: {
    color: '#000',
    fontWeight: '600',
  },

  content: {
    padding: 16,
  },

  heroCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  iconWrap: {
    backgroundColor: '#F3F7F4',
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },

  icon: {
    fontSize: 32,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  heroSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  networkCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },

  networkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 12,
  },

  networkName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },

  statusBadge: {
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
    fontWeight: '500',
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
    color: '#777',
    textAlign: 'center',
  },
});