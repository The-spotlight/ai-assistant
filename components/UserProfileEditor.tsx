'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'antd';
import { X, Check, Image, User } from 'lucide-react';
import { UserProfile, PRESET_AVATARS, loadUserProfile, saveUserProfile } from '@/lib/settings';

interface UserProfileEditorProps {
  open: boolean;
  onClose: () => void;
  onProfileChange: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function UserProfileEditor({ open, onClose, onProfileChange }: UserProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [originalProfile, setOriginalProfile] = useState<UserProfile>(loadUserProfile());
  const [isModified, setIsModified] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const savedProfile = loadUserProfile();
      setProfile(savedProfile);
      setOriginalProfile(savedProfile);
      setIsModified(false);
      setError('');
    }
  }, [open]);

  const handleNicknameChange = (value: string) => {
    setProfile((prev) => ({ ...prev, nickname: value }));
    setIsModified(true);
  };

  const handlePresetAvatarSelect = (avatarKey: string) => {
    const avatar = PRESET_AVATARS[avatarKey as keyof typeof PRESET_AVATARS];
    if (avatar) {
      setProfile((prev) => ({ ...prev, avatar: `emoji:${avatarKey}` }));
      setIsModified(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfile((prev) => ({ ...prev, avatar: result }));
      setIsModified(true);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setProfile(originalProfile);
    setIsModified(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    saveUserProfile(profile);
    setOriginalProfile(profile);
    setIsModified(false);
    onProfileChange();
    onClose();
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const renderAvatar = () => {
    if (!profile.avatar) {
      return <User className="h-6 w-6 text-[#525252]" />;
    }
    if (profile.avatar.startsWith('emoji:')) {
      const avatarKey = profile.avatar.split(':')[1];
      const presetAvatar = PRESET_AVATARS[avatarKey as keyof typeof PRESET_AVATARS];
      return presetAvatar ? <span className="text-xl">{presetAvatar.emoji}</span> : <User className="h-6 w-6 text-[#525252]" />;
    }
    return <img src={profile.avatar} alt="头像" className="w-full h-full object-cover rounded-full" />;
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="编辑个人信息"
      footer={null}
      width={360}
      closeIcon={<X className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-4">
              {renderAvatar()}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#525252] bg-[#f5f5f5] rounded-lg hover:bg-[#e5e5e5] cursor-pointer transition-colors"
          >
            <Image className="h-4 w-4" />
            上传图片
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#525252] mb-2">选择预设头像</label>
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(PRESET_AVATARS).map(([key, avatar]) => (
              <button
                key={key}
                onClick={() => handlePresetAvatarSelect(key)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                  profile.avatar === `emoji:${key}`
                    ? 'bg-[#0072f5] ring-2 ring-[#0072f5] ring-offset-2'
                    : 'bg-[#f5f5f5] hover:bg-[#e5e5e5]'
                }`}
                title={avatar.name}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#525252] mb-2">昵称</label>
          <input
            type="text"
            value={profile.nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            placeholder="请输入昵称"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0072f5] focus:ring-1 focus:ring-[#0072f5]"
            maxLength={20}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleReset}
            disabled={!isModified}
            className="flex-1"
          >
            重置
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isModified}
            type="primary"
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}