import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { usePlatformAuth } from '../../contexts/PlatformAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Lock,
  Database,
  Globe,
  ChevronDown,
  ChevronUp,
  Scan,
  Activity,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SecurityStatus {
  jwt_secure: boolean;
  rate_limiting: boolean;
  https_enabled: boolean;
  db_healthy: boolean;
  overall: 'healthy' | 'warning' | 'critical';
  details: {
    jwt_message?: string;
    rate_limiting_message?: string;
    https_message?: string;
    db_message?: string;
  };
}

interface ScanFinding {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

interface ScanResult {
  id: number | string;
  status: 'healthy' | 'warning' | 'critical';
  performed_by_name: string;
  scan_date: string;
  findings: ScanFinding[];
  summary?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusCard: React.FC<{
  title: string;
  healthy: boolean | null;
  icon: React.ElementType;
  message?: string;
  gradient: string;
  index: number;
}> = ({ title, healthy, icon: Icon, message, gradient, index }) => {
  const isHealthy = healthy === true;
  const isUnknown = healthy === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isUnknown
              ? 'bg-gray-100 text-gray-500'
              : isHealthy
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isUnknown ? 'bg-gray-400' : isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          {isUnknown ? 'Unknown' : isHealthy ? 'Healthy' : 'At Risk'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {isUnknown ? 'Checking...' : isHealthy ? 'No issues detected' : 'Attention needed'}
          </p>
          {message && (
            <p className="text-xs text-gray-500 mt-0.5 truncate" title={message}>
              {message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FindingRow: React.FC<{ finding: ScanFinding; index: number }> = ({ finding, index }) => {
  const isPass = finding.status === 'pass';
  const isWarn = finding.status === 'warning';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${
        isPass
          ? 'bg-emerald-50/60 border-emerald-100'
          : isWarn
          ? 'bg-amber-50/60 border-amber-100'
          : 'bg-red-50/60 border-red-100'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isPass ? (
          <CheckCircle size={17} className="text-emerald-500" />
        ) : isWarn ? (
          <AlertTriangle size={17} className="text-amber-500" />
        ) : (
          <XCircle size={17} className="text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isPass ? 'text-emerald-800' : isWarn ? 'text-amber-800' : 'text-red-800'}`}>
          {finding.check}
        </p>
        <p className={`text-xs mt-0.5 ${isPass ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-red-600'}`}>
          {finding.message}
        </p>
      </div>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${
          isPass
            ? 'bg-emerald-100 text-emerald-700'
            : isWarn
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {finding.status}
      </span>
    </motion.div>
  );
};

const OverallBadge: React.FC<{ status: 'healthy' | 'warning' | 'critical' }> = ({ status }) => {
  const config = {
    healthy: { icon: ShieldCheck, label: 'Healthy', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    warning: { icon: ShieldAlert, label: 'Warning', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    critical: { icon: ShieldX, label: 'Critical', classes: 'bg-red-100 text-red-700 border-red-200' },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${config.classes}`}>
      <Icon size={15} />
      {config.label}
    </span>
  );
};

const ScanHistoryRow: React.FC<{ scan: ScanResult; index: number }> = ({ scan, index }) => {
  const [expanded, setExpanded] = useState(false);

  const issueCount = scan.findings?.filter((f) => f.status !== 'pass').length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-gray-100 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">
              {scan.scan_date
                ? new Date(scan.scan_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                : 'Unknown date'}
            </span>
            <OverallBadge status={scan.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500">By {scan.performed_by_name || 'Unknown'}</span>
            <span
              className={`text-xs font-medium ${
                issueCount === 0 ? 'text-emerald-600' : issueCount <= 2 ? 'text-amber-600' : 'text-red-600'
              }`}
            >
              {issueCount === 0 ? 'No issues' : `${issueCount} issue${issueCount !== 1 ? 's' : ''} found`}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="findings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 bg-white border-t border-gray-100">
              {scan.summary && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-3">
                  <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-700">{scan.summary}</p>
                </div>
              )}
              {scan.findings?.length > 0 ? (
                scan.findings.map((f, i) => <FindingRow key={i} finding={f} index={i} />)
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No findings recorded for this scan.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const PlatformSecurity: React.FC = () => {
  const { showError, showSuccess } = useToast();
  const { user: platformUser } = usePlatformAuth();

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [scanRunning, setScanRunning] = useState(false);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);

  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch security status on mount
  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await api.getSecurityStatus();
      setSecurityStatus(res.data);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load security status');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Fetch scan history on mount
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.getSecurityScans();
      setScanHistory(res.data?.scans ?? res.data ?? []);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load scan history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [fetchStatus, fetchHistory]);

  const runScan = async () => {
    setScanRunning(true);
    setLatestScan(null);
    try {
      const res = await api.runSecurityScan();
      const result: ScanResult = res.data;
      setLatestScan(result);
      // Prepend to history
      setScanHistory((prev) => [result, ...prev]);
      showSuccess('Security scan completed successfully');
      // Refresh status card as well
      fetchStatus();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Security scan failed');
    } finally {
      setScanRunning(false);
    }
  };

  // Build status cards config
  const statusCards = [
    {
      title: 'JWT Security',
      healthy: securityStatus?.jwt_secure ?? null,
      icon: Lock,
      message: securityStatus?.details?.jwt_message,
      gradient: securityStatus?.jwt_secure ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-pink-500',
    },
    {
      title: 'Rate Limiting',
      healthy: securityStatus?.rate_limiting ?? null,
      icon: Activity,
      message: securityStatus?.details?.rate_limiting_message,
      gradient: securityStatus?.rate_limiting ? 'from-blue-500 to-cyan-500' : 'from-amber-500 to-orange-500',
    },
    {
      title: 'HTTPS',
      healthy: securityStatus?.https_enabled ?? null,
      icon: Globe,
      message: securityStatus?.details?.https_message,
      gradient:
        securityStatus?.https_enabled === true
          ? 'from-emerald-500 to-teal-500'
          : securityStatus?.https_enabled === false
          ? 'from-amber-500 to-orange-500'
          : 'from-gray-400 to-gray-500',
    },
    {
      title: 'Database',
      healthy: securityStatus?.db_healthy ?? null,
      icon: Database,
      message: securityStatus?.details?.db_message,
      gradient: securityStatus?.db_healthy ? 'from-violet-500 to-purple-600' : 'from-red-500 to-pink-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
            Security Center
          </h1>
          <p className="text-gray-500 mt-1 text-base">
            Monitor platform health and run vulnerability scans
          </p>
        </div>
        <div className="flex items-center gap-3">
          {securityStatus && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-md border border-gray-100">
              <OverallBadge status={securityStatus.overall} />
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { fetchStatus(); fetchHistory(); }}
            className="p-3 rounded-xl bg-white shadow-md border border-gray-100 text-gray-500 hover:text-red-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Section 1: Status cards ── */}
      {statusLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statusCards.map((card, i) => (
            <StatusCard
              key={card.title}
              index={i}
              title={card.title}
              healthy={card.healthy}
              icon={card.icon}
              message={card.message}
              gradient={card.gradient}
            />
          ))}
        </div>
      )}

      {/* ── Section 2: Run Scan ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Gradient header band */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Scan size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vulnerability Scan</h2>
              <p className="text-white/75 text-sm mt-0.5">
                Run a comprehensive security scan to detect vulnerabilities, misconfigurations, and potential risks.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Scan trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <motion.button
              whileHover={scanRunning ? {} : { scale: 1.02 }}
              whileTap={scanRunning ? {} : { scale: 0.97 }}
              onClick={runScan}
              disabled={scanRunning}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
                scanRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-200'
              }`}
            >
              {scanRunning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Scanning...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Run Vulnerability Scan
                </>
              )}
            </motion.button>
            {scanRunning && (
              <p className="text-sm text-gray-500 animate-pulse">
                Checking security posture — this may take a moment...
              </p>
            )}
          </div>

          {/* Inline scan result */}
          <AnimatePresence>
            {latestScan && !scanRunning && (
              <motion.div
                key="scan-result"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 overflow-hidden"
              >
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Result header */}
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <OverallBadge status={latestScan.status} />
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={13} />
                      <span>
                        {latestScan.scan_date
                          ? new Date(latestScan.scan_date).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Just now'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Shield size={13} />
                      <span>Scan performed by: {latestScan.performed_by_name || platformUser?.name || 'Platform Admin'}</span>
                    </div>
                  </div>
                  {/* Findings list */}
                  <div className="p-4 space-y-2 bg-white">
                    {latestScan.summary && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-3">
                        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700">{latestScan.summary}</p>
                      </div>
                    )}
                    {latestScan.findings?.length > 0 ? (
                      latestScan.findings.map((f, i) => <FindingRow key={i} finding={f} index={i} />)
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-6">No findings returned.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Section 3: Scan History ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-red-400" />
                Scan History
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Past vulnerability assessments</p>
            </div>
            {!historyLoading && scanHistory.length > 0 && (
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {scanHistory.length} scan{scanHistory.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gray-100 animate-pulse"
                  style={{ opacity: 1 - i * 0.2 }}
                />
              ))}
            </div>
          ) : scanHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <ShieldAlert size={52} className="mb-3 opacity-20" />
              <p className="font-medium text-gray-500 text-center">No scans have been run yet.</p>
              <p className="text-sm mt-1 text-center max-w-xs">
                Click "Run Vulnerability Scan" above to get started and see results here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan, i) => (
                <ScanHistoryRow key={scan.id ?? i} scan={scan} index={i} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PlatformSecurity;
