'use client';

import { useState } from 'react';
import { Dropdown, Menu, Drawer } from 'antd';
import { User, Settings, BarChart3, Palette, Bot } from 'lucide-react';
import AppearanceSettings from './AppearanceSettings';
import ModelSettings from './ModelSettings';

interface UserDropdownProps {
  onOpenSettings: () => void;
  onOpenUserStats: () => void;
}

type DrawerContent = 'appearance' | 'model' | null;

export default function UserDropdown({ onOpenSettings, onOpenUserStats }: UserDropdownProps) {
  const [drawerContent, setDrawerContent] = useState<DrawerContent>(null);

  const handleAppearanceClick = () => {
    setDrawerContent('appearance');
  };

  const handleModelClick = () => {
    setDrawerContent('model');
  };

  const handleDrawerClose = () => {
    setDrawerContent(null);
  };

  const menuItems = [
    {
      key: 'appearance',
      label: (
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-[#525252]" />
          <span className="text-sm">外观</span>
        </div>
      ),
      onClick: handleAppearanceClick,
    },
    {
      key: 'model',
      label: (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#525252]" />
          <span className="text-sm">模型</span>
        </div>
      ),
      onClick: handleModelClick,
    },
    {
      key: 'stats',
      label: (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#525252]" />
          <span className="text-sm">使用记录</span>
        </div>
      ),
      onClick: onOpenUserStats,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'settings',
      label: (
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#525252]" />
          <span className="text-sm">更多设置</span>
        </div>
      ),
      onClick: onOpenSettings,
    },
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        arrow
      >
        <button
          type="button"
          className="flex items-center gap-2 h-8 rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors px-2"
          title="个人中心"
          aria-label="打开个人中心"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f5f5] text-[#525252]">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">我的</span>
        </button>
      </Dropdown>

      <Drawer
        title={
          drawerContent === 'appearance' ? '外观设置' : 
          drawerContent === 'model' ? '模型设置' : ''
        }
        placement="right"
        onClose={handleDrawerClose}
        open={drawerContent !== null}
        width={360}
      >
        {drawerContent === 'appearance' && (
          <AppearanceSettings onClose={handleDrawerClose} />
        )}
        {drawerContent === 'model' && (
          <ModelSettings onClose={handleDrawerClose} />
        )}
      </Drawer>
    </>
  );
}