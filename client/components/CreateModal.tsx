import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { createParameter } from "../api";

interface CreateModalProps {
  defaultPath: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateModal({ defaultPath, onClose, onCreated }: CreateModalProps) {
  const [name, setName] = useState(defaultPath.startsWith("__search__:") ? "/" : defaultPath);
  const [value, setValue] = useState("");
  const [type, setType] = useState("String");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value) {
      toast.error("Name and value are required");
      return;
    }

    setSaving(true);
    try {
      await createParameter(name.trim(), value, type, description || undefined);
      toast.success(`Created ${name.trim()}`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create parameter");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create New Parameter" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="/env/app/PARAM_NAME"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            rows={4}
            className="param-value w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Parameter value..."
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
            {saving ? "Creating..." : "Create Parameter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
