import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

import RenderHtml from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {useProperty} from '../components/PropertyContext';
import PageHeader from '../components/PageHeader';
import {mergePropertyOptions} from '../utils/propertyOptions';

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
     LOADER
  ===================================================== */

  const [isChangingProperty, setIsChangingProperty] =
    useState(false);

  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] =
    useState(false);

  /* =====================================================
     LOCAL SELECTED PROPERTY
     
     IMPORTANT:
     Dropdown se jo fresh property object milta hai,
     usko direct yahan store karenge.
  ===================================================== */

  const [localSelectedProperty, setLocalSelectedProperty] =
    useState(null);

  /* =====================================================
     ALL PROPERTIES / UNITS
  ===================================================== */

  const propertyList = useMemo(() => {
    return Array.isArray(units) ? units : [];
  }, [units]);

  const [storedProperties, setStoredProperties] =
    useState([]);

  useEffect(() => {
    let mounted = true;

    const loadStoredProperties = async () => {
      try {
        const stored = await AsyncStorage.getItem('properties');
        const parsed = stored ? JSON.parse(stored) : [];

        if (mounted) {
          setStoredProperties(
            Array.isArray(parsed) ? parsed : [],
          );
        }
      } catch (error) {
        console.log('WIFI STORED PROPERTIES ERROR:', error);
      }
    };

    loadStoredProperties();

    return () => {
      mounted = false;
    };
  }, []);

  const dropdownPropertyList = useMemo(
    () => mergePropertyOptions(storedProperties, propertyList),
    [storedProperties, propertyList],
  );

  useEffect(() => {
    console.log(
      'WIFI DROPDOWN OPTION COUNT:',
      dropdownPropertyList.length,
    );
    console.log(
      'WIFI DROPDOWN OPTIONS:',
      dropdownPropertyList.map(property => ({
        id: property.unit_id,
        name: property.unit_name,
      })),
    );
  }, [dropdownPropertyList]);

  /* =====================================================
     CONTEXT SELECTED PROPERTY
  ===================================================== */

  const contextSelectedProperty = useMemo(() => {
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
     FINAL SELECTED PROPERTY

     Priority:
     1. Dropdown se directly selected fresh object
     2. Context selected property
  ===================================================== */

  const selectedProperty =
    localSelectedProperty ||
    contextSelectedProperty;

  /* =====================================================
     INITIAL PROPERTY SET
     
     Screen open hone par context wali property ko
     local state mein set karenge.
  ===================================================== */

  useEffect(() => {
    if (!localSelectedProperty && contextSelectedProperty) {
      setLocalSelectedProperty(
        contextSelectedProperty,
      );
    }
  }, [
    contextSelectedProperty,
    localSelectedProperty,
  ]);

  /* =====================================================
     IMPORTANT:
     Agar context se selected property change hoti hai
     aur local selection nahi hai, tab update karo.
     
     Lekin dropdown se manually selected fresh object
     ko overwrite nahi karenge.
  ===================================================== */

  useEffect(() => {
    if (!localSelectedProperty) {
      return;
    }

    const localId =
      localSelectedProperty?.unit_id ??
      localSelectedProperty?.id;

    const contextId =
      contextSelectedProperty?.unit_id ??
      contextSelectedProperty?.id;

    if (
      localId === undefined ||
      localId === null ||
      contextId === undefined ||
      contextId === null
    ) {
      return;
    }

    if (
      String(localId) !==
      String(contextId)
    ) {
      return;
    }

    /*
      Same property hai, isliye context ka latest
      object use kar sakte hain.

      Isse agar API/context data refresh hua hai,
      latest details bhi aa jayengi.
    */

    if (
      contextSelectedProperty &&
      contextSelectedProperty !==
        localSelectedProperty
    ) {
      setLocalSelectedProperty(
        contextSelectedProperty,
      );
    }
  }, [
    contextSelectedProperty,
    localSelectedProperty,
  ]);

  /* =====================================================
     WIFI / ELECTRICITY DETAILS
  ===================================================== */

  const wifiHtml = useMemo(() => {
    if (!selectedProperty) {
      return '';
    }

    const details =
      selectedProperty
        ?.internal_wifi_electricity_account_details;

    console.log(
      'WIFI FINAL PROPERTY:',
      selectedProperty?.unit_id ??
        selectedProperty?.id,
    );

    console.log(
      'WIFI FINAL DETAILS:',
      details,
    );

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
     PROPERTY CHANGE
  ===================================================== */

  const handlePropertyChange = (
    _,
    property,
  ) => {
    if (!property) {
      return;
    }

    const newPropertyId =
      property?.unit_id ??
      property?.id;

    const currentPropertyId =
      selectedProperty?.unit_id ??
      selectedProperty?.id;

    /* ===================================================
       SAME PROPERTY
    =================================================== */

    if (
      String(newPropertyId) ===
      String(currentPropertyId)
    ) {
      return;
    }

    console.log(
      'WIFI PROPERTY CHANGING:',
      property,
    );

    console.log(
      'NEW PROPERTY ID:',
      newPropertyId,
    );

    console.log(
      'NEW WIFI DETAILS:',
      property
        ?.internal_wifi_electricity_account_details,
    );

    /* ===================================================
       LOADER ON
    =================================================== */

    setIsChangingProperty(true);

    /* ===================================================
       MOST IMPORTANT FIX

       Dropdown se jo actual property object aa raha hai,
       wahi direct local selected property banega.

       Isliye purana context object render nahi hoga.
    =================================================== */

    setLocalSelectedProperty(property);

    /* ===================================================
       CONTEXT BHI UPDATE
    =================================================== */

    handleUnitChange(property);

    /* ===================================================
       Loader ko next render ke baad hide karo.

       Koi fixed 400ms API wait nahi.
    =================================================== */

    requestAnimationFrame(() => {
      setIsChangingProperty(false);
    });
  };

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
     LOADER
  ===================================================== */

  const renderLoader = () => {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="small"
          color="#17B978"
        />

        <Text style={styles.loaderText}>
          Loading property details...
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

        {dropdownPropertyList.length > 0 && (
          <View
            style={styles.propertySelectorWrap}>
            <Text style={styles.propertyLabel}>PROPERTY</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.propertySelector}
              onPress={() =>
                setIsPropertyDropdownOpen(open => !open)
              }>
              <Text
                numberOfLines={1}
                style={styles.propertySelectorText}>
                {selectedPropertyName}
              </Text>
              <Text style={styles.propertyChevron}>
                {isPropertyDropdownOpen ? '⌃' : '⌄'}
              </Text>
            </TouchableOpacity>

            {isPropertyDropdownOpen && (
              <View style={styles.propertyDropdownMenu}>
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.propertyDropdownOptions}>
                  {dropdownPropertyList.map(property => {
                    const propertyId =
                      property?.unit_id ?? property?.id;
                    const selectedId =
                      selectedProperty?.unit_id ?? selectedProperty?.id;
                    const isSelected =
                      String(propertyId) === String(selectedId);

                    return (
                      <TouchableOpacity
                        key={String(propertyId)}
                        activeOpacity={0.8}
                        style={[
                          styles.propertyDropdownItem,
                          isSelected && styles.propertyDropdownItemActive,
                        ]}
                        onPress={() => {
                          setIsPropertyDropdownOpen(false);
                          handlePropertyChange(
                            property?.unit_name ||
                              property?.final_unit_name ||
                              property?.name,
                            property,
                          );
                        }}>
                        <Text
                          style={[
                            styles.propertyDropdownItemText,
                            isSelected &&
                              styles.propertyDropdownItemTextActive,
                          ]}>
                          {property?.unit_name ||
                            property?.final_unit_name ||
                            property?.name ||
                            'Unnamed property'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
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
              style={
                styles.networkHeader
              }>

              <Text
                style={
                  styles.networkName
                }>
                Wifi/Electricity details
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
                CONTENT / LOADER
            ========================================= */}

            <View
              style={
                styles.editorContentWrap
              }>

              {isChangingProperty ? (
                renderLoader()
              ) : wifiHtml ? (
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

  propertySelectorWrap: {
    paddingHorizontal: 16,
    marginTop: 16,
    zIndex: 10,
    elevation: 10,
  },

  propertyLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#82918A',
    marginBottom: 7,
  },

  propertySelector: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    backgroundColor: '#FFFFFF',
  },

  propertySelectorText: {
    flex: 1,
    marginRight: 12,
    color: '#273B34',
    fontSize: 14,
    fontWeight: '700',
  },

  propertyChevron: {
    color: '#17B978',
    fontSize: 20,
    fontWeight: '700',
  },

  propertyDropdownMenu: {
    position: 'absolute',
    top: 78,
    left: 16,
    right: 16,
    maxHeight: 500,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#17251F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  propertyDropdownOptions: {
    maxHeight: 480,
  },

  propertyDropdownItem: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  propertyDropdownItemActive: {
    backgroundColor: '#EAF7F2',
  },

  propertyDropdownItemText: {
    color: '#50635B',
    fontSize: 14,
    lineHeight: 20,
  },

  propertyDropdownItemTextActive: {
    color: '#17B978',
    fontWeight: '800',
  },

  content: {
    padding: 16,
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

  selectedPropertyText: {
    fontSize: 13,
    color: '#17B978',
    fontWeight: '600',
    marginBottom: 8,
  },

  editorContentWrap: {
    paddingVertical: 4,
    minHeight: 80,
  },

  /* ================================================
     LOADER
  ================================================ */

  loaderContainer: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  loaderText: {
    marginTop: 10,
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },

  /* ================================================
     EMPTY
  ================================================ */

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