import { useEffect, useState } from "react";
import Modal from "./Modal";
import { fetchParameterHistory } from "../api";
import type { SSMParameterHistory } from "../api";

interface HistoryModalProps {
  parameterName: string;
  onClose: () => void;
}

export default function HistoryModal({ parameterName, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<SSMParameterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchParameterHistory(parameterName);
        if (!cancelled) {
          // Sort by version descending (newest first)
          data.sort((a, b) => b.Version - a.Version);
          setHistory(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [parameterName]);

  const toggleExpand = (version: number) => {
    const next = new Set(expandedVersions);
    if (next.has(version)) {
      next.delete(version);
    } else {
      next.add(version);
    }
    setExpandedVersions(next);
  };

  return (
    <Modal title="Parameter History" onClose={onClose} width="max-w-2xl">
      <div className="mb-3">
        <div className="text-sm font-mono text-gray-600 break-all bg-gray-50 px-3 py-2 rounded">
          {parameterName}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500 py-4 text-center">Loading history...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="text-sm text-gray-400 py-4 text-center">No history available.</div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((entry) => {
            const isExpanded = expandedVersions.has(entry.Version);
            const isLong = entry.Value.length > 100;

            return (
              <div
                key={entry.Version}
                className="border border-gray-200 rounded p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      v{entry.Version}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-xs rounded ${
                        entry.Type === "SecureString"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {entry.Type}
                    </span>
                    {entry.Version === history[0].Version && (
                      <span className="inline-block px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        current
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {entry.LastModifiedDate
                      ? new Date(entry.LastModifiedDate).toLocaleString()
                      : "—"}
                  </span>
                </div>

                <div className="text-sm font-mono text-gray-600 break-all bg-gray-50 px-2 py-1.5 rounded">
                  {isExpanded || !isLong
                    ? entry.Value
                    : entry.Value.slice(0, 100) + "…"}
                  {isLong && (
                    <button
                      onClick={() => toggleExpand(entry.Version)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? "less" : "more"}
                    </button>
                  )}
                </div>

                {entry.Description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {entry.Description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-3 mt-3 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
