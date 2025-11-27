import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save, Upload, User as UserIcon } from 'lucide-react';
import type { User } from '../types/user';

interface UserProfileScreenProps {
  user: User;
  onBack: () => void;
  onUserUpdated: (updates: Partial<User>) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const UserProfileScreen = ({ user, onBack, onUserUpdated }: UserProfileScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(() => {
    if (typeof user.profileImageUrl === 'string') {
      const trimmed = user.profileImageUrl.trim();
      if (trimmed) {
        return trimmed;
      }
    }
    return null;
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState<string>(() => Date.now().toString());

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
      setPreviewImage(null);
      setPendingImageBase64(null);
    }

    try {
      const response = await fetch(
        `${API_BASE}/users/profile?email=${encodeURIComponent(user.email)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error: unknown }).error ?? 'Failed to load profile')
            : 'Failed to load profile';
        throw new Error(message);
      }

      const profile = payload?.data;
      if (profile && typeof profile === 'object') {
        const record = profile as Record<string, unknown>;
        const remoteName =
          typeof record.full_name === 'string' && record.full_name.trim()
            ? record.full_name.trim()
            : typeof record.name === 'string' && record.name.trim()
              ? record.name.trim()
              : typeof record.display_name === 'string' && record.display_name.trim()
                ? record.display_name.trim()
                : typeof record.username === 'string' && record.username.trim()
                  ? record.username.trim()
                  : null;
        const remoteBio = typeof record.bio === 'string' ? record.bio : '';
        const imageCandidate =
          typeof record.image_url === 'string' && record.image_url.trim()
            ? record.image_url.trim()
            : typeof record.avatar_url === 'string' && record.avatar_url.trim()
              ? record.avatar_url.trim()
              : typeof record.avatar === 'string' && record.avatar.trim()
                ? record.avatar.trim()
                : null;

        const canonicalName = remoteName ?? (user.name?.trim() ?? '');
        setName(canonicalName);
        setBio(remoteBio);
        setProfileImageUrl(imageCandidate);
        setImageVersion(Date.now().toString());
        onUserUpdated({ name: canonicalName, profileImageUrl: imageCandidate ?? null });
      } else {
        const fallbackName = user.name?.trim() ?? '';
        setName(fallbackName);
        setBio('');
        setProfileImageUrl(null);
        setImageVersion(Date.now().toString());
        onUserUpdated({ name: fallbackName, profileImageUrl: null });
      }
    } catch (profileError) {
      console.error('Failed to load profile', profileError);
      const message = profileError instanceof Error ? profileError.message : 'Failed to load profile';
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [onUserUpdated, user.email, user.name]);

  useEffect(() => {
    if (typeof user.profileImageUrl === 'string') {
      const trimmed = user.profileImageUrl.trim();
      if (trimmed) {
        setProfileImageUrl(trimmed);
        setImageVersion(Date.now().toString());
        return;
      }
    }
    setProfileImageUrl(null);
    setImageVersion(Date.now().toString());
  }, [user.profileImageUrl]);

  useEffect(() => {
    loadProfile().catch(() => undefined);
  }, [loadProfile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setPreviewImage(result);
        setPendingImageBase64(result);
        setSuccess(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setPreviewImage(null);
    setPendingImageBase64(null);
  };

  const displayImage = previewImage || (profileImageUrl && profileImageUrl.trim() ? profileImageUrl.trim() : null);
  const cacheBustedDisplayImage = displayImage
    ? displayImage.startsWith('data:')
      ? displayImage
      : `${displayImage}${displayImage.includes('?') ? '&' : '?'}v=${imageVersion}`
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || loading) {
      return;
    }

    setError(null);
    setSuccess(null);
    setSaving(true);

    const trimmedName = name.trim();
    const payload: Record<string, unknown> = {
      email: user.email,
      bio,
    };

    payload.name = trimmedName;

    if (pendingImageBase64) {
      payload.base64_image = pendingImageBase64;
    }

    try {
      const response = await fetch(`${API_BASE}/users/update-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === 'object' && 'error' in result
            ? String((result as { error: unknown }).error ?? 'Failed to update profile')
            : 'Failed to update profile';
        throw new Error(message);
      }

      const updatedName = trimmedName || '';
      onUserUpdated({ name: updatedName });
      setSuccess('Profile updated successfully');
      setPreviewImage(null);
      setPendingImageBase64(null);
      await loadProfile(true);
    } catch (updateError) {
      console.error('Failed to update profile', updateError);
      const message = updateError instanceof Error ? updateError.message : 'Failed to update profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Systems
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-slate-300 mb-8">Manage your personal details and profile image.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading profile...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/5">
                  {cacheBustedDisplayImage ? (
                    <img src={cacheBustedDisplayImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-white/80" />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{pendingImageBase64 ? 'Change Selected Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                  {pendingImageBase64 && (
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="text-sm text-slate-300 hover:text-white transition"
                      disabled={saving}
                    >
                      Remove selected image
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setSuccess(null);
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(event) => {
                      setBio(event.target.value);
                      setSuccess(null);
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell others about yourself"
                    rows={4}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileScreen;
