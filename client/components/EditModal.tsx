import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { updateParameter } from "../api";
import type { SSMParameter } from "../api";

interface EditModalProps {
  parameter: SSMParameter;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditModal({ parameter, onClose, onUpdated }: EditModalProps) {
  const [value, setValue] = useState(parameter.Value);
  const [type, setType] = useState(parameter.Type);
  const [description, setDescription] = useState(parameter.Description || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      await updateParameter(parameter.Name, value, type, description || undefined);
      toast.success(`Updated ${parameter.Name}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update parameter");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Parameter" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600 break-all">
            {parameter.Name}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="String">String</option>
            <option value="SecureString">SecureString</option>
            <option value="StringList">StringList</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            className="param-value w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-gray-400">
          Current version: v{parameter.Version} · Last modified:{" "}
          {parameter.LastModifiedDate
            ? new Date(parameter.LastModifiedDate).toLocaleString()
            : "—"}
        </div>

        <div className="flex justify-end gap-2 pt-2">
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
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
