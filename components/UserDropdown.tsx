'use client';

import { Dropdown, Menu } from 'antd';
import { User, Settings, BarChart3 } from 'lucide-react';

interface UserDropdownProps {
  onOpenSettings: () => void;
  onOpenUserStats: () => void;
}

export default function UserDropdown({ onOpenSettings, onOpenUserStats }: UserDropdownProps) {
  const menuItems = [
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
          <span className="text-sm">设置</span>
        </div>
      ),
      onClick: onOpenSettings,
    },
  ];

  return (
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
  );
}