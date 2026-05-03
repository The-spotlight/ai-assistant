export type UpdateType = 'feature' | 'fix' | 'improvement';

export interface ChangelogEntry {
  version: string;
  date: string;
  items: {
    type: UpdateType;
    content: string;
  }[];
}

export const CURRENT_VERSION = '0.1.0';

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-05-03',
    items: [
      {
        type: 'feature',
        content: '新增更新日志功能，用户可在头像下拉菜单中查看版本更新记录',
      },
      {
        type: 'feature',
        content: '支持新版本高亮标识，首次打开时自动标记最新版本',
      },
      {
        type: 'improvement',
        content: '优化用户体验，支持"不再显示此版本更新"功能',
      },
    ],
  },
];

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  feature: '新功能',
  fix: '修复',
  improvement: '优化',
};

export const UPDATE_TYPE_COLORS: Record<UpdateType, string> = {
  feature: 'bg-green-100 text-green-700',
  fix: 'bg-red-100 text-red-700',
  improvement: 'bg-blue-100 text-blue-700',
};

const READ_VERSIONS_KEY = 'ai-assistant-read-versions';

export function getReadVersions(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(READ_VERSIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveReadVersion(version: string): void {
  if (typeof window === 'undefined') return;
  const readVersions = getReadVersions();
  if (!readVersions.includes(version)) {
    readVersions.push(version);
    localStorage.setItem(READ_VERSIONS_KEY, JSON.stringify(readVersions));
  }
}

export function isVersionNew(version: string): boolean {
  const readVersions = getReadVersions();
  return !readVersions.includes(version);
}

export function getLatestVersion(): string {
  return CHANGELOG_DATA[0]?.version || CURRENT_VERSION;
}

export function hasUnreadVersion(): boolean {
  const latestVersion = getLatestVersion();
  return isVersionNew(latestVersion);
}
