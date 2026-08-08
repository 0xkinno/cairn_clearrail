import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { recordIncidentHashOnChain } from '@/lib/blockchain/evm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const admin = createAdminClient();

    // 1. Fetch the incident first to get org_id
    const { data: incident, error: fetchErr } = await admin
      .from('incidents')
      .select('org_id')
      .eq('id', id)
      .single();

    if (fetchErr || !incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const orgId = incident.org_id;

    // 2. Update status to resolved in Supabase
    const { data, error } = await admin
      .from('incidents')
      .update({ 
        status: 'resolved', 
        resolved_at: body.resolved_at || new Date().toISOString(),
        resolution_notes: body.resolution_notes || 'Resolved'
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to update database' }, { status: 500 });
    }

    // 3. Anchor resolution on-chain on Arbitrum Sepolia
    try {
      const dataHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({ id, status: "resolved" }))
        .digest("hex");
      
      const onchain = await recordIncidentHashOnChain(id, dataHash, "resolved", orgId);
      const txHash = onchain.txHash;

      // Save the transaction hash
      await admin
        .from('incidents')
        .update({ near_tx_hash: txHash })
        .eq('id', id);

      data.near_tx_hash = txHash;
      console.log(`On-chain incident resolution anchored. Tx: ${txHash}`);
    } catch (e: any) {
      console.error("Failed to anchor incident resolution on-chain:", e.message);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to resolve' }, { status: 500 });
  }
}
