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

const PROPERTIES_API =
  'https://staysereno.in/api/staff/properties';

/* =====================================================
   GET UNIT NAME
===================================================== */

const getUnitName = unit =>
  unit?.final_unit_name ||
  unit?.unit_name ||
  unit?.unitName ||
  unit?.property_name ||
  unit?.propertyName ||
  unit?.name ||
  `Unit ${unit?.unit_id || ''}`;

/* =====================================================
   NORMALIZE PROPERTIES
===================================================== */

const normalizeProperties = propertyList => {
  if (!Array.isArray(propertyList)) {
    return [];
  }

  const seen = new Set();

  return propertyList
    .map(item => ({
      ...item,

      unit_id:
        item?.unit_id ??
        item?.id ??
        item?.property_id,

      unit_name:
        item?.unit_name ??
        item?.final_unit_name ??
        item?.unitName ??
        item?.name ??
        item?.property_name ??
        item?.propertyName ??
        '',
    }))
    .filter(item => {
      const id =
        item?.unit_id !== undefined &&
        item?.unit_id !== null
          ? String(item.unit_id)
          : null;

      if (!id || !item?.unit_name) {
        return false;
      }

      if (seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });
};

const extractPropertyList = responseData => {
  if (!responseData) {
    return [];
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.properties)) {
    return responseData.properties;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.data?.properties)) {
    return responseData.data.properties;
  }

  if (Array.isArray(responseData?.result)) {
    return responseData.result;
  }

  if (Array.isArray(responseData?.data?.result)) {
    return responseData.data.result;
  }

  if (Array.isArray(responseData?.items)) {
    return responseData.items;
  }

  return [];
};

/* =====================================================
   GET USER ID
===================================================== */

const getUserId = async () => {
  try {
    /* -----------------------------------------------
       First try direct userId
    ------------------------------------------------ */

    const directUserId =
      await AsyncStorage.getItem('userId');

    if (directUserId) {
      return directUserId;
    }

    /* -----------------------------------------------
       Try user
    ------------------------------------------------ */

    const userString =
      await AsyncStorage.getItem('user');

    if (userString) {
      try {
        const user = JSON.parse(userString);

        const userId =
          user?.id ??
          user?.user_id ??
          user?.userId;

        if (userId !== undefined && userId !== null) {
          return String(userId);
        }
      } catch (error) {
        console.log(
          'USER JSON PARSE ERROR:',
          error,
        );
      }
    }

    /* -----------------------------------------------
       Try userData
    ------------------------------------------------ */

    const userDataString =
      await AsyncStorage.getItem('userData');

    if (userDataString) {
      try {
        const userData =
          JSON.parse(userDataString);

        const userId =
          userData?.id ??
          userData?.user_id ??
          userData?.userId;

        if (userId !== undefined && userId !== null) {
          return String(userId);
        }
      } catch (error) {
        console.log(
          'USER DATA JSON PARSE ERROR:',
          error,
        );
      }
    }

    return null;
  } catch (error) {
    console.log(
      'GET USER ID ERROR:',
      error,
    );

    return null;
  }
};

/* =====================================================
   GET AUTH TOKEN
===================================================== */

const getAuthToken = async () => {
  try {
    const tokenKeys = [
      'authToken',
      'token',
      'access_token',
      'userToken',
    ];

    for (const key of tokenKeys) {
      const token =
        await AsyncStorage.getItem(key);

      if (token) {
        return token;
      }
    }

    return null;
  } catch (error) {
    console.log(
      'GET AUTH TOKEN ERROR:',
      error,
    );

    return null;
  }
};

/* =====================================================
   PROVIDER
===================================================== */

export const PropertyProvider = ({
  children,
}) => {
  const [units, setUnits] = useState([]);

  const [selectedUnit, setSelectedUnit] =
    useState(null);

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  /* ===================================================
     LOAD PROPERTIES FROM API
  =================================================== */

  const loadProperties = useCallback(
    async (preferredPropertyId = null) => {
      try {
        setLoadingProperties(true);

        console.log(
          '====================================',
        );

        console.log(
          'PROPERTY API: FETCHING FRESH DATA',
        );

        /* ---------------------------------------------
           USER ID
        --------------------------------------------- */

        const userId =
          await getUserId();

        if (!userId) {
          console.log(
            'PROPERTY API: USER ID NOT FOUND',
          );

          /*
             Fallback to cached properties
          */

          const cachedProperties =
            await AsyncStorage.getItem(
              'properties',
            );

          if (cachedProperties) {
            try {
              const parsed =
                JSON.parse(
                  cachedProperties,
                );

              const normalized =
                normalizeProperties(
                  parsed,
                );

              setUnits(normalized);

              if (normalized.length > 0) {
                const savedId =
                  await AsyncStorage.getItem(
                    SELECTED_PROPERTY_KEY,
                  );

                const selected =
                  normalized.find(
                    item =>
                      String(
                        item.unit_id,
                      ) ===
                      String(
                        savedId,
                      ),
                  ) ||
                  normalized[0];

                setSelectedUnit(
                  selected,
                );
              }
            } catch (error) {
              console.log(
                'CACHED PROPERTY PARSE ERROR:',
                error,
              );
            }
          }

          return;
        }

        /* ---------------------------------------------
           TOKEN
        --------------------------------------------- */

        const token =
          await getAuthToken();

        if (!token) {
          console.log(
            'PROPERTY API: TOKEN NOT FOUND',
          );

          return;
        }

        /* ---------------------------------------------
           API REQUEST
        --------------------------------------------- */

        console.log(
          'PROPERTY API USER ID:',
          userId,
        );

        const response =
          await fetch(
            PROPERTIES_API,
            {
              method: 'POST',

              headers: {
                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                user_id: userId,
              }),
            },
          );

        console.log(
          'PROPERTY API STATUS:',
          response.status,
        );

        const responseText =
          await response.text();

        let responseData = null;

        try {
          responseData =
            JSON.parse(
              responseText,
            );
        } catch (error) {
          console.log(
            'PROPERTY API JSON PARSE ERROR:',
            error,
          );

          console.log(
            'PROPERTY API RAW RESPONSE:',
            responseText,
          );

          return;
        }

        console.log(
          'PROPERTY API RESPONSE:',
          responseData,
        );

        /* ---------------------------------------------
           CHECK RESPONSE
        --------------------------------------------- */

        if (!response.ok) {
          console.log(
            'PROPERTY API FAILED:',
            responseData,
          );

          return;
        }

        /* ---------------------------------------------
           FRESH PROPERTIES
        --------------------------------------------- */

        const propertyList =
          extractPropertyList(
            responseData,
          );

        console.log(
          'PROPERTY API RESPONSE PROPERTY COUNT:',
          propertyList.length,
        );

        console.log(
          'PROPERTY API RESPONSE PROPERTIES:',
          propertyList.map(property => ({
            id:
              property?.unit_id ??
              property?.unitId ??
              property?.property_id ??
              property?.id,
            name:
              property?.unit_name ??
              property?.final_unit_name ??
              property?.unitName ??
              property?.name ??
              property?.property_name ??
              property?.propertyName,
          })),
        );

        const normalizedProperties =
          normalizeProperties(
            propertyList,
          );

        console.log(
          'FRESH PROPERTIES COUNT:',
          normalizedProperties.length,
        );

        if (
          normalizedProperties.length ===
          0
        ) {
          console.log(
            'PROPERTY API RETURNED EMPTY LIST:',
            responseData,
          );

          setUnits([]);
          setSelectedUnit(null);
          await AsyncStorage.removeItem(
            SELECTED_PROPERTY_KEY,
          );
          return;
        }

        /* ---------------------------------------------
           UPDATE STATE
        ------------------------------------------------ */

        setUnits(
          normalizedProperties,
        );

        /* ---------------------------------------------
           UPDATE CACHE

           Important:
           Old AsyncStorage data replace hoga.
        ------------------------------------------------ */

        await AsyncStorage.setItem(
          'properties',
          JSON.stringify(
            normalizedProperties,
          ),
        );

        /* ---------------------------------------------
           GET SAVED PROPERTY
        ------------------------------------------------ */

        const savedPropertyId =
          await AsyncStorage.getItem(
            SELECTED_PROPERTY_KEY,
          );

        /* ---------------------------------------------
           PREFERRED PROPERTY

           Dropdown se property change hone par
           hum preferredPropertyId pass karenge.
        ------------------------------------------------ */

        const targetPropertyId =
          preferredPropertyId ??
          savedPropertyId;

        let selectedProperty = null;

        if (
          targetPropertyId !==
            null &&
          targetPropertyId !==
            undefined
        ) {
          selectedProperty =
            normalizedProperties.find(
              item =>
                String(
                  item.unit_id,
                ) ===
                String(
                  targetPropertyId,
                ),
            );
        }

        /* ---------------------------------------------
           FALLBACK FIRST PROPERTY
        ------------------------------------------------ */

        if (!selectedProperty) {
          selectedProperty =
            normalizedProperties[0] ||
            null;
        }

        /* ---------------------------------------------
           SET SELECTED PROPERTY
        ------------------------------------------------ */

        setSelectedUnit(
          selectedProperty,
        );

        /* ---------------------------------------------
           SAVE SELECTED PROPERTY
        ------------------------------------------------ */

        if (selectedProperty) {
          await AsyncStorage.setItem(
            SELECTED_PROPERTY_KEY,
            String(
              selectedProperty.unit_id,
            ),
          );

          console.log(
            'SELECTED FRESH PROPERTY:',
            selectedProperty,
          );

          console.log(
            'SELECTED FRESH WIFI DETAILS:',
            selectedProperty
              ?.internal_wifi_electricity_account_details,
          );
        } else {
          await AsyncStorage.removeItem(
            SELECTED_PROPERTY_KEY,
          );
        }

        console.log(
          '====================================',
        );
      } catch (error) {
        console.log(
          'LOAD PROPERTIES ERROR:',
          error,
        );
      } finally {
        setLoadingProperties(false);
      }
    },
    [],
  );

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  /* ===================================================
     HANDLE PROPERTY CHANGE
     
     IMPORTANT:
     Dropdown change hote hi API dobara hit hogi.
  =================================================== */

  const handleUnitChange =
    useCallback(
      async unit => {
        if (!unit) {
          return;
        }

        const unitId =
          unit?.unit_id ??
          unit?.id ??
          unit?.property_id;

        if (
          unitId === undefined ||
          unitId === null
        ) {
          console.log(
            'PROPERTY CHANGE: UNIT ID NOT FOUND',
            unit,
          );

          return;
        }

        console.log(
          '====================================',
        );

        console.log(
          'PROPERTY CHANGE:',
          unit,
        );

        console.log(
          'PROPERTY CHANGE ID:',
          unitId,
        );

        /* ---------------------------------------------
           Save selected ID immediately
        ------------------------------------------------ */

        try {
          await AsyncStorage.setItem(
            SELECTED_PROPERTY_KEY,
            String(unitId),
          );
        } catch (error) {
          console.log(
            'SAVE SELECTED PROPERTY ERROR:',
            error,
          );
        }

        /*
          IMPORTANT:

          Pehle API se fresh data aayega.
          Uske baad selectedUnit update hoga.
        */

        await loadProperties(
          unitId,
        );
      },
      [loadProperties],
    );

  /* ===================================================
     CONTEXT VALUE
  =================================================== */

  const value = useMemo(
    () => ({
      units,

      selectedUnit,

      setSelectedUnit,

      handleUnitChange,

      getUnitName,

      loadingProperties,

      refreshProperties:
        loadProperties,
    }),
    [
      units,
      selectedUnit,
      handleUnitChange,
      loadingProperties,
      loadProperties,
    ],
  );

  /* ===================================================
     PROVIDER
  =================================================== */

  return (
    <PropertyContext.Provider
      value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

/* =====================================================
   HOOK
===================================================== */

export const useProperty = () => {
  const context =
    useContext(PropertyContext);

  if (!context) {
    throw new Error(
      'useProperty must be used inside PropertyProvider',
    );
  }

  return context;
};