'use client';

import React, { ReactNode } from 'react';
import clsx from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={clsx('tabs-list', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={clsx('tab-btn', activeTab === tab.id && 'tab-btn-active')}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span style={{ marginRight: '0.4rem' }}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
