/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SyncStatusInfo {
  isOnline: boolean;
  syncState: 'idle' | 'syncing' | 'saved' | 'error';
  lastSavedAt: string | null;
  lastSavedByEmail: string | null;
  lastSavedByName: string | null;
  revision: number;
  activePeers?: number;
  message?: string;
}

export interface SharedSyncPayload {
  settings?: any;
  leader_pass?: string;
  members?: any[];
  reports?: any[];
  struggling?: any[];
  team_docs?: any[];
  exams?: any[];
  lesson_studies?: any[];
  directives?: any[];
  meetings?: any[];
  emulations?: any[];
  emulation_docs?: any[];
  timetables?: any[];
}

const STORAGE_EMAIL_KEY = 'mylac_k2_active_email';
const STORAGE_LAST_REVISION_KEY = 'mylac_k2_last_revision';
const STORAGE_DEVICE_MODE_KEY = 'mylac_k2_device_mode';

export function getActiveUserEmail(defaultEmail = 'ngoctokhoi2@gmail.com'): string {
  if (typeof window === 'undefined') return defaultEmail;
  const stored = localStorage.getItem(STORAGE_EMAIL_KEY) || localStorage.getItem('tanthanh_k5_active_email');
  if (stored) return stored;
  // If accessing through the shared app link, default to shared teacher account
  const hostname = window.location.hostname || '';
  if (hostname.includes('ais-pre')) {
    return 'giaovien.chiase@gmail.com';
  }
  return defaultEmail;
}

export function setActiveUserEmail(email: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_EMAIL_KEY, email.trim());
  }
}

/**
 * Checks if current browser window is the Host Server (Máy chủ).
 * Strict:
 * - If on shared URL (ais-pre), it is always a shared machine (Máy chia sẻ).
 * - If user explicitly chose 'shared' mode in localStorage, it is a shared machine.
 * - Otherwise, userEmail MUST be 'ngoctokhoi2@gmail.com'.
 */
export function isHostServerDevice(userEmail?: string): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check if running on the shared preview URL (all shared machines access through this URL)
  const hostname = window.location.hostname || '';
  if (hostname.includes('ais-pre')) {
    return false;
  }

  // 2. Check explicit device mode toggle
  const deviceMode = localStorage.getItem(STORAGE_DEVICE_MODE_KEY);
  if (deviceMode === 'shared') {
    return false;
  }

  // 3. Strict email check: Must match host account ngoctokhoi2@gmail.com
  const email = (userEmail || localStorage.getItem(STORAGE_EMAIL_KEY) || localStorage.getItem('tanthanh_k5_active_email') || '').toLowerCase().trim();
  return email === 'ngoctokhoi2@gmail.com';
}

export function setDeviceMode(mode: 'host' | 'shared'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_DEVICE_MODE_KEY, mode);
  }
}

export function getDeviceMode(): 'host' | 'shared' {
  if (typeof window === 'undefined') return 'host';
  const hostname = window.location.hostname || '';
  if (hostname.includes('ais-pre')) return 'shared';
  const mode = localStorage.getItem(STORAGE_DEVICE_MODE_KEY);
  if (mode === 'shared') return 'shared';
  return 'host';
}

export function getLastKnownRevision(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_LAST_REVISION_KEY) || '0', 10);
}

export function setLastKnownRevision(rev: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_LAST_REVISION_KEY, rev.toString());
  }
}

/**
 * Push local application data to server for online multi-account sharing.
 * Merges automatically on server and broadcasts to all connected teachers.
 */
export async function pushDataToOnlineServer(
  payload: SharedSyncPayload,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; revision: number; lastUpdated: string; data?: any; message: string }> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: payload,
        userEmail: userEmail || getActiveUserEmail(),
        userName: userName || 'Giáo viên Khối 2',
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      if (result.revision) {
        setLastKnownRevision(result.revision);
      }
      return {
        success: true,
        revision: result.revision,
        lastUpdated: result.lastUpdated,
        data: result.data,
        message: result.message || 'Đã lưu trữ trực tuyến thành công.',
      };
    } else {
      throw new Error(result.error || 'Đồng bộ thất bại');
    }
  } catch (err: any) {
    console.warn('[OnlineSync] pushDataToOnlineServer warning:', err);
    throw err;
  }
}

/**
 * Pull the latest shared data from server
 */
export async function pullDataFromOnlineServer(
  userEmail: string,
  userName: string
): Promise<{ success: boolean; data: SharedSyncPayload | null; metadata: any }> {
  try {
    const emailParam = encodeURIComponent(userEmail || getActiveUserEmail());
    const nameParam = encodeURIComponent(userName || 'Giáo viên Khối 2');
    const response = await fetch(`/api/sync?email=${emailParam}&name=${nameParam}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Server HTTP error: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      if (result.metadata?.revision) {
        setLastKnownRevision(result.metadata.revision);
      }
      return {
        success: true,
        data: result.data || null,
        metadata: result.metadata,
      };
    } else {
      throw new Error(result.error || 'Không thể tải dữ liệu trực tuyến');
    }
  } catch (err: any) {
    console.warn('[OnlineSync] pullDataFromOnlineServer warning:', err);
    throw err;
  }
}

/**
 * Delete an item from the shared online server and broadcast to all peers
 */
export async function deleteDataFromOnlineServer(
  collection: string,
  id: string,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; revision?: number; data?: any }> {
  try {
    const response = await fetch('/api/sync/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection,
        id,
        userEmail: userEmail || getActiveUserEmail(),
        userName: userName || 'Giáo viên Khối 2',
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const result = await response.json();
    if (result.success && result.revision) {
      setLastKnownRevision(result.revision);
    }
    return result;
  } catch (err) {
    console.warn('[OnlineSync] deleteDataFromOnlineServer warning:', err);
    return { success: false };
  }
}

/**
 * Check if the server has newer updates from other shared accounts
 */
export async function checkServerSyncStatus(): Promise<{
  success: boolean;
  revision: number;
  lastUpdated: string | null;
  lastUpdatedByEmail: string;
  lastUpdatedByName: string;
  activeAccountsCount: number;
  activeConnectedPeers: number;
  hasData: boolean;
}> {
  try {
    const response = await fetch('/api/sync/status', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) throw new Error('Status HTTP error');
    return await response.json();
  } catch {
    return {
      success: false,
      revision: 0,
      lastUpdated: null,
      lastUpdatedByEmail: '',
      lastUpdatedByName: '',
      activeAccountsCount: 0,
      activeConnectedPeers: 0,
      hasData: false,
    };
  }
}

/**
 * Real-time SSE Subscription:
 * Listens to live server events. Whenever another teacher or leader saves data,
 * callback is invoked within ~50-100ms!
 */
export function subscribeToOnlineUpdates(
  onDataReceived: (data: SharedSyncPayload, revision: number, authorName: string, authorEmail: string) => void,
  onStatusChanged: (isOnline: boolean, activePeers: number) => void,
  userEmail: string,
  userName: string
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const emailParam = encodeURIComponent(userEmail || getActiveUserEmail());
  const nameParam = encodeURIComponent(userName || 'Giáo viên Khối 2');
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`/api/sync/stream?email=${emailParam}&name=${nameParam}`);

      eventSource.onopen = () => {
        onStatusChanged(true, 1);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'connected') {
            onStatusChanged(true, payload.activePeers || 1);
            if (payload.revision) {
              setLastKnownRevision(payload.revision);
            }
          } else if (payload.type === 'peers_update') {
            onStatusChanged(true, payload.activePeers || 1);
          } else if (payload.type === 'data_changed' || payload.type === 'item_deleted') {
            if (payload.revision) {
              setLastKnownRevision(payload.revision);
            }
            onStatusChanged(true, payload.activePeers || 1);
            if (payload.data) {
              onDataReceived(
                payload.data, 
                payload.revision, 
                payload.lastUpdatedByName || 'Đồng nghiệp',
                payload.lastUpdatedByEmail || ''
              );
            }
          }
        } catch (e) {
          console.warn('[OnlineSync] Failed to parse SSE message:', e);
        }
      };

      eventSource.onerror = () => {
        onStatusChanged(false, 0);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Attempt reconnect in 3s
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('[OnlineSync] SSE connection init error:', err);
      if (!isClosed) {
        setTimeout(connect, 4000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Auto-save before browser unload or visibility change
 */
export function sendBeaconSync(payload: SharedSyncPayload, userEmail: string, userName: string): boolean {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob(
        [
          JSON.stringify({
            data: payload,
            userEmail,
            userName,
          }),
        ],
        { type: 'application/json' }
      );
      return navigator.sendBeacon('/api/sync', blob);
    } catch {
      return false;
    }
  }
  return false;
}
