import React, {useEffect, useState} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Path} from 'react-native-svg';

const PRIMARY = '#17B978';

const getPropertyName = property =>
  (typeof property === 'string' ? property : null) ??
  property?.unit_name ??
  property?.final_unit_name ??
  property?.unitName ??
  property?.property_name ??
  property?.propertyName ??
  property?.name ??
  '';

const getPropertyId = property =>
  (typeof property === 'string' ? property : null) ??
  property?.unit_id ??
  property?.unitId ??
  property?.property_id ??
  property?.id ??
  getPropertyName(property);

const normalizeProperties = properties =>
  properties
    .map(property => ({
      ...property,
      unit_id: getPropertyId(property),
      unit_name: getPropertyName(property),
    }))
    .filter(property => property.unit_name);

const ChevronIcon = ({open}) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'}
      stroke={PRIMARY}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PropertyDropdown = ({
  selectedValue,
  onChange,
  fallbackProperties = [],
  includeAll = false,
  label = 'PROPERTY',
  placeholder = 'Select property',
  selectedLabel,
}) => {
  const [properties, setProperties] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProperties = async () => {
      try {
        const storedProperties = await AsyncStorage.getItem('properties');
        const parsedProperties = storedProperties
          ? JSON.parse(storedProperties)
          : [];
        const storedList = Array.isArray(parsedProperties)
          ? normalizeProperties(parsedProperties)
          : [];
        const fallbackList = normalizeProperties(fallbackProperties);

        if (mounted) {
          setProperties(storedList.length ? storedList : fallbackList);
        }
      } catch (error) {
        if (mounted) {
          setProperties(normalizeProperties(fallbackProperties));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      mounted = false;
    };
  }, [fallbackProperties]);

  const selectedProperty = properties.find(
    property => String(getPropertyId(property)) === String(selectedValue),
  );

  const options = includeAll
    ? [{unit_id: '__all__', unit_name: 'All properties'}, ...properties]
    : properties;

  const handleSelect = property => {
    setIsOpen(false);
    onChange(property.unit_name, property);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={() => setIsOpen(open => !open)}>
        <Text style={styles.buttonText} numberOfLines={1}>
          {selectedProperty?.unit_name ?? selectedLabel ?? placeholder}
        </Text>
        <ChevronIcon open={isOpen} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.menu}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={PRIMARY} size="small" />
            </View>
          ) : options.length === 0 ? (
            <Text style={styles.emptyText}>No properties available</Text>
          ) : (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.optionsScroll}>
              {options.map(property => {
                const isSelected =
                  property.unit_name === selectedValue ||
                  (property.unit_name === 'All properties' &&
                    selectedValue === 'All properties');

                return (
                  <TouchableOpacity
                    key={String(property.unit_id)}
                    activeOpacity={0.8}
                    style={styles.option}
                    onPress={() => handleSelect(property)}>
                    <View
                      style={[styles.optionDot, isSelected && styles.selectedDot]}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}>
                      {property.unit_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#82918A',
    marginBottom: 7,
  },
  button: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#273B34',
    marginRight: 12,
  },
  menu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 78,
    maxHeight: 230,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#17251F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  optionsScroll: {
    maxHeight: 218,
  },
  option: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DCE8E1',
    marginRight: 10,
  },
  selectedDot: {
    backgroundColor: PRIMARY,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#50635B',
  },
  selectedOptionText: {
    color: PRIMARY,
    fontWeight: '800',
  },
  loadingRow: {
    padding: 18,
    alignItems: 'center',
  },
  emptyText: {
    padding: 16,
    fontSize: 13,
    color: '#758B82',
  },
});

export default PropertyDropdown;
