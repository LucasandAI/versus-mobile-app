
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const BackButton = () => {
  const { setCurrentView } = useApp();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="mr-2"
      onClick={() => setCurrentView('home')}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};

export default BackButton;
