'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dropdown, Menu, Drawer } from 'antd';
import { User, Settings, BarChart3, Palette, Bot, Sparkles, Square, Circle, Frame, Edit3, LogOut, Package } from 'lucide-react';
import AppearanceSettings from './AppearanceSettings';
import ModelSettings from './ModelSettings';
import UserProfileEditor from './UserProfileEditor';
import ChangelogPanel from './ChangelogPanel';
import { useSettings, AVATAR_SHAPES, AVATAR_BORDERS, UserProfile, loadUserProfile, PRESET_AVATARS } from '@/lib/settings';
import { logout } from '@/lib/auth';
import { hasUnreadVersion } from '@/lib/changelog';

interface UserDropdownProps {
  onOpenSettings: () => void;
  onOpenUserStats: () => void;
}

type DrawerContent = 'appearance' | null;

type ActivityStatus = 'active' | 'occasional' | 'rare';

function useUserActivity(): ActivityStatus {
  const getActivityStatus = useCallback((): ActivityStatus => {
    if (typeof window === 'undefined') {
      return 'occasional';
    }
    
    const lastActiveTime = localStorage.getItem('ai-assistant-last-active');
    const usageCount = localStorage.getItem('ai-assistant-usage-count');
    const today = new Date().toDateString();
    const todayUsage = localStorage.getItem(`ai-assistant-usage-${today}`);
    
    const count = parseInt(usageCount || '0');
    const todayCount = parseInt(todayUsage || '0');
    
    const now = Date.now();
    let lastActive = now;
    if (lastActiveTime) {
      lastActive = parseInt(lastActiveTime);
    }
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
    
    if (todayCount >= 5 || count >= 20) {
      return 'active';
    } else if (todayCount >= 1 || count >= 5 || hoursSinceActive < 24) {
      return 'occasional';
    } else {
      return 'rare';
    }
  }, []);

  const [status, setStatus] = useState<ActivityStatus>('occasional');

  useEffect(() => {
    setStatus(getActivityStatus());
    
    const interval = setInterval(() => {
      setStatus(getActivityStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, [getActivityStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('ai-assistant-last-active', Date.now().toString());
    const today = new Date().toDateString();
    const todayUsage = localStorage.getItem(`ai-assistant-usage-${today}`);
    const newCount = parseInt(todayUsage || '0') + 1;
    localStorage.setItem(`ai-assistant-usage-${today}`, newCount.toString());
    
    const totalCount = localStorage.getItem('ai-assistant-usage-count');
    const newTotal = parseInt(totalCount || '0') + 1;
    localStorage.setItem('ai-assistant-usage-count', newTotal.toString());
  }, []);

  return status;
}

function generateWelcomeMessage(nickname: string, status: ActivityStatus): string {
  const hour = new Date().getHours();
  const greetings: Record<string, string[]> = {
    morning: [`早上好${nickname}！新的一天开始了`, `早安${nickname}！今天也要加油`, `清晨好${nickname}！元气满满`],
    afternoon: [`下午好${nickname}！继续加油`, `午安${nickname}！休息好了吗`, `下午好${nickname}！工作顺利`],
    evening: [`晚上好${nickname}！辛苦了`, `晚安前的时光${nickname}`, `傍晚好${nickname}！放松一下`],
    night: [`夜深了${nickname}，注意休息`, `夜深了${nickname}，早点休息`, `晚安前的最后冲刺${nickname}`],
  };

  let timeOfDay = 'afternoon';
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 18) {
    timeOfDay = 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  const baseGreetings = greetings[timeOfDay];
  const randomGreeting = baseGreetings[Math.floor(Math.random() * baseGreetings.length)];

  const statusMessages: Record<ActivityStatus, string[]> = {
    active: ['你今天真活跃！', '使用频率很高呀', '看来你很喜欢这个工具'],
    occasional: ['很高兴见到你', '欢迎回来', '好久不见'],
    rare: ['欢迎使用', '初次见面，请多指教', '希望你喜欢这里'],
  };

  const statusMessage = statusMessages[status][Math.floor(Math.random() * statusMessages[status].length)];

  return `${randomGreeting} ${statusMessage}`;
}

function renderAvatar(avatar: string) {
  if (!avatar) {
    return <User className="h-3.5 w-3.5" />;
  }
  if (avatar.startsWith('emoji:')) {
    const avatarKey = avatar.split(':')[1];
    const presetAvatar = PRESET_AVATARS[avatarKey as keyof typeof PRESET_AVATARS];
    return presetAvatar ? <span className="text-lg">{presetAvatar.emoji}</span> : <User className="h-3.5 w-3.5" />;
  }
  return <img src={avatar} alt="头像" className="w-full h-full object-cover" />;
}

export default function UserDropdown({ onOpenSettings, onOpenUserStats }: UserDropdownProps) {
  const [drawerContent, setDrawerContent] = useState<DrawerContent>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const activityStatus = useUserActivity();
  const { appearance, updateAppearance } = useSettings();

  useEffect(() => {
    const handleStorageChange = () => {
      setProfile(loadUserProfile());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleProfileChange = () => {
    setProfile(loadUserProfile());
  };

  const handleAppearanceClick = () => {
    setDrawerContent('appearance');
  };

  const handleModelClick = () => {
    setShowModelModal(true);
  };

  const handleChangelogClick = () => {
    setShowChangelog(true);
  };

  const handleDrawerClose = () => {
    setDrawerContent(null);
  };

  const toggleAvatarShape = () => {
    const shapes = Object.keys(AVATAR_SHAPES) as (keyof typeof AVATAR_SHAPES)[];
    const currentIndex = shapes.indexOf(appearance.avatarShape);
    const nextIndex = (currentIndex + 1) % shapes.length;
    updateAppearance('avatarShape', shapes[nextIndex]);
  };

  const toggleAvatarBorder = () => {
    const borders = Object.keys(AVATAR_BORDERS) as (keyof typeof AVATAR_BORDERS)[];
    const currentIndex = borders.indexOf(appearance.avatarBorder);
    const nextIndex = (currentIndex + 1) % borders.length;
    updateAppearance('avatarBorder', borders[nextIndex]);
  };

  const avatarShapeClass = AVATAR_SHAPES[appearance.avatarShape].borderRadius;
  const avatarBorderClass = AVATAR_BORDERS[appearance.avatarBorder].border;

  const statusColors: Record<ActivityStatus, string> = {
    active: 'bg-green-500',
    occasional: 'bg-yellow-500',
    rare: 'bg-gray-400',
  };

  const statusGlow: Record<ActivityStatus, string> = {
    active: 'shadow-green-500/50',
    occasional: 'shadow-yellow-500/50',
    rare: 'shadow-gray-400/30',
  };

  const menuItems = [
    {
      key: 'profile',
      label: (
        <div className="px-2 pb-2 mb-2 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#d4d4d4] ${avatarShapeClass} ${avatarBorderClass}`}>
              {renderAvatar(profile.avatar)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{profile.nickname}</span>
                <button
                  onClick={() => setShowEditor(true)}
                  className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#3d3d3d] rounded transition-colors"
                  title="编辑资料"
                >
                  <Edit3 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {generateWelcomeMessage(profile.nickname, activityStatus)}
              </p>
            </div>
          </div>
        </div>
      ),
      onClick: () => {},
    },
    {
      key: 'avatar-shape',
      label: (
        <div className="flex items-center gap-2">
          {appearance.avatarShape === 'circle' ? (
            <Circle className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          ) : (
            <Square className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-200">头像形状: {AVATAR_SHAPES[appearance.avatarShape].name}</span>
        </div>
      ),
      onClick: toggleAvatarShape,
    },
    {
      key: 'avatar-border',
      label: (
        <div className="flex items-center gap-2">
          <Frame className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          <span className="text-sm text-gray-700 dark:text-gray-200">头像边框: {AVATAR_BORDERS[appearance.avatarBorder].name}</span>
        </div>
      ),
      onClick: toggleAvatarBorder,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'appearance',
      label: (
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          <span className="text-sm text-gray-700 dark:text-gray-200">外观</span>
        </div>
      ),
      onClick: handleAppearanceClick,
    },
    {
      key: 'model',
      label: (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          <span className="text-sm text-gray-700 dark:text-gray-200">模型</span>
        </div>
      ),
      onClick: handleModelClick,
    },
    {
      key: 'stats',
      label: (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          <span className="text-sm text-gray-700 dark:text-gray-200">使用记录</span>
        </div>
      ),
      onClick: onOpenUserStats,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'changelog',
      label: (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          <span className="text-sm text-gray-700 dark:text-gray-200">更新日志</span>
          {hasUnreadVersion() && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </div>
      ),
      onClick: handleChangelogClick,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'settings',
      label: (
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
          <span className="text-sm text-gray-700 dark:text-gray-200">更多设置</span>
        </div>
      ),
      onClick: onOpenSettings,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: (
        <div className="flex items-center gap-2 text-red-500">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">退出登录</span>
        </div>
      ),
      onClick: () => {
        logout();
      },
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
          className="flex items-center gap-2 h-8 rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] dark:hover:text-white dark:hover:bg-[#3d3d3d] transition-colors px-2"
          title="个人中心"
          aria-label="打开个人中心"
        >
          <div className="relative">
            <div
              className={`flex h-6 w-6 items-center justify-center bg-[#f5f5f5] dark:bg-[#3d3d3d] text-[#525252] dark:text-[#d4d4d4] ${avatarShapeClass} ${avatarBorderClass}`}
            >
              {renderAvatar(profile.avatar)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#171717] ${statusColors[activityStatus]} ${statusGlow[activityStatus]} shadow-md animate-pulse`}
              title={
                activityStatus === 'active' ? '活跃使用中' :
                activityStatus === 'occasional' ? '偶尔使用' : '很少使用'
              }
            />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{profile.nickname}</span>
        </button>
      </Dropdown>

      <Drawer
        title="外观设置"
        placement="right"
        onClose={handleDrawerClose}
        open={drawerContent !== null}
        width={448}
        styles={{
          body: { padding: 0 },
        }}
      >
        <AppearanceSettings onClose={handleDrawerClose} />
      </Drawer>

      <UserProfileEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        onProfileChange={handleProfileChange}
      />

      <ModelSettings
        open={showModelModal}
        onClose={() => setShowModelModal(false)}
      />

      <ChangelogPanel
        open={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </>
  );
}