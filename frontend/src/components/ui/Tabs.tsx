import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> & {
  List: React.FC<TabListProps>;
  Tab: React.FC<TabProps>;
  Panel: React.FC<TabPanelProps>;
} = ({ defaultTab, children, className, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSetTab = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetTab }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabList: React.FC<TabListProps> = ({ children, className }) => (
  <div className={cn('flex border-b border-gray-200 gap-1', className)}>{children}</div>
);

const Tab: React.FC<TabProps> = ({ id, children, className, icon, badge }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab must be used within Tabs');

  const isActive = ctx.activeTab === id;

  return (
    <button
      onClick={() => ctx.setActiveTab(id)}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2',
        isActive
          ? 'text-blue-600 border-blue-600 bg-blue-50/50'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50',
        className
      )}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            'ml-1 text-xs font-semibold rounded-full px-1.5 py-0.5',
            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

const TabPanel: React.FC<TabPanelProps> = ({ id, children, className }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabPanel must be used within Tabs');

  if (ctx.activeTab !== id) return null;

  return <div className={cn('mt-4', className)}>{children}</div>;
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
