import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/terminal/mock-data';
import type { AlertRule, Alert } from '@/types/terminal';

// In-memory storage for demo
const alertRulesStore = new Map<string, AlertRule[]>();
const alertsStore = new Map<string, Alert[]>();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'rules' or 'history'

    if (type === 'history') {
      const alerts = alertsStore.get(userId) || [];
      return NextResponse.json({ alerts });
    }

    const rules = alertRulesStore.get(userId) || [];
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { projectId, type, threshold, channels } = body;

    if (!projectId || !type || !channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      projectId,
      type,
      threshold,
      enabled: true,
      channels,
      createdAt: new Date(),
    };

    const currentRules = alertRulesStore.get(userId) || [];
    alertRulesStore.set(userId, [...currentRules, newRule]);

    return NextResponse.json({ success: true, rule: newRule });
  } catch (error) {
    console.error('Alert rule create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { ruleId, enabled } = body;

    if (!ruleId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Rule ID and enabled status required' },
        { status: 400 }
      );
    }

    const currentRules = alertRulesStore.get(userId) || [];
    const updatedRules = currentRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled } : rule
    );
    alertRulesStore.set(userId, updatedRules);

    return NextResponse.json({ success: true, ruleId, enabled });
  } catch (error) {
    console.error('Alert rule update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const currentRules = alertRulesStore.get(userId) || [];
    const updatedRules = currentRules.filter(rule => rule.id !== ruleId);
    alertRulesStore.set(userId, updatedRules);

    return NextResponse.json({ success: true, ruleId });
  } catch (error) {
    console.error('Alert rule delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
