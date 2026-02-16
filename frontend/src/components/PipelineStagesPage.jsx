    import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= breakpoint);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

function PipelineStagesPage({ jobName, build, onBack, onLogout }) {
  const [stageData, setStageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logsBuild, setLogsBuild] = useState(null);
  const [logsContent, setLogsContent] = useState('');
  const [logsCommand, setLogsCommand] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const trackRef = useRef(null);
  const failedDotRef = useRef(null);
  const failedNextDotRef = useRef(null);
  const penultimateDotRef = useRef(null);
  const endDotRef = useRef(null);
  const [failurePath, setFailurePath] = useState('');
  const [failureBox, setFailureBox] = useState({ width: 0, height: 0 });
  const isMobile = useIsMobile();

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

  const buildStatusValue = String(build?.status || '').toLowerCase();
  const isFailure = ['failed', 'failure'].includes(buildStatusValue);

  const failedStageIndex = useMemo(() => {
    if (!stageData?.failedStage || !isFailure) return -1;
    return graphData.findIndex((stage) => stage.name === stageData.failedStage);
  }, [graphData, stageData?.failedStage, isFailure]);

  useLayoutEffect(() => {
    if (
      !trackRef.current
      || !failedDotRef.current
      || !failedNextDotRef.current
      || !penultimateDotRef.current
      || !endDotRef.current
    ) {
      setFailurePath('');
      return;
    }

    const trackRect = trackRef.current.getBoundingClientRect();
    const failedRect = failedDotRef.current.getBoundingClientRect();
  const nextRect = failedNextDotRef.current.getBoundingClientRect();
  const penultimateRect = penultimateDotRef.current.getBoundingClientRect();
  const endRect = endDotRef.current.getBoundingClientRect();

  const failedCenterX = failedRect.left - trackRect.left + failedRect.width / 2;
  const failedCenterY = failedRect.top - trackRect.top + failedRect.height / 2;
  const nextCenterX = nextRect.left - trackRect.left + nextRect.width / 2;
  const nextCenterY = nextRect.top - trackRect.top + nextRect.height / 2;
  const penultimateCenterX = penultimateRect.left - trackRect.left + penultimateRect.width / 2;
  const penultimateCenterY = penultimateRect.top - trackRect.top + penultimateRect.height / 2;
  const endCenterX = endRect.left - trackRect.left + endRect.width / 2;
  const endCenterY = endRect.top - trackRect.top + endRect.height / 2;

  const startX = (failedCenterX + nextCenterX) / 2;
  const startY = (failedCenterY + nextCenterY) / 2;
  const endX = endCenterX;
  const endY = endCenterY;

  const drop = 58;
  const span = Math.max(endX - startX, 0);
  const controlOffset = Math.min(170, Math.max(58, span * 0.24));
  const earlyPull = Math.min(68, Math.max(18, controlOffset * 0.32));

    const path = `M ${startX} ${startY}`
      + ` C ${startX + earlyPull} ${startY}, ${startX + earlyPull} ${startY + drop}, ${startX + controlOffset} ${startY + drop}`
      + ` L ${endX - controlOffset} ${startY + drop}`
      + ` C ${endX - controlOffset / 2} ${startY + drop}, ${endX - controlOffset / 2} ${endY}, ${endX} ${endY}`;

    setFailureBox({ width: trackRect.width, height: trackRect.height });
    setFailurePath(path);
  }, [failedStageIndex, graphData]);

  useEffect(() => {
  if (!trackRef.current) return undefined;

    const observer = new ResizeObserver(() => {
      if (
        failedDotRef.current
        && failedNextDotRef.current
        && penultimateDotRef.current
        && endDotRef.current
      ) {
        const trackRect = trackRef.current.getBoundingClientRect();
        const failedRect = failedDotRef.current.getBoundingClientRect();
        const nextRect = failedNextDotRef.current.getBoundingClientRect();
        const penultimateRect = penultimateDotRef.current.getBoundingClientRect();
        const endRect = endDotRef.current.getBoundingClientRect();

        const failedCenterX = failedRect.left - trackRect.left + failedRect.width / 2;
        const failedCenterY = failedRect.top - trackRect.top + failedRect.height / 2;
        const nextCenterX = nextRect.left - trackRect.left + nextRect.width / 2;
        const nextCenterY = nextRect.top - trackRect.top + nextRect.height / 2;
        const penultimateCenterX = penultimateRect.left - trackRect.left + penultimateRect.width / 2;
        const penultimateCenterY = penultimateRect.top - trackRect.top + penultimateRect.height / 2;
        const endCenterX = endRect.left - trackRect.left + endRect.width / 2;
        const endCenterY = endRect.top - trackRect.top + endRect.height / 2;

        const startX = (failedCenterX + nextCenterX) / 2;
        const startY = (failedCenterY + nextCenterY) / 2;
  const endX = endCenterX;
  const endY = endCenterY;
  const drop = 58;
  const span = Math.max(endX - startX, 0);
  const controlOffset = Math.min(170, Math.max(58, span * 0.24));
  const earlyPull = Math.min(68, Math.max(18, controlOffset * 0.32));

        const path = `M ${startX} ${startY}`
          + ` C ${startX + earlyPull} ${startY}, ${startX + earlyPull} ${startY + drop}, ${startX + controlOffset} ${startY + drop}`
          + ` L ${endX - controlOffset} ${startY + drop}`
          + ` C ${endX - controlOffset / 2} ${startY + drop}, ${endX - controlOffset / 2} ${endY}, ${endX} ${endY}`;

        setFailureBox({ width: trackRect.width, height: trackRect.height });
        setFailurePath(path);
      }
    });

    observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, []);

  const renderGraph = () => {
  const totalStages = graphData.length;
  const nodeCount = totalStages + 2; // start + end
  const lineCenter = 150;

    const nodePositions = [
      { label: 'Start', status: 'skipped', type: 'start' },
      ...graphData.map((stage) => ({
        label: stage.name,
        status: stage.normalizedStatus,
        type: 'stage',
      })),
      { label: 'End', status: 'skipped', type: 'end' },
    ];

  const failedNodeIndex = failedStageIndex >= 0 ? failedStageIndex + 1 : -1;
  const failedNextNodeIndex = failedNodeIndex >= 0 ? failedNodeIndex + 1 : -1;
  const penultimateNodeIndex = nodePositions.length - 2;

    return (
      <div className="pipeline-graph pipeline-graph-html">
        <div
          ref={trackRef}
          className="pipeline-track"
          style={{
            '--line-center': `${lineCenter}px`,
          }}
        >
          {nodePositions.map((node, index) => {
            const lineStatus = index === 0
              ? graphData[0]?.normalizedStatus
              : graphData[index - 1]?.normalizedStatus;
            const isFailedNode = index === failedNodeIndex;
            const isPenultimateNode = index === penultimateNodeIndex;
            const isEndNode = index === nodePositions.length - 1;
            const isFailureEnd = isEndNode && failedNodeIndex >= 0;
            const isFailedNextNode = index === failedNextNodeIndex;

            return (
              <div key={`${node.label}-${index}`} className={`pipeline-node-wrapper ${node.type}`}>
                {node.type === 'stage' && (
                  <div className="pipeline-stage-label">{node.label}</div>
                )}
                <div
                  ref={isFailedNode ? failedDotRef
                    : isFailedNextNode ? failedNextDotRef
                      : isPenultimateNode ? penultimateDotRef
                        : isEndNode ? endDotRef : undefined}
                  className={`pipeline-node-dot ${node.status} ${node.type} ${isFailureEnd ? 'failure-end' : ''}`}
                />
                {index < nodePositions.length - 1 && (
                  <div className={`pipeline-segment ${lineStatus || 'skipped'}`} />
                )}
              </div>
            );
          })}

          {failedNodeIndex >= 0 && failedStageIndex < graphData.length - 1 && failurePath && (
            <svg
              className="pipeline-failure-svg"
              viewBox={`0 0 ${failureBox.width} ${failureBox.height}`}
              preserveAspectRatio="none"
            >
              <path className="pipeline-failure-path" d={failurePath} />
            </svg>
          )}
        </div>
      </div>
    );
  };

  const renderMobileGraph = () => {
    const stageNodes = graphData.map((stage, index) => ({
      ...stage,
      stageIndex: index,
    }));

    const rowHeight = 56;
    const failedRowIndex = failedStageIndex >= 0 ? failedStageIndex + 1 : -1;
    const endRowIndex = stageNodes.length + 1;
    const failureLineStart = failedRowIndex >= 0 ? failedRowIndex * rowHeight + 16 : 0;
    const failureLineEnd = failedRowIndex >= 0 ? endRowIndex * rowHeight + 16 : 0;
    const failurePath = failedRowIndex >= 0
      ? `M 24 ${failureLineStart} C 8 ${failureLineStart}, 8 ${failureLineStart + 14}, 8 ${failureLineStart + 28}`
        + ` L 8 ${failureLineEnd - 28}`
        + ` C 8 ${failureLineEnd - 14}, 8 ${failureLineEnd}, 24 ${failureLineEnd}`
      : '';

    return (
      <div className="pipeline-graph pipeline-graph-mobile">
        <div
          className="pipeline-mobile-track"
          style={failedRowIndex >= 0 ? {
            '--failure-start': `${failureLineStart}px`,
            '--failure-end': `${failureLineEnd}px`,
          } : undefined}
        >
          {failedRowIndex >= 0 && (
            <svg
              className="pipeline-mobile-failure-svg"
              viewBox={`0 0 32 ${failureLineEnd + 20}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path className="pipeline-mobile-failure-path" d={failurePath} />
            </svg>
          )}
          {/* Start node */}
          <div className="pipeline-mobile-node-row">
            <div className="pipeline-mobile-node-col">
              <div className="pipeline-mobile-dot skipped start" />
              {stageNodes.length > 0 && <div className={`pipeline-mobile-segment ${stageNodes[0]?.normalizedStatus || 'skipped'}`} />}
            </div>
            <div className="pipeline-mobile-label-col">
              <span className="pipeline-mobile-label-text muted">Start</span>
            </div>
          </div>

          {stageNodes.map((stage, index) => {
            const nextStatus = index < stageNodes.length - 1
              ? stageNodes[index + 1].normalizedStatus
              : 'skipped';
            const isLast = index === stageNodes.length - 1;

            return (
              <div key={`${stage.name}-${index}`} className="pipeline-mobile-node-row">
                <div className="pipeline-mobile-node-col">
                  <div className={`pipeline-mobile-dot ${stage.normalizedStatus}`}>
                    <span className="pipeline-mobile-dot-index">{index + 1}</span>
                  </div>
                  {!isLast && <div className={`pipeline-mobile-segment ${nextStatus}`} />}
                  {isLast && <div className="pipeline-mobile-segment skipped" />}
                </div>
                <div className="pipeline-mobile-label-col">
                  <div className={`pipeline-mobile-stage-info ${stage.normalizedStatus}`}>
                    <span className="pipeline-mobile-stage-name">{stage.name}</span>
                    <span className={`pipeline-mobile-stage-status ${stage.normalizedStatus}`}>
                      {stage.normalizedStatus === 'success' ? '✓ Passed'
                        : stage.normalizedStatus === 'failure' ? '✗ Failed'
                        : stage.normalizedStatus === 'warning' ? '⚠ Aborted'
                        : stage.normalizedStatus === 'in-progress' ? '● Running'
                        : '○ Skipped'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* End node */}
          <div className="pipeline-mobile-node-row">
            <div className="pipeline-mobile-node-col">
              <div className={`pipeline-mobile-dot skipped end ${failedStageIndex >= 0 ? 'failure-end' : ''}`} />
            </div>
            <div className="pipeline-mobile-label-col">
              <span className="pipeline-mobile-label-text muted">End</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const steps = stageData?.steps || [];
  const failedStageName = isFailure ? stageData?.failedStage : null;

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
          {isMobile ? renderMobileGraph() : renderGraph()}

          {isFailure && (
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
          )}
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
