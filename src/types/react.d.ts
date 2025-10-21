
import * as ReactNamespace from 'react';

declare module 'react' {
  export = ReactNamespace;
  export as namespace React;

  // Explicitly add these exports
  export const useState: typeof ReactNamespace.useState;
  export const useEffect: typeof ReactNamespace.useEffect;
  export const useRef: typeof ReactNamespace.useRef;
  export const useCallback: typeof ReactNamespace.useCallback;
  export const useMemo: typeof ReactNamespace.useMemo;
  export const memo: typeof ReactNamespace.memo;
  export const forwardRef: typeof ReactNamespace.forwardRef;
  export const createContext: typeof ReactNamespace.createContext;
  export const useContext: typeof ReactNamespace.useContext;
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}
