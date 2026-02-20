import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { bulkUpdateParameters } from "../api";
import type { SSMParameter } from "../api";

interface BulkEditModalProps {
  parameters: SSMParameter[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function BulkEditModal({ parameters, onClose, onUpdated }: BulkEditModalProps) {
  const [edits, setEdits] = useState(
    parameters.map((p) => ({
      name: p.Name,
      value: p.Value,
      type: p.Type,
      originalValue: p.Value,
    }))
  );
  const [saving, setSaving] = useState(false);

  const updateEdit = (index: number, value: string) => {
    setEdits((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only send changed parameters
    const changed = edits.filter((e) => e.value !== e.originalValue);
    if (changed.length === 0) {
      toast("No changes to save");
      onClose();
      return;
    }

    setSaving(true);
    try {
      const result = await bulkUpdateParameters(
        changed.map((e) => ({ name: e.name, value: e.value, type: e.type }))
      );

      const successes = result.results.filter((r) => r.success).length;
      const failures = result.results.filter((r) => !r.success).length;

      if (failures > 0) {
        toast.error(`${successes} updated, ${failures} failed`);
      } else {
        toast.success(`${successes} parameter${successes !== 1 ? "s" : ""} updated`);
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Bulk Edit (${parameters.length} parameters)`} onClose={onClose} width="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-sm text-gray-500 mb-3">
          Edit values below. Only changed parameters will be updated.
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {edits.map((edit, i) => (
            <div key={edit.name} className="border border-gray-200 rounded p-3">
              <label className="block text-xs font-mono text-gray-500 mb-1 break-all">
                {edit.name}
                <span
                  className={`ml-2 inline-block px-1.5 py-0.5 text-xs rounded ${
                    edit.type === "SecureString"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {edit.type}
                </span>
                {edit.value !== edit.originalValue && (
                  <span className="ml-2 text-yellow-600 text-xs">● modified</span>
                )}
              </label>
              <textarea
                value={edit.value}
                onChange={(e) => updateEdit(i, e.target.value)}
                rows={2}
                className="param-value w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-400">
            {edits.filter((e) => e.value !== e.originalValue).length} of {edits.length} modified
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
