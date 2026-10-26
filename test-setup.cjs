global.__DEV__ = false;
globalThis.__DEV__ = false;
process.env.EXPO_OS = 'android';

global.window = {
  location: { protocol: 'http:' },
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.window = global.window;

class MockEventEmitter {
  addListener() { return { remove: () => {} }; }
  removeListener() {}
  emit() {}
}

const DummyClass = class {};
const dummyModule = new Proxy(DummyClass, {
  get: (target, prop) => {
    if (prop === 'prototype') return target.prototype;
    return dummyModule;
  },
  apply: () => ({}),
  construct: () => ({}),
});

globalThis.expo = {
  EventEmitter: MockEventEmitter,
  modules: new Proxy({}, {
    get: () => dummyModule,
  }),
};

const Platform = {
  OS: 'android',
  select: (obj) => obj.android || obj.default,
};

const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (id === 'react-native') {
    return {
      Platform,
      AppState: { addEventListener: () => ({ remove: () => {} }), currentState: 'active' },
      StyleSheet: { create: (s) => s },
      NativeModules: new Proxy({}, { get: () => ({}) }),
      View: 'View',
      Text: 'Text',
    };
  }
  if (id === 'expo-modules-core') {
    return {
      Platform,
      EventEmitter: MockEventEmitter,
      requireNativeModule: () => dummyModule,
      requireOptionalNativeModule: () => null,
      NativeModule: DummyClass,
    };
  }
  if (id === 'expo' || id.startsWith('expo/')) {
    return {
      registerRootComponent: () => {},
      requireNativeModule: () => dummyModule,
      requireOptionalNativeModule: () => null,
      EventEmitter: MockEventEmitter,
      Platform,
      NativeModule: DummyClass,
    };
  }
  if (id === 'expo-screen-capture') {
    return {
      preventScreenCaptureAsync: async () => {},
      allowScreenCaptureAsync: async () => {},
      usePreventScreenCapture: () => {},
      addScreenshotListener: () => ({ remove: () => {} }),
    };
  }
  return originalRequire.apply(this, arguments);
};
