import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

const PropertyContext = createContext(null);

const SELECTED_PROPERTY_KEY = 'selectedPropertyId';

const getUnitName = unit =>
  unit?.final_unit_name ||
  unit?.unit_name ||
  unit?.unitName ||
  unit?.property_name ||
  unit?.propertyName ||
  unit?.name ||
  `Unit ${unit?.unit_id || ''}`;

const normalizeProperties = propertyList => {
  if (!Array.isArray(propertyList)) {
    return [];
  }

  return propertyList
    .map(item => ({
      ...item,
      unit_id: item?.unit_id ?? item?.id ?? item?.property_id,

      unit_name:
        item?.unit_name ??
        item?.final_unit_name ??
        item?.unitName ??
        item?.name ??
        item?.property_name ??
        item?.propertyName ??
        '',
    }))
    .filter(item => item?.unit_id !== undefined && item?.unit_id !== null);
};

export const PropertyProvider = ({children}) => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const loadProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);

      const propertiesString = await AsyncStorage.getItem('properties');

      if (!propertiesString) {
        setUnits([]);
        setSelectedUnit(null);
        return;
      }

      let propertyList = [];

      try {
        propertyList = JSON.parse(propertiesString);
      } catch (error) {
        console.log('PROPERTY JSON PARSE ERROR:', error);
        propertyList = [];
      }

      const normalizedProperties = normalizeProperties(propertyList);

      setUnits(normalizedProperties);

      if (normalizedProperties.length === 0) {
        setSelectedUnit(null);
        return;
      }

      // Previously selected property
      const savedPropertyId = await AsyncStorage.getItem(
        SELECTED_PROPERTY_KEY,
      );

      let selectedProperty = null;

      if (savedPropertyId) {
        selectedProperty = normalizedProperties.find(
          item => String(item.unit_id) === String(savedPropertyId),
        );
      }

      // Agar saved property nahi mili to first property
      if (!selectedProperty) {
        selectedProperty = normalizedProperties[0];
      }

      setSelectedUnit(selectedProperty);

      // Ensure selected property is stored
      await AsyncStorage.setItem(
        SELECTED_PROPERTY_KEY,
        String(selectedProperty.unit_id),
      );
    } catch (error) {
      console.log('LOAD PROPERTIES ERROR:', error);
      setUnits([]);
      setSelectedUnit(null);
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleUnitChange = useCallback(async unit => {
    if (!unit?.unit_id) {
      return;
    }

    setSelectedUnit(unit);

    try {
      await AsyncStorage.setItem(
        SELECTED_PROPERTY_KEY,
        String(unit.unit_id),
      );
    } catch (error) {
      console.log('SAVE SELECTED PROPERTY ERROR:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      units,
      selectedUnit,
      setSelectedUnit,
      handleUnitChange,
      getUnitName,
      loadingProperties,
      refreshProperties: loadProperties,
    }),
    [
      units,
      selectedUnit,
      handleUnitChange,
      loadingProperties,
      loadProperties,
    ],
  );

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);

  if (!context) {
    throw new Error(
      'useProperty must be used inside PropertyProvider',
    );
  }

  return context;
};