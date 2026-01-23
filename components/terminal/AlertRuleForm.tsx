'use client';

import { useState } from 'react';
import {
  type AlertRuleType,
  type AlertChannel,
  type AlertRule,
  ALERT_RULE_TYPE_LABELS,
  ALERT_RULE_TYPE_DESCRIPTIONS,
  ALERT_CHANNEL_LABELS,
} from '@/types/terminal';
import { Mail, MessageCircle, Webhook, Plus } from 'lucide-react';

interface AlertRuleFormProps {
  projectId: string;
  projectName: string;
  onSubmit: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
}

const RULE_TYPES: AlertRuleType[] = [
  'score_change',
  'wallet_cex',
  'lp_change',
  'shill_cluster',
  'engagement_spike',
  'link_change',
];

const CHANNEL_ICONS: Record<AlertChannel, React.ReactNode> = {
  email: <Mail size={16} />,
  telegram: <MessageCircle size={16} />,
  webhook: <Webhook size={16} />,
};

const THRESHOLD_RULES: AlertRuleType[] = ['score_change', 'lp_change'];

export default function AlertRuleForm({
  projectId,
  projectName,
  onSubmit,
  onCancel,
}: AlertRuleFormProps) {
  const [type, setType] = useState<AlertRuleType>('score_change');
  const [threshold, setThreshold] = useState<number>(10);
  const [channels, setChannels] = useState<AlertChannel[]>(['email']);

  const requiresThreshold = THRESHOLD_RULES.includes(type);

  const handleChannelToggle = (channel: AlertChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (channels.length === 0) {
      alert('Please select at least one notification channel');
      return;
    }

    onSubmit({
      projectId,
      type,
      threshold: requiresThreshold ? threshold : undefined,
      enabled: true,
      channels,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project info */}
      <div className="p-4 bg-ivory-light/5 border border-ivory-light/20">
        <span className="text-xs font-mono text-ivory-light/50">Creating alert for</span>
        <p className="font-mono font-bold text-ivory-light">{projectName}</p>
      </div>

      {/* Rule type */}
      <div>
        <label className="block text-sm font-mono text-ivory-light/70 mb-2">
          Alert Type
        </label>
        <div className="grid gap-2">
          {RULE_TYPES.map((ruleType) => (
            <button
              key={ruleType}
              type="button"
              onClick={() => setType(ruleType)}
              className={`text-left p-3 border transition-colors ${
                type === ruleType
                  ? 'border-danger-orange bg-danger-orange/10'
                  : 'border-ivory-light/20 hover:border-ivory-light/30'
              }`}
            >
              <span
                className={`font-mono text-sm font-bold ${
                  type === ruleType ? 'text-danger-orange' : 'text-ivory-light'
                }`}
              >
                {ALERT_RULE_TYPE_LABELS[ruleType]}
              </span>
              <p className="text-xs text-ivory-light/50 mt-1">
                {ALERT_RULE_TYPE_DESCRIPTIONS[ruleType]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Threshold (if applicable) */}
      {requiresThreshold && (
        <div>
          <label className="block text-sm font-mono text-ivory-light/70 mb-2">
            Threshold
            <span className="text-ivory-light/40 ml-2">
              {type === 'score_change' ? '(points)' : '(%)'}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={type === 'score_change' ? 5 : 5}
              max={type === 'score_change' ? 50 : 50}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="flex-1 accent-danger-orange"
            />
            <span className="font-mono text-lg text-ivory-light w-12 text-right">
              {threshold}{type === 'lp_change' ? '%' : ''}
            </span>
          </div>
          <p className="text-xs text-ivory-light/40 mt-2 font-mono">
            {type === 'score_change'
              ? `Alert when score changes by ${threshold} or more points`
              : `Alert when LP changes by ${threshold}% or more`}
          </p>
        </div>
      )}

      {/* Notification channels */}
      <div>
        <label className="block text-sm font-mono text-ivory-light/70 mb-2">
          Notification Channels
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ALERT_CHANNEL_LABELS) as AlertChannel[]).map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => handleChannelToggle(channel)}
              className={`flex items-center gap-2 px-4 py-2 border font-mono text-sm transition-colors ${
                channels.includes(channel)
                  ? 'border-danger-orange bg-danger-orange/10 text-danger-orange'
                  : 'border-ivory-light/20 text-ivory-light/60 hover:border-ivory-light/30'
              }`}
            >
              {CHANNEL_ICONS[channel]}
              {ALERT_CHANNEL_LABELS[channel]}
            </button>
          ))}
        </div>
        <p className="text-xs text-ivory-light/40 mt-2 font-mono">
          Select how you want to be notified (email delivery available, others coming soon)
        </p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-ivory-light/10">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-danger-orange text-black font-mono font-bold hover:bg-danger-orange/90 transition-colors"
        >
          <Plus size={18} />
          Create Alert
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-ivory-light/20 text-ivory-light/60 font-mono hover:border-ivory-light/30 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
