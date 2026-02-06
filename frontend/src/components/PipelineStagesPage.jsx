import { useEffect, useMemo, useState } from 'react';
import BuildLogsModal from './BuildLogsModal';
import { jenkinsService } from '../services/jenkinsService';
import { formatStatus, getStatusClass } from '../utils/formatters';

const STATUS_CLASS_MAP = {
  SUCCESS: 'success',
  FAILED: 'failure',
  FAILURE: 'failure',
  ABORTED: 'warning',
  SKIPPED: 'skipped',
  NOT_BUILT: 'skipped',
  IN_PROGRESS: 'in-progress',
  RUNNING: 'in-progress',
  QUEUED: 'in-progress',
};

function PipelineStagesPage({ jobName, build, onBack, onLogout }) {
  const [stageData, setStageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logsBuild, setLogsBuild] = useState(null);
  const [logsContent, setLogsContent] = useState('');
  const [logsCommand, setLogsCommand] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  useEffect(() => {
    if (!jobName || !build?.buildNumber) return;
    const loadStages = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await jenkinsService.getBuildStages(jobName, build.buildNumber);
        setStageData(data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          onLogout?.();
        } else {
          setError('Unable to load pipeline stages.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadStages();
  }, [jobName, build?.buildNumber, onLogout]);

  const handleViewLogs = async () => {
    if (!jobName || !build?.buildNumber) return;

    setLogsBuild(build);
    setLogsLoading(true);
    setLogsError('');
    setLogsContent('');
    setLogsCommand('');

    try {
      const data = await jenkinsService.getBuildLogs(jobName, build.buildNumber);
      setLogsContent(data.logs || '');
      setLogsCommand(data.command || 'Pipeline');
    } catch (err) {
      setLogsError('Unable to load logs for this build.');
    } finally {
      setLogsLoading(false);
    }
  };

  const graphData = useMemo(() => {
    const stages = stageData?.stages || [];
    const stageNodes = stages.map((stage) => ({
      ...stage,
      normalizedStatus: STATUS_CLASS_MAP[String(stage.status || '').toUpperCase()] || 'unknown',
    }));

    return stageNodes;
  }, [stageData]);

  const failedStageIndex = useMemo(() => {
    if (!stageData?.failedStage) return -1;
    return graphData.findIndex((stage) => stage.name === stageData.failedStage);
  }, [graphData, stageData?.failedStage]);

  const renderGraph = () => {
    const totalStages = graphData.length;
    const nodeCount = totalStages + 2; // start + end
  const nodeGap = 200;
  const startX = 90;
  const centerY = 120;
    const endX = startX + nodeGap * (nodeCount - 1);
    const viewWidth = endX + startX;
  const viewHeight = 320;

    const splitLabel = (label, maxLength = 14) => {
      if (!label) return [];
      const words = label.split(' ');
      const lines = [];
      let current = '';

      words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxLength) {
          current = next;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });

      if (current) lines.push(current);
      return lines.length ? lines : [label];
    };

    const nodePositions = [
      { x: startX, label: 'Start', status: 'skipped', type: 'start' },
      ...graphData.map((stage, index) => ({
        x: startX + nodeGap * (index + 1),
        label: stage.name,
        status: stage.normalizedStatus,
        type: 'stage',
      })),
      { x: endX, label: 'End', status: 'skipped', type: 'end' },
    ];

    return (
      <div className="pipeline-graph">
        <svg
          className="pipeline-graph-svg"
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {nodePositions.slice(0, -1).map((node, index) => {
            const nextNode = nodePositions[index + 1];
            const stageStatus = index === 0
              ? graphData[0]?.normalizedStatus
              : graphData[index - 1]?.normalizedStatus;
            const lineStatus = stageStatus || 'skipped';

            return (
              <line
                key={`line-${index}`}
                x1={node.x}
                y1={centerY}
                x2={nextNode.x}
                y2={centerY}
                className={`pipeline-line ${lineStatus}`}
              />
            );
          })}

          {failedStageIndex >= 0 && failedStageIndex < graphData.length - 1 && (
            <path
              className="pipeline-failure-link"
              d={`M ${startX + nodeGap * (failedStageIndex + 1)} ${centerY} V ${centerY + 30} H ${endX} V ${centerY}`}
            />
          )}

          {nodePositions.map((node, index) => (
            <g key={`node-${index}`}>
              <circle
                cx={node.x}
                cy={centerY}
                r={node.type === 'stage' ? 12 : 7}
                className={`pipeline-node ${node.status} ${node.type}`}
              />
              {node.type === 'stage' && (
                <text
                  x={node.x}
                  y={centerY - 36}
                  textAnchor="middle"
                  className="pipeline-stage-label"
                >
                  {splitLabel(node.label).map((line, lineIndex) => (
                    <tspan
                      key={`${node.label}-${lineIndex}`}
                      x={node.x}
                      dy={lineIndex === 0 ? 0 : 16}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const steps = stageData?.steps || [];
  const failedStageName = stageData?.failedStage;

  return (
    <div className="pipeline-stages-view">
      <div className="pipeline-stages-header">
        <div>
          <button type="button" className="ghost-button" onClick={onBack}>Back</button>
          <h2>{jobName} · Build #{build?.buildNumber}</h2>
        </div>
        <button type="button" className="primary-button" onClick={handleViewLogs}>
          View Full Logs
        </button>
      </div>

      <div className="pipeline-stages-subheader">
        <div className={`status-pill ${getStatusClass(build?.status)}`}>
          {formatStatus(build?.status)}
        </div>
        {failedStageName && (
          <div className="failed-stage-chip">Failed at {failedStageName}</div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading pipeline stages...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {renderGraph()}

          <div className="pipeline-steps-section">
            <h3>Failed Stage Steps</h3>
            {steps.length === 0 ? (
              <div className="muted-card">No step logs available for this stage.</div>
            ) : (
              <div className="pipeline-steps-list">
                {steps.map((step, index) => (
                  <details key={`${step.name}-${index}`} className="pipeline-step">
                    <summary>
                      <span className="pipeline-step-name">{step.name}</span>
                      <span className={`pipeline-step-status ${step.status}`}> {step.status}</span>
                    </summary>
                    <pre className="pipeline-step-logs">{step.logs}</pre>
                  </details>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {logsBuild && (
        <BuildLogsModal
          build={logsBuild}
          logs={logsContent}
          command={logsCommand}
          loading={logsLoading}
          error={logsError}
          onClose={() => {
            setLogsBuild(null);
            setLogsError('');
            setLogsContent('');
            setLogsCommand('');
          }}
        />
      )}
    </div>
  );
}

export default PipelineStagesPage;
