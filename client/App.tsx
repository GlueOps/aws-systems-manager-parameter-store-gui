import { useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import ParameterList from "./components/ParameterList";
import CreateModal from "./components/CreateModal";
import EditModal from "./components/EditModal";
import BulkEditModal from "./components/BulkEditModal";
import CopyModal from "./components/CopyModal";
import DeleteModal from "./components/DeleteModal";
import HistoryModal from "./components/HistoryModal";
import type { SSMParameter } from "./api";

export default function App() {
  const [currentPath, setCurrentPath] = useState("/");
  const [parameters, setParameters] = useState<SSMParameter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editParam, setEditParam] = useState<SSMParameter | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyParam, setHistoryParam] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setSelected(new Set());
  }, []);

  const selectedParams = parameters.filter((p) => selected.has(p.Name));

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header
        currentPath={currentPath}
        onPathChange={setCurrentPath}
        onRefresh={refresh}
        onCreateNew={() => setCreateOpen(true)}
        selectedCount={selected.size}
        onBulkEdit={() => setBulkEditOpen(true)}
        onCopy={() => setCopyOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <ParameterList
          currentPath={currentPath}
          onPathChange={setCurrentPath}
          selected={selected}
          onSelectedChange={setSelected}
          onEdit={setEditParam}
          onHistory={(name) => setHistoryParam(name)}
          onParametersLoaded={setParameters}
          refreshKey={refreshKey}
          loading={loading}
          setLoading={setLoading}
        />
      </main>

      {createOpen && (
        <CreateModal
          defaultPath={currentPath}
          onClose={() => setCreateOpen(false)}
          onCreated={refresh}
        />
      )}

      {editParam && (
        <EditModal
          parameter={editParam}
          onClose={() => setEditParam(null)}
          onUpdated={refresh}
        />
      )}

      {bulkEditOpen && selectedParams.length > 0 && (
        <BulkEditModal
          parameters={selectedParams}
          onClose={() => setBulkEditOpen(false)}
          onUpdated={refresh}
        />
      )}

      {copyOpen && selectedParams.length > 0 && (
        <CopyModal
          parameters={selectedParams}
          currentPath={currentPath}
          onClose={() => setCopyOpen(false)}
          onCopied={refresh}
        />
      )}

      {deleteOpen && selectedParams.length > 0 && (
        <DeleteModal
          parameters={selectedParams}
          onClose={() => setDeleteOpen(false)}
          onDeleted={refresh}
        />
      )}

      {historyParam && (
        <HistoryModal
          parameterName={historyParam}
          onClose={() => setHistoryParam(null)}
        />
      )}
    </div>
  );
}
