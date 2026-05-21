import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maadhavkothari.finraprep',
  appName: 'FINRA Prep',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#F4EFE7',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#F4EFE7',
      iosSpinnerStyle: 'small',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F4EFE7',
    },
  },
};

export default config;
