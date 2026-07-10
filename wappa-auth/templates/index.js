import { registerRootComponent } from 'expo';
import React from 'react';
import { WappaAuthProvider } from '@appaflytech/wappa-auth';
import App from './App';
import { wappaAuthConfig } from './game/auth';

// Uygulamayı bir kez Wappa Auth ile sar; useWappaAuth() her yerde kullanılabilir.
function Root() {
  return (
    <WappaAuthProvider config={wappaAuthConfig}>
      <App />
    </WappaAuthProvider>
  );
}

registerRootComponent(Root);
