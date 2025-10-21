import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.versus.run',
  appName: 'versus-app',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    CapacitorHealthkit: {
      types: [
        {
          read: ['distance'],
          write: []
        }
      ]
    }
  }
};

export default config;
