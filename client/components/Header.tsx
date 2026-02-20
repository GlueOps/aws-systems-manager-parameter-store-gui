import { useState } from "react";

interface HeaderProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  selectedCount: number;
  onBulkEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export default function Header({
  currentPath,
  onPathChange,
  onRefresh,
  onCreateNew,
  selectedCount,
  onBulkEdit,
  onCopy,
  onDelete,
}: HeaderProps) {
  const [pathInput, setPathInput] = useState(currentPath);
  const [searchInput, setSearchInput] = useState("");
  const [mode, setMode] = useState<"browse" | "search">("browse");

  const handleBrowse = (e: React.FormEvent) => {
    e.preventDefault();
    let path = pathInput.trim();
    if (!path.startsWith("/")) path = "/" + path;
    if (!path.endsWith("/")) path = path + "/";
    setPathInput(path);
    onPathChange(path);
    setMode("browse");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onPathChange(`__search__:${searchInput.trim()}`);
      setMode("search");
    }
  };

  // Breadcrumb segments
  const segments = currentPath.split("/").filter(Boolean);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🔐</span> SSM Parameter Store
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateNew}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              + New Parameter
            </button>
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Path + Search row */}
        <div className="flex gap-3 mb-3">
          <form onSubmit={handleBrowse} className="flex-1 flex gap-2">
            <input
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="Enter path prefix, e.g. /dev/myapp/"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-900 transition-colors"
            >
              Browse
            </button>
          </form>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name..."
              className="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-900 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Breadcrumbs */}
        {mode === "browse" && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <button
              onClick={() => {
                setPathInput("/");
                onPathChange("/");
              }}
              className="hover:text-blue-600 transition-colors"
            >
              /
            </button>
            {segments.map((seg, i) => {
              const pathUpTo = "/" + segments.slice(0, i + 1).join("/") + "/";
              return (
                <span key={pathUpTo} className="flex items-center">
                  <span className="mx-1 text-gray-300">/</span>
                  <button
                    onClick={() => {
                      setPathInput(pathUpTo);
                      onPathChange(pathUpTo);
                    }}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {mode === "search" && (
          <div className="text-sm text-gray-500 mb-2">
            Searching for: <span className="font-mono font-medium text-gray-700">{searchInput}</span>
            <button
              onClick={() => {
                setMode("browse");
                onPathChange(pathInput);
              }}
              className="ml-3 text-blue-600 hover:text-blue-800"
            >
              ← Back to browsing
            </button>
          </div>
        )}

        {/* Bulk actions bar */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-3 py-2 px-3 bg-blue-50 rounded border border-blue-200">
            <span className="text-sm font-medium text-blue-800">
              {selectedCount} parameter{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={onBulkEdit}
                className="px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded hover:bg-yellow-600 transition-colors"
              >
                ✏️ Bulk Edit
              </button>
              <button
                onClick={onCopy}
                className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
              >
                📋 Copy
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
