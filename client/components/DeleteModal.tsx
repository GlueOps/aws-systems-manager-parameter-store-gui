import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { deleteParametersApi } from "../api";
import type { SSMParameter } from "../api";

interface DeleteModalProps {
  parameters: SSMParameter[];
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteModal({ parameters, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const requiredConfirm = parameters.length > 1 ? "delete" : "";

  const handleDelete = async () => {
    if (parameters.length > 1 && confirmText !== "delete") {
      toast.error('Type "delete" to confirm');
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteParametersApi(parameters.map((p) => p.Name));

      if (result.failed.length > 0) {
        toast.error(`${result.deleted.length} deleted, ${result.failed.length} failed`);
      } else {
        toast.success(
          `${result.deleted.length} parameter${result.deleted.length !== 1 ? "s" : ""} deleted`
        );
      }

      onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete parameters");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete Parameters" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          ⚠️ This action cannot be undone. The following parameter
          {parameters.length !== 1 ? "s" : ""} will be permanently deleted:
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {parameters.map((p) => (
            <div
              key={p.Name}
              className="text-sm font-mono text-gray-700 px-2 py-1 bg-gray-50 rounded break-all"
            >
              {p.Name}
            </div>
          ))}
        </div>

        {parameters.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-mono font-bold">delete</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
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
            onClick={handleDelete}
            disabled={deleting || (parameters.length > 1 && confirmText !== "delete")}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : `Delete ${parameters.length} Parameter${parameters.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
