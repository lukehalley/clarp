'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AlertRuleForm from '@/components/terminal/AlertRuleForm';
import {
  MOCK_ALERT_RULES,
  MOCK_ALERTS,
  MOCK_PROJECTS,
  MOCK_WATCHLIST,
} from '@/lib/terminal/mock-data';
import {
  ALERT_RULE_TYPE_LABELS,
  ALERT_CHANNEL_LABELS,
  type AlertRule,
  type Alert,
} from '@/types/terminal';
import {
  Bell,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from 'lucide-react';

const ALERTS_KEY = 'clarp-alerts';
const RULES_KEY = 'clarp-alert-rules';

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);

    const storedRules = localStorage.getItem(RULES_KEY);
    if (storedRules) {
      try {
        setRules(JSON.parse(storedRules));
      } catch {
        setRules(MOCK_ALERT_RULES);
      }
    } else {
      setRules(MOCK_ALERT_RULES);
    }

    const storedAlerts = localStorage.getItem(ALERTS_KEY);
    if (storedAlerts) {
      try {
        setAlerts(JSON.parse(storedAlerts));
      } catch {
        setAlerts(MOCK_ALERTS);
      }
    } else {
      setAlerts(MOCK_ALERTS);
    }
  }, []);

  // Save rules to localStorage
  const saveRules = (newRules: AlertRule[]) => {
    localStorage.setItem(RULES_KEY, JSON.stringify(newRules));
    setRules(newRules);
  };

  // Save alerts to localStorage
  const saveAlerts = (newAlerts: Alert[]) => {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(newAlerts));
    setAlerts(newAlerts);
  };

  // Create new rule
  const handleCreateRule = (rule: Omit<AlertRule, 'id' | 'createdAt'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
    };
    saveRules([...rules, newRule]);
    setShowCreateForm(false);
    setSelectedProject('');
  };

  // Toggle rule enabled
  const toggleRule = (ruleId: string) => {
    const updated = rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    saveRules(updated);
  };

  // Delete rule
  const deleteRule = (ruleId: string) => {
    const updated = rules.filter(r => r.id !== ruleId);
    saveRules(updated);
  };

  // Mark alert as read
  const markAsRead = (alertId: string) => {
    const updated = alerts.map(a =>
      a.id === alertId ? { ...a, read: true } : a
    );
    saveAlerts(updated);
  };

  // Toggle alert expanded
  const toggleExpanded = (alertId: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light flex items-center gap-3">
            <Bell size={28} className="text-larp-purple" />
            Alerts
          </h1>
          <p className="text-ivory-light/50 font-mono text-sm mt-1">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} active
            {unreadCount > 0 && (
              <span className="text-danger-orange ml-2">• {unreadCount} unread</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-sm transition-colors ${
            showCreateForm
              ? 'bg-ivory-light/10 border border-ivory-light/30 text-ivory-light'
              : 'bg-danger-orange text-black font-bold hover:bg-danger-orange/90'
          }`}
        >
          {showCreateForm ? (
            <>Cancel</>
          ) : (
            <>
              <Plus size={16} />
              Create Alert
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="border-2 border-danger-orange bg-ivory-light/5 p-6">
          <h2 className="font-mono font-bold text-ivory-light text-lg mb-6">
            Create New Alert Rule
          </h2>

          {/* Project selector */}
          <div className="mb-6">
            <label className="block text-sm font-mono text-ivory-light/70 mb-2">
              Select Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 bg-slate-dark border border-ivory-light/20 text-ivory-light font-mono focus:border-danger-orange outline-none"
            >
              <option value="">Choose a project...</option>
              {MOCK_WATCHLIST.map((item) => (
                <option key={item.projectId} value={item.projectId}>
                  {item.project.name} ({item.project.ticker})
                </option>
              ))}
              {MOCK_PROJECTS.filter(
                p => !MOCK_WATCHLIST.some(w => w.projectId === p.id)
              ).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.ticker && `(${project.ticker})`}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <AlertRuleForm
              projectId={selectedProject}
              projectName={
                MOCK_PROJECTS.find(p => p.id === selectedProject)?.name || 'Unknown'
              }
              onSubmit={handleCreateRule}
              onCancel={() => {
                setShowCreateForm(false);
                setSelectedProject('');
              }}
            />
          )}
        </div>
      )}

      {/* Active Rules */}
      <section>
        <h2 className="font-mono font-bold text-ivory-light text-lg mb-4">
          Active Rules
        </h2>

        {rules.length > 0 ? (
          <div className="space-y-3">
            {rules.map((rule) => {
              const project = MOCK_PROJECTS.find(p => p.id === rule.projectId);
              return (
                <div
                  key={rule.id}
                  className={`p-4 border transition-colors ${
                    rule.enabled
                      ? 'border-ivory-light/20 bg-ivory-light/5'
                      : 'border-ivory-light/10 bg-transparent opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/terminal/project/${rule.projectId}`}
                          className="font-mono font-bold text-ivory-light hover:text-danger-orange"
                        >
                          {project?.name || 'Unknown'}
                        </Link>
                        <span className="text-xs font-mono px-2 py-1 bg-ivory-light/10 text-ivory-light/60">
                          {ALERT_RULE_TYPE_LABELS[rule.type]}
                        </span>
                        {rule.threshold && (
                          <span className="text-xs font-mono text-ivory-light/50">
                            Threshold: {rule.threshold}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {rule.channels.map((channel) => (
                          <span
                            key={channel}
                            className="text-xs font-mono px-2 py-0.5 border border-ivory-light/20 text-ivory-light/50"
                          >
                            {ALERT_CHANNEL_LABELS[channel]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`p-2 transition-colors ${
                          rule.enabled ? 'text-larp-green' : 'text-ivory-light/40'
                        }`}
                        title={rule.enabled ? 'Disable' : 'Enable'}
                      >
                        {rule.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 text-ivory-light/40 hover:text-larp-red transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 border border-ivory-light/10 text-center">
            <p className="text-ivory-light/50 font-mono text-sm">
              No alert rules configured
            </p>
          </div>
        )}
      </section>

      {/* Alert History */}
      <section>
        <h2 className="font-mono font-bold text-ivory-light text-lg mb-4">
          Alert History
        </h2>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const project = MOCK_PROJECTS.find(p => p.id === alert.projectId);
              const isExpanded = expandedAlerts.has(alert.id);

              return (
                <div
                  key={alert.id}
                  className={`border transition-colors ${
                    alert.read
                      ? 'border-ivory-light/10'
                      : 'border-danger-orange/30 bg-danger-orange/5'
                  }`}
                >
                  <button
                    onClick={() => {
                      toggleExpanded(alert.id);
                      if (!alert.read) markAsRead(alert.id);
                    }}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          {!alert.read && (
                            <span className="w-2 h-2 bg-danger-orange shrink-0" />
                          )}
                          <span className="font-mono font-bold text-ivory-light">
                            {project?.name || 'Unknown'}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-ivory-light/10 text-ivory-light/60">
                            {ALERT_RULE_TYPE_LABELS[alert.type]}
                          </span>
                        </div>
                        <p className="text-sm text-ivory-light/60 mt-1 font-mono">
                          {alert.type === 'score_change'
                            ? `Score: ${alert.payload.before} → ${alert.payload.after}`
                            : alert.type === 'wallet_cex'
                            ? 'Team wallet deposited to CEX'
                            : 'Alert triggered'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-ivory-light/40 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-ivory-light/40" />
                        ) : (
                          <ChevronDown size={16} className="text-ivory-light/40" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-ivory-light/10">
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-4 text-sm font-mono">
                          <div>
                            <span className="text-ivory-light/50">Before:</span>
                            <span className="text-ivory-light ml-2">
                              {JSON.stringify(alert.payload.before)}
                            </span>
                          </div>
                          <div>
                            <span className="text-ivory-light/50">After:</span>
                            <span className="text-ivory-light ml-2">
                              {JSON.stringify(alert.payload.after)}
                            </span>
                          </div>
                        </div>

                        {alert.payload.evidence.length > 0 && (
                          <div>
                            <span className="text-xs font-mono text-ivory-light/50">Evidence:</span>
                            <ul className="mt-2 space-y-1">
                              {alert.payload.evidence.map((e, i) => (
                                <li key={i} className="text-sm text-ivory-light/70">
                                  • {e.summary}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Link
                          href={`/terminal/project/${alert.projectId}`}
                          className="inline-flex items-center gap-2 text-danger-orange font-mono text-sm hover:underline"
                        >
                          View project <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 border border-ivory-light/10 text-center">
            <p className="text-ivory-light/50 font-mono text-sm">No alerts yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
