import { useCallback, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import WorkflowEditor from './components/editor/WorkflowEditor';
import WorkflowList from './components/layout/WorkflowList';
import MonitorPanel from './components/monitor/MonitorPanel';
import ToolManager from './components/toolbox/ToolManager';

type RightPanel = 'monitor' | 'tools' | null;

export default function App() {
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');

  const togglePanel = useCallback((panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? null : panel));
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        rightPanel={rightPanel}
        onTogglePanel={togglePanel}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 relative">
          <ReactFlowProvider>
            <WorkflowEditor />
          </ReactFlowProvider>
        </div>

        {rightPanel && (
          <div className="w-96 border-l border-surface-700 bg-surface-800 overflow-y-auto">
            {rightPanel === 'monitor' && <MonitorPanel />}
            {rightPanel === 'tools' && <ToolManager />}
          </div>
        )}
      </div>

      {/* Workflow save/load dialog */}
      <WorkflowList />
    </div>
  );
}
