import { useEffect, useState, useRef } from "react";
import { fetchParameters, searchParameters } from "../api";
import type { SSMParameter } from "../api";

interface ParameterListProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  selected: Set<string>;
  onSelectedChange: (selected: Set<string>) => void;
  onEdit: (param: SSMParameter) => void;
  onHistory: (name: string) => void;
  onParametersLoaded: (params: SSMParameter[]) => void;
  refreshKey: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function ParameterList({
  currentPath,
  onPathChange,
  selected,
  onSelectedChange,
  onEdit,
  onHistory,
  onParametersLoaded,
  refreshKey,
  loading,
  setLoading,
}: ParameterListProps) {
  const [parameters, setParameters] = useState<SSMParameter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set());
  const prevPathRef = useRef(currentPath);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let params: SSMParameter[];

        if (currentPath.startsWith("__search__:")) {
          const query = currentPath.replace("__search__:", "");
          params = await searchParameters(query);
        } else {
          params = await fetchParameters(currentPath);
        }

        if (!cancelled) {
          // Sort by name
          params.sort((a, b) => a.Name.localeCompare(b.Name));
          setParameters(params);
          onParametersLoaded(params);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch parameters");
          setParameters([]);
          onParametersLoaded([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentPath, refreshKey]);

  // Clear selection on path change
  useEffect(() => {
    if (prevPathRef.current !== currentPath) {
      onSelectedChange(new Set());
      setExpandedValues(new Set());
      prevPathRef.current = currentPath;
    }
  }, [currentPath]);

  const toggleSelect = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    onSelectedChange(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === parameters.length) {
      onSelectedChange(new Set());
    } else {
      onSelectedChange(new Set(parameters.map((p) => p.Name)));
    }
  };

  const toggleExpand = (name: string) => {
    const next = new Set(expandedValues);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setExpandedValues(next);
  };

  // Compute unique intermediate path prefixes (subfolders)
  const subfolders = new Set<string>();
  if (!currentPath.startsWith("__search__:")) {
    for (const p of parameters) {
      const relative = p.Name.slice(currentPath.length);
      const slashIdx = relative.indexOf("/");
      if (slashIdx > 0) {
        subfolders.add(currentPath + relative.slice(0, slashIdx + 1));
      }
    }
  }

  const typeBadgeColor = (type: string) => {
    switch (type) {
      case "SecureString":
        return "bg-purple-100 text-purple-800";
      case "StringList":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const truncateValue = (value: string, maxLen = 80) => {
    if (value.length <= maxLen) return value;
    return value.slice(0, maxLen) + "…";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 text-sm">Loading parameters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (parameters.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">📭</div>
        <div className="text-sm">No parameters found at this path.</div>
        <div className="text-xs mt-1 text-gray-300">
          Try browsing a different path or use search.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Subfolder quick-nav */}
      {subfolders.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 self-center mr-1">Subpaths:</span>
          {Array.from(subfolders)
            .sort()
            .map((folder) => (
              <button
                key={folder}
                onClick={() => onPathChange(folder)}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors font-mono"
              >
                {folder}
              </button>
            ))}
        </div>
      )}

      {/* Parameter table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === parameters.length && parameters.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="w-28 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="w-16 px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ver
              </th>
              <th className="w-44 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
              <th className="w-28 px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parameters.map((param) => {
              const isExpanded = expandedValues.has(param.Name);
              const isLong = param.Value.length > 80;

              return (
                <tr
                  key={param.Name}
                  className={`hover:bg-gray-50 transition-colors ${
                    selected.has(param.Name) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(param.Name)}
                      onChange={() => toggleSelect(param.Name)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm font-mono text-gray-800 break-all">
                      {param.Name}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-mono text-gray-600 break-all">
                      {isExpanded ? param.Value : truncateValue(param.Value)}
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(param.Name)}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? "less" : "more"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${typeBadgeColor(
                        param.Type
                      )}`}
                    >
                      {param.Type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-sm text-gray-500">
                    v{param.Version}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {param.LastModifiedDate
                      ? new Date(param.LastModifiedDate).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(param)}
                        className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onHistory(param.Name)}
                        className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                        title="History"
                      >
                        🕐
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-right">
        {parameters.length} parameter{parameters.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
