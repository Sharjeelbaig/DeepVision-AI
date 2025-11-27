import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import type { SystemFace, SystemRecord } from '../types/system';
import { normalizeFaces, normalizeSystemRecord } from '../types/system';

interface ManageFacesScreenProps {
  userId: string;
  system: SystemRecord | null;
  onBack: () => void;
}

const API_BASE = 'http://127.0.0.1:5000';

const ManageFacesScreen = ({ userId, system, onBack }: ManageFacesScreenProps) => {
  const [systemDetails, setSystemDetails] = useState<SystemRecord | null>(system);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');
  const [newFaceFile, setNewFaceFile] = useState<File | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [faceToDelete, setFaceToDelete] = useState<SystemFace | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const normalizeInitialSystem = useMemo(() => (system ? normalizeSystemRecord(system) : null), [system]);

  useEffect(() => {
    setSystemDetails(normalizeInitialSystem);
  }, [normalizeInitialSystem]);

  const loadSystemDetails = useCallback(async () => {
    if (!system) {
      setError('System was not provided. Please go back and select a system again.');
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`${API_BASE}/systems/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load system');
      }

      if (!Array.isArray(payload.data)) {
        throw new Error('Unexpected response format');
      }

      const nextSystem = payload.data
        .map((entry) => normalizeSystemRecord(entry))
        .filter((entry): entry is SystemRecord => Boolean(entry))
        .find((entry) => entry.id === system.id);

      if (!nextSystem) {
        throw new Error('System no longer exists or cannot be found.');
      }

      setSystemDetails({ ...nextSystem, faces: normalizeFaces(nextSystem.faces) });
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to load system';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [system, userId]);

  useEffect(() => {
    loadSystemDetails();
  }, [loadSystemDetails]);

  const convertFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });

  const handleAddFace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!systemDetails) {
      setAddError('System not found');
      return;
    }

    const trimmedName = newFaceName.trim();
    if (!trimmedName || !newFaceFile) {
      setAddError('Please provide a name and select an image.');
      return;
    }

    setAdding(true);
    setAddError(null);
    setStatusMessage(null);
    try {
      const base64Image = await convertFileToBase64(newFaceFile);
      const response = await fetch(`${API_BASE}/systems/add-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: systemDetails.id,
          face_base64: base64Image,
          name_of_person: trimmedName,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add face');
      }

      setStatusMessage('Face added successfully');
      setShowAddModal(false);
      setNewFaceName('');
      setNewFaceFile(null);
      await loadSystemDetails();
    } catch (addFaceErr) {
      const message = addFaceErr instanceof Error ? addFaceErr.message : 'Unable to add face';
      setAddError(message);
    } finally {
      setAdding(false);
    }
  };

  const confirmDeleteFace = async () => {
    if (!systemDetails || !faceToDelete) {
      setDeleteError('Face information missing');
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    setStatusMessage(null);
    try {
      const response = await fetch(`${API_BASE}/systems/remove-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: systemDetails.id,
          face_id: faceToDelete.face_id,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to remove face');
      }
      setStatusMessage('Face removed successfully');
      setFaceToDelete(null);
      await loadSystemDetails();
    } catch (deleteErr) {
      const message = deleteErr instanceof Error ? deleteErr.message : 'Unable to remove face';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  const faces = systemDetails?.faces ?? [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to systems
            </button>
            <h1 className="text-4xl font-bold text-white">
              {systemDetails ? systemDetails.system_name : 'Manage Faces'}
            </h1>
            <p className="text-slate-400 mt-2">
              {faces.length} face{faces.length === 1 ? '' : 's'} registered for this system.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadSystemDetails}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white bg-white/5 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setAddError(null);
                setStatusMessage(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
            >
              <PlusCircle className="w-4 h-4" />
              Add Face
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/40 bg-red-500/10 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {statusMessage && (
          <div className="mb-6 p-4 border border-emerald-500/40 bg-emerald-500/10 rounded-lg text-emerald-200">
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-300">Loading faces...</div>
        ) : faces.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {faces.map((face) => (
              <div key={face.face_id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                <div className="relative mb-4">
                  {face.face_url ? (
                    <img
                      src={face.face_url}
                      alt={face.name_of_person ?? 'Registered face'}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-white">
                    {face.name_of_person || 'Unnamed Person'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Face ID: {face.face_id}</p>
                </div>
                <button
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-200 hover:bg-red-500/10"
                  onClick={() => {
                    setDeleteError(null);
                    setFaceToDelete(face);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/20 rounded-2xl bg-white/5">
            <p className="text-lg text-slate-300 mb-4">
              No faces registered yet. Use the button above to add people to this system.
            </p>
            <button
              onClick={() => {
                setAddError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              Add Face
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Add Face</h2>
            <p className="text-slate-400 text-sm mb-6">
              Upload a clear photo and give it a friendly name so your team can recognise it later.
            </p>
            {addError && (
              <div className="mb-4 p-3 border border-red-500/40 bg-red-500/10 rounded-lg text-red-200 text-sm">
                {addError}
              </div>
            )}
            <form onSubmit={handleAddFace} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Person&apos;s Name</label>
                <input
                  type="text"
                  value={newFaceName}
                  onChange={(event) => setNewFaceName(event.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Sarah Connor"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Face Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setNewFaceFile(event.target.files?.[0] ?? null)}
                  className="w-full text-slate-300"
                  disabled={adding}
                  required
                />
                <p className="text-xs text-slate-500 mt-2">Accepted formats: JPEG, PNG. Max 5MB recommended.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!adding) {
                      setShowAddModal(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
                  disabled={adding}
                >
                  {adding ? 'Uploading...' : 'Add Face'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {faceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Remove Face</h2>
            <p className="text-slate-300 text-sm mb-4">
              Are you sure you want to remove {faceToDelete.name_of_person || 'this face'}? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 border border-red-500/40 bg-red-500/10 rounded-lg text-red-200 text-sm">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setFaceToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFace}
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFacesScreen;
