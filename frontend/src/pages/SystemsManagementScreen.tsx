import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, PlusCircle, RefreshCw, User, Users } from 'lucide-react';
import type { SystemRecord } from '../types/system';
import { normalizeSystemRecord } from '../types/system';

interface SystemsManagementScreenProps {
  user: { name: string; email: string; user_id: string };
  onLogout: () => void;
  onManageFaces: (system: SystemRecord) => void;
  onViewSystem: (system: SystemRecord) => void;
  onViewProfile: () => void;
}

// const API_BASE = 'http://127.0.0.1:5000';
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';


const SystemsManagementScreen = ({ user, onLogout, onManageFaces, onViewSystem, onViewProfile }: SystemsManagementScreenProps) => {
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);
  const [roomCodeValue, setRoomCodeValue] = useState('');
  const [roomCodeError, setRoomCodeError] = useState<string | null>(null);
  const [roomCodeSubmitting, setRoomCodeSubmitting] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemRecord | null>(null);
  const [profileName, setProfileName] = useState<string>(() => {
    const initial = typeof user.name === 'string' ? user.name.trim() : '';
    return initial;
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const loadSystems = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/systems/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load systems');
      }

      const normalisedSystems = Array.isArray(payload.data)
        ? payload.data
            .map((item: unknown) => normalizeSystemRecord(item))
          .filter((item: SystemRecord | null): item is SystemRecord => Boolean(item))
        : [];

      setSystems(normalisedSystems);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to load systems';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.user_id]);

  const loadUserProfile = useCallback(async () => {
    if (!user.email) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/users/profile?email=${encodeURIComponent(user.email)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        const message = (payload && typeof payload === 'object' && 'error' in payload)
          ? String((payload as { error: unknown }).error ?? 'Failed to load profile')
          : 'Failed to load profile';
        throw new Error(message);
      }

      const profile = payload?.data;
      if (profile && typeof profile === 'object') {
        const record = profile as Record<string, unknown>;
        const imageCandidate = record.image_url ?? record.avatar_url ?? record.avatarUrl;
        if (typeof imageCandidate === 'string' && imageCandidate.trim()) {
          setProfileImageUrl(imageCandidate.trim());
        } else {
          setProfileImageUrl(null);
        }
        const candidateName =
          typeof record.full_name === 'string' && record.full_name.trim()
            ? record.full_name.trim()
            : typeof record.name === 'string' && record.name.trim()
              ? record.name.trim()
              : typeof record.username === 'string' && record.username.trim()
                ? record.username.trim()
                : typeof record.display_name === 'string' && record.display_name.trim()
                  ? record.display_name.trim()
                  : typeof record.email === 'string' && record.email.trim()
                    ? record.email.trim()
                    : null;

        if (candidateName) {
          setProfileName(candidateName);
          return;
        }
      }

      const fallback = typeof user.email === 'string' && user.email.trim() ? user.email.trim() : 'User';
      setProfileName(fallback);
      setProfileImageUrl(null);
    } catch (profileError) {
      console.error('Failed to load user profile', profileError);
      const preferred = typeof user.name === 'string' && user.name.trim()
        ? user.name.trim()
        : typeof user.email === 'string' && user.email.trim()
          ? user.email.trim()
          : 'User';
      setProfileName(preferred);
      setProfileImageUrl(null);
    }
  }, [user.email, user.name]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const openCreateModal = () => {
    setCreateError(null);
    setSuccessMessage(null);
    setNewSystemName('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }
    setShowCreateModal(false);
    setCreateError(null);
  };

  const openRoomCodeModal = (system: SystemRecord) => {
    setSelectedSystem(system);
    setRoomCodeValue(system.room_code ?? '');
    setRoomCodeError(null);
    setSuccessMessage(null);
    setShowRoomCodeModal(true);
  };

  const closeRoomCodeModal = () => {
    if (roomCodeSubmitting) {
      return;
    }
    setShowRoomCodeModal(false);
    setSelectedSystem(null);
    setRoomCodeError(null);
    setRoomCodeValue('');
  };

  const handleCreateSystem = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = newSystemName.trim();
    if (!trimmedName) {
      setCreateError('Please provide a system name');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_BASE}/systems/create-system`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, system_name: trimmedName }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create system');
      }

      setSuccessMessage(`System "${trimmedName}" created successfully`);
      setShowCreateModal(false);
      setNewSystemName('');
      await loadSystems();
    } catch (createErr) {
      const message = createErr instanceof Error ? createErr.message : 'Unable to create system';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleRoomCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentSystem = selectedSystem;
    if (!currentSystem) {
      setRoomCodeError('No system selected');
      return;
    }

    const trimmedCode = roomCodeValue.trim();
    if (!trimmedCode) {
      setRoomCodeError('Please enter a room code');
      return;
    }

    setRoomCodeSubmitting(true);
    setRoomCodeError(null);

    try {
      const hadRoomCode = Boolean(currentSystem.room_code);
      const response = await fetch(`${API_BASE}/systems/add-room-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_id: String(currentSystem.id), room_code: trimmedCode }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof (payload as { error: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'Failed to add room code';
        throw new Error(message);
      }

      setSuccessMessage(
        `Room code "${trimmedCode}" ${hadRoomCode ? 'updated for' : 'added to'} "${currentSystem.system_name}".`
      );
      setShowRoomCodeModal(false);
      setSelectedSystem(null);
      setRoomCodeValue('');
      await loadSystems();
    } catch (roomCodeErr) {
      const message =
        roomCodeErr instanceof Error ? roomCodeErr.message : 'Unable to add room code';
      setRoomCodeError(message);
    } finally {
      setRoomCodeSubmitting(false);
    }
  };

  const hasSystems = systems.length > 0;

  const systemSummaryText = useMemo(() => {
    if (!hasSystems) {
      return 'You have not created any systems yet.';
    }
    const totalFaces = systems.reduce((acc, system) => acc + (system.faces?.length || 0), 0);
    return `${systems.length} system${systems.length === 1 ? '' : 's'} • ${totalFaces} face${totalFaces === 1 ? '' : 's'} registered`;
  }, [systems, hasSystems]);

  const displayName = profileName || user.email || 'User';
  const avatarSrc = profileImageUrl && profileImageUrl.trim() ? profileImageUrl.trim() : null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-400 mb-1">Systems Management</p>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white">Welcome, {displayName}</h1>
              <button
                type="button"
                onClick={onViewProfile}
                className="relative w-12 h-12 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
                aria-label="View profile settings"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-white/80" />
                )}
              </button>
            </div>
            <p className="text-slate-300 mt-2">{systemSummaryText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadSystems}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              New System
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-200 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/40 bg-red-500/10 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 border border-emerald-500/40 bg-emerald-500/10 rounded-lg text-emerald-200">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-300">Loading systems...</div>
        ) : hasSystems ? (
          <div className="grid gap-5 md:grid-cols-2">
            {systems.map((system) => {
              const hasRoomCode = Boolean(system.room_code);

              return (
                <div
                  key={system.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-white">{system.system_name}</h2>
                          <p className="text-sm text-slate-400">System ID: {system.id}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 px-3 py-1 text-sm rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                        onClick={() => onViewSystem(system)}
                      >
                        View
                      </button>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                      <div>
                        <dt className="text-slate-400">Faces</dt>
                        <dd className="text-xl text-white">{system.faces?.length || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Alert</dt>
                        <dd className={system.alert ? 'text-amber-300' : 'text-emerald-300'}>
                          {system.alert ? 'Active' : 'Standby'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Room Code</dt>
                        <dd className={`text-xl ${hasRoomCode ? 'text-white' : 'text-slate-500'}`}>
                          {hasRoomCode ? system.room_code : 'Not set'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                      onClick={() => openRoomCodeModal(system)}
                    >
                      {hasRoomCode ? 'Update Room Code' : 'Add Room Code'}
                    </button>
                    <button
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition"
                      onClick={() => onManageFaces(system)}
                    >
                      Manage Faces
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/20 rounded-2xl bg-white/5">
            <p className="text-lg text-slate-300 mb-4">No systems yet. Create your first system to start managing faces.</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              Create System
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 relative">
            <h2 className="text-2xl font-semibold text-white mb-4">Create New System</h2>
            <p className="text-slate-400 text-sm mb-6">
              Systems allow you to group cameras or locations. You can add and manage authorized faces per system.
            </p>
            {createError && (
              <div className="mb-4 p-3 border border-red-500/40 bg-red-500/10 rounded-lg text-red-200 text-sm">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateSystem} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">System Name</label>
                <input
                  type="text"
                  value={newSystemName}
                  onChange={(event) => setNewSystemName(event.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Office Entry"
                  disabled={creating}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoomCodeModal && selectedSystem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 relative">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {selectedSystem.room_code ? 'Update Room Code' : 'Add Room Code'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {selectedSystem.room_code ? (
                <>
                  Update the room code for <span className="text-white">{selectedSystem.system_name}</span>. Current code:{' '}
                  <span className="text-white">{selectedSystem.room_code}</span>
                </>
              ) : (
                <>
                  Set a room code for <span className="text-white">{selectedSystem.system_name}</span>.
                </>
              )}
            </p>
            {roomCodeError && (
              <div className="mb-4 p-3 border border-red-500/40 bg-red-500/10 rounded-lg text-red-200 text-sm">
                {roomCodeError}
              </div>
            )}
            <form onSubmit={handleRoomCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCodeValue}
                  onChange={(event) => setRoomCodeValue(event.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. XyTv"
                  disabled={roomCodeSubmitting}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeRoomCodeModal}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  disabled={roomCodeSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
                  disabled={roomCodeSubmitting}
                >
                  {roomCodeSubmitting ? 'Saving...' : 'Save Room Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsManagementScreen;
