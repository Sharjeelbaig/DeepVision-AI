import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { SystemRecord, MonitoredDetection } from '../types/system';
import { normalizeSystemRecord } from '../types/system';

interface ViewSystemScreenProps {
  userId: string;
  system: SystemRecord;
  onBack: () => void;
}

const API_BASE = 'http://127.0.0.1:5000';

const ViewSystemScreen = ({ userId, system, onBack }: ViewSystemScreenProps) => {
  const [details, setDetails] = useState<SystemRecord>(system);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetails(system);
  }, [system]);

  const fetchDetails = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/systems/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load system details');
      }

      const normalizedSystems = Array.isArray(payload.data)
        ? payload.data
            .map((item: unknown) => normalizeSystemRecord(item))
            .filter((item: SystemRecord | null): item is SystemRecord => Boolean(item))
        : [];

      const updated = normalizedSystems.find((item: SystemRecord) => item.id === system.id);
      if (updated) {
        setDetails(updated);
      } else if (normalizedSystems.length > 0) {
        setError('System not found in the latest data');
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to load system details';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [system.id, userId]);

  const handleRefresh = useCallback(() => {
    void fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    setLoading(true);
    void fetchDetails();
  }, [fetchDetails]);

  const detection: MonitoredDetection | null = useMemo(() => {
    return details.monitored_data ?? null;
  }, [details.monitored_data]);

  const detectionBox = detection?.box ?? null;
  const detectionScore =
    typeof detection?.score === 'number' && Number.isFinite(detection.score)
      ? `${(detection.score * 100).toFixed(1)}%`
      : 'N/A';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Systems
            </button>
            <h1 className="text-2xl font-semibold text-white">{details.system_name}</h1>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 border border-red-500/40 bg-red-500/10 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32 text-slate-300">
            Loading system details...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Monitored View</h2>
                <p className="text-sm text-slate-400">Image provided by the monitoring system.</p>
              </div>
              <div className="p-5">
                {details.monitored_image_url ? (
                  <img
                    src={details.monitored_image_url}
                    alt={`Monitored scene for ${details.system_name}`}
                    className="w-full rounded-xl border border-white/10 object-contain"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center rounded-xl border border-dashed border-white/20 text-slate-400">
                    No monitored image available.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4">Detection Summary</h2>
                {detection ? (
                  <dl className="space-y-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Label</dt>
                      <dd className="text-white">{detection.label ?? 'Unknown'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Confidence</dt>
                      <dd className="text-white">{detectionScore}</dd>
                    </div>
                    {detectionBox ? (
                      <div>
                        <dt className="text-slate-400 mb-1">Bounding Box</dt>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <span>X Min: <span className="text-white">{detectionBox.xmin ?? '—'}</span></span>
                          <span>X Max: <span className="text-white">{detectionBox.xmax ?? '—'}</span></span>
                          <span>Y Min: <span className="text-white">{detectionBox.ymin ?? '—'}</span></span>
                          <span>Y Max: <span className="text-white">{detectionBox.ymax ?? '—'}</span></span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400">No bounding box data available.</div>
                    )}
                  </dl>
                ) : (
                  <p className="text-slate-400">No monitoring data captured yet.</p>
                )}
              </div>

              {/* {detection && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Raw Detection Payload</h3>
                  <pre className="text-xs text-slate-300 bg-black/40 rounded-xl p-4 overflow-x-auto">
                    {JSON.stringify(detection, null, 2)}
                  </pre>
                </div>
              )} */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSystemScreen;
