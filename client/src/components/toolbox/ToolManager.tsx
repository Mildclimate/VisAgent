import { useEffect, useState } from 'react';
import { Wrench, Plus, ToggleLeft, ToggleRight, Trash2, RefreshCw } from 'lucide-react';
import { useToolStore } from '../../stores/toolStore';
import { api } from '../../lib/api';
import type { ToolDefinition } from '@visagent/shared';

export default function ToolManager() {
  const { tools, setTools, loading, setLoading } = useToolStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolDefinition | null>(null);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'custom' as string,
    parameters: '[]',
  });

  const loadTools = async () => {
    setLoading(true);
    try {
      const data = await api.getTools();
      setTools(data);
    } catch (err) {
      console.error('Failed to load tools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const handleToggle = async (tool: ToolDefinition) => {
    try {
      await api.toggleTool(tool.name);
      setTools(
        tools.map((t) => (t.name === tool.name ? { ...t, enabled: !t.enabled } : t)),
      );
    } catch (err) {
      console.error('Failed to toggle tool:', err);
    }
  };

  const handleDelete = async (toolName: string) => {
    if (!confirm(`Delete tool "${toolName}"?`)) return;
    try {
      await api.deleteTool(toolName);
      setTools(tools.filter((t) => t.name !== toolName));
    } catch (err) {
      console.error('Failed to delete tool:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      let parameters;
      try {
        parameters = JSON.parse(form.parameters);
      } catch {
        alert('Invalid JSON in parameters field');
        return;
      }

      const data = {
        ...form,
        parameters,
        inputSchema: {
          type: 'object',
          properties: Object.fromEntries(
            parameters.map((p: any) => [
              p.name,
              { type: p.type, description: p.description },
            ]),
          ),
          required: parameters.filter((p: any) => p.required).map((p: any) => p.name),
        },
      };

      if (editingTool) {
        await api.updateTool(editingTool.name, data);
      } else {
        await api.createTool(data);
      }

      setShowForm(false);
      setEditingTool(null);
      setForm({ name: '', displayName: '', description: '', category: 'custom', parameters: '[]' });
      await loadTools();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openEdit = (tool: ToolDefinition) => {
    setEditingTool(tool);
    setForm({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      category: tool.category,
      parameters: JSON.stringify(tool.parameters, null, 2),
    });
    setShowForm(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Wrench size={15} className="text-primary-400" />
          Tool Registry
        </h3>
        <button
          onClick={() => {
            setEditingTool(null);
            setForm({ name: '', displayName: '', description: '', category: 'custom', parameters: '[]' });
            setShowForm(!showForm);
          }}
          className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Tool registration form */}
      {showForm && (
        <div className="p-4 border-b border-surface-700 bg-surface-800/50 space-y-3">
          <input
            className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            placeholder="Tool name (e.g., web_search)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!!editingTool}
          />
          <input
            className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <textarea
            className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white resize-y min-h-[50px] outline-none focus:border-primary-500"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="search">Search</option>
            <option value="code">Code</option>
            <option value="api">API</option>
            <option value="data">Data</option>
            <option value="custom">Custom</option>
          </select>
          <textarea
            className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white font-mono resize-y min-h-[80px] outline-none focus:border-primary-500"
            placeholder='Parameters (JSON): [{"name":"query","type":"string","description":"Search query","required":true}]'
            value={form.parameters}
            onChange={(e) => setForm({ ...form, parameters: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded py-2 transition-colors"
            >
              {editingTool ? 'Update' : 'Register'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingTool(null);
              }}
              className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-surface-300 text-sm rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="text-surface-500 animate-spin" />
          </div>
        ) : tools.length === 0 ? (
          <p className="text-xs text-surface-500 text-center py-8">
            No tools registered yet. Click + to add one.
          </p>
        ) : (
          <div className="divide-y divide-surface-700/50">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="p-3 hover:bg-surface-700/30 transition-colors cursor-pointer"
                onClick={() => openEdit(tool)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {tool.displayName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        tool.enabled
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-surface-600/50 text-surface-500'
                      }`}>
                        {tool.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5 truncate">{tool.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-surface-500 bg-surface-700/50 px-1.5 py-0.5 rounded">
                        {tool.category}
                      </span>
                      <span className="text-[10px] text-surface-500">
                        {tool.parameters.length} params
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggle(tool)}
                    className="p-1 rounded hover:bg-surface-600 text-surface-400 hover:text-white transition-colors"
                    title={tool.enabled ? 'Disable' : 'Enable'}
                  >
                    {tool.enabled ? (
                      <ToggleRight size={16} className="text-green-400" />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(tool.name)}
                    className="p-1 rounded hover:bg-red-600/20 text-surface-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
