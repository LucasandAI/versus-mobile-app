
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatDrawerTabsProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
}

const ChatDrawerTabs: React.FC<ChatDrawerTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "clubs" | "dm")}
      className="w-full"
    >
      <TabsList className="w-full">
        <TabsTrigger value="clubs" className="flex-1">Club Chat</TabsTrigger>
        <TabsTrigger value="dm" className="flex-1">Direct Messages</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ChatDrawerTabs;
