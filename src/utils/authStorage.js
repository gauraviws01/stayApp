import * as Keychain from 'react-native-keychain';
import {NativeModules} from 'react-native';

const CREDENTIALS_SERVICE = 'com.staysereno.remembered-credentials';
const PIN_SERVICE = 'com.staysereno.app-pin';
const STORAGE_UNAVAILABLE_MESSAGE =
  'Secure storage is unavailable in this app build. Install a freshly rebuilt app, then try again.';

export const assertSecureStorageAvailable = () => {
  if (!NativeModules.RNKeychainManager) {
    throw new Error(STORAGE_UNAVAILABLE_MESSAGE);
  }
};

export const getRememberedCredentials = async () => {
  assertSecureStorageAvailable();
  const credentials = await Keychain.getGenericPassword({
    service: CREDENTIALS_SERVICE,
  });

  return credentials
    ? {email: credentials.username, password: credentials.password}
    : null;
};

export const saveRememberedCredentials = async (email, password) => {
  assertSecureStorageAvailable();
  const saved = await Keychain.setGenericPassword(email, password, {
    service: CREDENTIALS_SERVICE,
  });

  if (!saved) {
    throw new Error('Unable to save credentials securely.');
  }
};

export const clearRememberedCredentials = async () => {
  assertSecureStorageAvailable();
  const exists = await Keychain.hasGenericPassword({
    service: CREDENTIALS_SERVICE,
  });

  if (exists) {
    const removed = await Keychain.resetGenericPassword({
      service: CREDENTIALS_SERVICE,
    });

    if (!removed) {
      throw new Error('Unable to remove saved credentials securely.');
    }
  }
};

export const getAppPin = async () => {
  assertSecureStorageAvailable();
  const storedPin = await Keychain.getGenericPassword({service: PIN_SERVICE});
  return storedPin ? storedPin.password : null;
};

export const saveAppPin = async pin => {
  assertSecureStorageAvailable();
  const saved = await Keychain.setGenericPassword('app-pin', pin, {
    service: PIN_SERVICE,
  });

  if (!saved) {
    throw new Error('Unable to save the PIN securely.');
  }
};

export const clearAppPin = async () => {
  assertSecureStorageAvailable();
  const exists = await Keychain.hasGenericPassword({service: PIN_SERVICE});

  if (exists) {
    const removed = await Keychain.resetGenericPassword({service: PIN_SERVICE});

    if (!removed) {
      throw new Error('Unable to remove the PIN securely.');
    }
  }
};
