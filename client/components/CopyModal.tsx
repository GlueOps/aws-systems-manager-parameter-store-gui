import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { copyParameters } from "../api";
import type { SSMParameter } from "../api";

interface CopyModalProps {
  parameters: SSMParameter[];
  currentPath: string;
  onClose: () => void;
  onCopied: () => void;
}

export default function CopyModal({ parameters, currentPath, onClose, onCopied }: CopyModalProps) {
  // Auto-detect common prefix from selected parameters
  const detectedPrefix = useMemo(() => {
    if (currentPath.startsWith("__search__:")) {
      // Find common prefix from parameter names
      const names = parameters.map((p) => p.Name);
      if (names.length === 0) return "/";
      let prefix = names[0];
      for (const name of names.slice(1)) {
        while (!name.startsWith(prefix)) {
          prefix = prefix.slice(0, prefix.lastIndexOf("/") + 1);
          if (!prefix) return "/";
        }
      }
      return prefix;
    }
    return currentPath;
  }, [parameters, currentPath]);

  const [sourcePrefix, setSourcePrefix] = useState(detectedPrefix);
  const [targetPrefix, setTargetPrefix] = useState("");
  const [copying, setCopying] = useState(false);

  // Preview the new names
  const previews = parameters.map((p) => ({
    original: p.Name,
    newName: targetPrefix ? p.Name.replace(sourcePrefix, targetPrefix) : "",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetPrefix.trim()) {
      toast.error("Target prefix is required");
      return;
    }

    setCopying(true);
    try {
      const result = await copyParameters(
        parameters.map((p) => p.Name),
        sourcePrefix,
        targetPrefix.trim()
      );

      if (result.failed.length > 0) {
        toast.error(`${result.copied.length} copied, ${result.failed.length} failed`);
      } else {
        toast.success(`${result.copied.length} parameter${result.copied.length !== 1 ? "s" : ""} copied`);
      }

      onCopied();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to copy parameters");
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      title={`Copy ${parameters.length} Parameter${parameters.length !== 1 ? "s" : ""}`}
      onClose={onClose}
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Prefix
            </label>
            <input
              type="text"
              value={sourcePrefix}
              onChange={(e) => setSourcePrefix(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-400 mt-1">This prefix will be replaced</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Prefix
            </label>
            <input
              type="text"
              value={targetPrefix}
              onChange={(e) => setTargetPrefix(e.target.value)}
              placeholder="/staging/app/"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="text-xs text-gray-400 mt-1">New prefix for the copied parameters</div>
          </div>
        </div>

        {/* Preview */}
        {targetPrefix && (
          <div className="bg-gray-50 rounded border border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Preview
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {previews.map((p) => (
                <div key={p.original} className="text-xs font-mono">
                  <span className="text-gray-400">{p.original}</span>
                  <span className="mx-2 text-gray-300">→</span>
                  <span className="text-green-700 font-medium">{p.newName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={copying || !targetPrefix.trim()}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {copying ? "Copying..." : "Copy Parameters"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
