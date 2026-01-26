import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/verify-token';
import { getServiceClient } from '@/lib/supabase/server';

// GET /api/terminal/alerts - Get user's alerts or alert rules
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      // Return empty for unauthenticated users
      return NextResponse.json({ rules: [], alerts: [], authenticated: false });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'rules' or 'history'

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    if (type === 'history') {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.userId)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Alerts] Fetch history error:', error.message);
        return NextResponse.json(
          { error: 'Failed to fetch alerts' },
          { status: 500 }
        );
      }

      return NextResponse.json({ alerts: data || [], authenticated: true });
    }

    // Default: fetch rules
    const { data, error } = await supabase
      .from('user_alert_rules')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Alerts] Fetch rules error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch alert rules' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules: data || [], authenticated: true });
  } catch (error) {
    console.error('[Alerts] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/terminal/alerts - Create new alert rule
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rule } = body;

    if (!rule || typeof rule !== 'object') {
      return NextResponse.json(
        { error: 'Rule object is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('user_alert_rules')
      .insert({
        user_id: user.userId,
        rule: rule,
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Alerts] Create rule error:', error.message);
      return NextResponse.json(
        { error: 'Failed to create alert rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rule: data });
  } catch (error) {
    console.error('[Alerts] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/terminal/alerts - Update alert rule
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ruleId, enabled, rule } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof enabled === 'boolean') {
      updateData.enabled = enabled;
    }

    if (rule && typeof rule === 'object') {
      updateData.rule = rule;
    }

    const { error } = await supabase
      .from('user_alert_rules')
      .update(updateData)
      .eq('id', ruleId)
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Alerts] Update rule error:', error.message);
      return NextResponse.json(
        { error: 'Failed to update alert rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ruleId });
  } catch (error) {
    console.error('[Alerts] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/terminal/alerts - Delete alert rule
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from('user_alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Alerts] Delete rule error:', error.message);
      return NextResponse.json(
        { error: 'Failed to delete alert rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ruleId });
  } catch (error) {
    console.error('[Alerts] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/terminal/alerts - Mark alerts as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        { error: 'Alert IDs array is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from('user_alerts')
      .update({ read: true })
      .in('id', alertIds)
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Alerts] Mark read error:', error.message);
      return NextResponse.json(
        { error: 'Failed to mark alerts as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, markedRead: alertIds.length });
  } catch (error) {
    console.error('[Alerts] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
