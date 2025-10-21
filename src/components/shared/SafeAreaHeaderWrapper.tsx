import React from 'react';

interface SafeAreaHeaderWrapperProps {
  children: React.ReactNode;
}

const SafeAreaHeaderWrapper: React.FC<SafeAreaHeaderWrapperProps> = ({ children }) => {
  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {children}
    </div>
  );
};

export default SafeAreaHeaderWrapper;
