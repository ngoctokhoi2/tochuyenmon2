import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  INITIAL_MEMBERS, 
  INITIAL_MONTHLY_REPORTS, 
  INITIAL_STRUGGLING_STUDENTS, 
  INITIAL_TEAM_DOCUMENTS, 
  INITIAL_EXAMS_AND_PLANS, 
  INITIAL_LESSON_STUDIES, 
  INITIAL_DIRECTIVES, 
  INITIAL_MEETINGS, 
  INITIAL_EMULATIONS, 
  INITIAL_TIMETABLES, 
  INITIAL_APP_SETTINGS 
} from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data_storage');
const SHARED_DATA_FILE = path.join(DATA_DIR, 'shared_online_data.json');

// Ensure storage folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data_storage dir:', err);
  }
}

interface SyncMetadata {
  lastUpdated: string;
  lastUpdatedByEmail: string;
  lastUpdatedByName: string;
  revision: number;
  activeAccounts: Array<{ email: string; name: string; lastSeen: string }>;
}

interface SharedStore {
  metadata: SyncMetadata;
  data: Record<string, any>;
}

function getInitialStore(): SharedStore {
  return {
    metadata: {
      lastUpdated: new Date().toISOString(),
      lastUpdatedByEmail: 'ngoctokhoi2@gmail.com',
      lastUpdatedByName: 'Tổ trưởng Nguyễn Kim Ngọc',
      revision: 1,
      activeAccounts: [
        {
          email: 'ngoctokhoi2@gmail.com',
          name: 'Tổ trưởng Nguyễn Kim Ngọc',
          lastSeen: new Date().toISOString()
        }
      ]
    },
    data: {
      settings: INITIAL_APP_SETTINGS,
      leader_pass: 'Tt112233',
      members: INITIAL_MEMBERS,
      reports: INITIAL_MONTHLY_REPORTS,
      struggling: INITIAL_STRUGGLING_STUDENTS,
      team_docs: INITIAL_TEAM_DOCUMENTS,
      exams: INITIAL_EXAMS_AND_PLANS,
      lesson_studies: INITIAL_LESSON_STUDIES,
      directives: INITIAL_DIRECTIVES,
      meetings: INITIAL_MEETINGS,
      emulations: INITIAL_EMULATIONS,
      emulation_docs: [],
      timetables: INITIAL_TIMETABLES
    }
  };
}

function ensureStoreDefaults(store: SharedStore): SharedStore {
  const initial = getInitialStore();
  if (!store.data || typeof store.data !== 'object') {
    store.data = initial.data;
  } else {
    for (const [key, val] of Object.entries(initial.data)) {
      if (store.data[key] === undefined || (Array.isArray(store.data[key]) && store.data[key].length === 0 && Array.isArray(val) && val.length > 0)) {
        store.data[key] = val;
      }
    }
    // Always sync school name and header title to latest setting
    if (store.data.settings) {
      store.data.settings = {
        ...store.data.settings,
        headerTitle: INITIAL_APP_SETTINGS.headerTitle,
        schoolName: INITIAL_APP_SETTINGS.schoolName,
        communeName: INITIAL_APP_SETTINGS.communeName
      };
    }
  }
  return store;
}

function readSharedStore(): SharedStore {
  if (fs.existsSync(SHARED_DATA_FILE)) {
    try {
      const raw = fs.readFileSync(SHARED_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return ensureStoreDefaults(parsed as SharedStore);
      }
    } catch (err) {
      console.error('Error reading shared_online_data.json:', err);
    }
  }
  const init = getInitialStore();
  saveSharedStore(init);
  return init;
}

function saveSharedStore(store: SharedStore): boolean {
  try {
    fs.writeFileSync(SHARED_DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing shared_online_data.json:', err);
    return false;
  }
}

/**
 * Smart merging:
 * Directly updates collections so deletions and updates are fully preserved and shared!
 */
function smartMergeData(currentData: Record<string, any>, incomingData: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...currentData };

  for (const [key, val] of Object.entries(incomingData)) {
    if (val === undefined || val === null) continue;

    if (Array.isArray(val)) {
      const existingArray = Array.isArray(result[key]) ? result[key] : [];
      if (val.length > 0 && val[0] && typeof val[0] === 'object' && 'id' in val[0]) {
        const itemMap = new Map<string, any>();
        existingArray.forEach((item: any) => {
          if (item && item.id) itemMap.set(String(item.id), item);
        });
        val.forEach((item: any) => {
          if (item && item.id) {
            const prev = itemMap.get(String(item.id));
            itemMap.set(String(item.id), prev ? { ...prev, ...item } : item);
          }
        });
        result[key] = Array.from(itemMap.values());
      } else if (val.length === 0 && existingArray.length > 0) {
        // Do not overwrite existing non-empty array with an empty array payload
        result[key] = existingArray;
      } else {
        result[key] = val;
      }
    } else if (typeof val === 'object') {
      result[key] = {
        ...(result[key] || {}),
        ...val
      };
    } else {
      result[key] = val;
    }
  }

  // Preserve core role assignment: Nguyễn Thị Kim Ngọc (Leader Khối 2)
  if (Array.isArray(result.members)) {
    result.members = result.members.map((m: any) => {
      if (m.id === 'gv-2' || m.name === 'Nguyễn Thị Kim Ngọc' || m.name === 'Nguyễn Kim Ngọc') {
        return { ...m, isLeader: true, assignedClass: 'Tổ trưởng Chuyên môn Khối 2' };
      }
      return m;
    });
  }

  // Filter out any mock timetables from old campuses or Grade 5
  if (Array.isArray(result.timetables)) {
    result.timetables = result.timetables.filter((t: any) => {
      if (!t) return false;
      if (['Kiến Bình', 'Tân Bình', 'Trương Hoàng', 'Đặng Văn Phấn'].includes(t.campus)) return false;
      if (t.className && (t.className.startsWith('5/') || t.className.startsWith('Lớp 5'))) return false;
      return true;
    });
  }

  return result;
}

// SSE Connected Clients for Real-time instant live update across all teachers & team leader
interface SSEClient {
  id: string;
  res: express.Response;
  email: string;
  name: string;
}

let sseClients: SSEClient[] = [];

function broadcastToClients(eventData: any) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Increase payload limit for documents, images, and lesson plans
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- REST API FOR ONLINE MULTI-ACCOUNT SYNCHRONIZATION ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', online: true, serverTime: new Date().toISOString() });
  });

  // Check sync status (revision & last update info) - lightweight
  app.get('/api/sync/status', (_req, res) => {
    const store = readSharedStore();
    res.json({
      success: true,
      revision: store.metadata?.revision || 0,
      lastUpdated: store.metadata?.lastUpdated || null,
      lastUpdatedByEmail: store.metadata?.lastUpdatedByEmail || '',
      lastUpdatedByName: store.metadata?.lastUpdatedByName || '',
      activeAccountsCount: store.metadata?.activeAccounts?.length || 0,
      activeConnectedPeers: sseClients.length,
      hasData: Object.keys(store.data || {}).length > 0
    });
  });

  // Pull all synchronized data across shared email accounts
  app.get('/api/sync', (req, res) => {
    const clientEmail = (req.query.email as string) || '';
    const clientName = (req.query.name as string) || '';
    const store = readSharedStore();

    // Register active email if provided
    if (clientEmail) {
      let accounts = store.metadata.activeAccounts || [];
      const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === clientEmail.toLowerCase());
      if (existingIdx >= 0) {
        accounts[existingIdx].lastSeen = new Date().toISOString();
        if (clientName) accounts[existingIdx].name = clientName;
      } else {
        accounts.push({
          email: clientEmail,
          name: clientName || clientEmail,
          lastSeen: new Date().toISOString()
        });
      }
      store.metadata.activeAccounts = accounts;
      saveSharedStore(store);
    }

    res.json({
      success: true,
      metadata: {
        ...store.metadata,
        activeConnectedPeers: sseClients.length
      },
      data: store.data
    });
  });

  // Real-time Server-Sent Events (SSE) stream for instantaneous multi-device updates
  app.get('/api/sync/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientId = Math.random().toString(36).substring(2, 9);
    const email = (req.query.email as string) || 'ngoctokhoi2@gmail.com';
    const name = (req.query.name as string) || 'Giáo viên Khối 2';

    const client: SSEClient = { id: clientId, res, email, name };
    sseClients.push(client);

    // Initial greeting with current data & peer count
    const currentStore = readSharedStore();
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      revision: currentStore.metadata?.revision || 0,
      activePeers: sseClients.length,
      lastUpdated: currentStore.metadata?.lastUpdated
    })}\n\n`);

    // Notify other peers about new connection
    broadcastToClients({
      type: 'peers_update',
      activePeers: sseClients.length
    });

    req.on('close', () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
      broadcastToClients({
        type: 'peers_update',
        activePeers: sseClients.length
      });
    });
  });

  // Push / Upload data to share with all email accounts and teachers
  app.post('/api/sync', (req, res) => {
    try {
      const { data, userEmail, userName } = req.body;
      if (!data || typeof data !== 'object') {
        res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
        return;
      }

      const store = readSharedStore();
      const newRevision = (store.metadata.revision || 0) + 1;
      const now = new Date().toISOString();
      const authorEmail = userEmail || 'ngoctokhoi2@gmail.com';
      const authorName = userName || 'Giáo viên Khối 2';

      // Smart merge arrays and objects so one teacher's input does NOT overwrite another teacher's inputs
      store.data = smartMergeData(store.data, data);

      // Track active account
      let accounts = store.metadata.activeAccounts || [];
      const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === authorEmail.toLowerCase());
      if (existingIdx >= 0) {
        accounts[existingIdx].lastSeen = now;
        accounts[existingIdx].name = authorName;
      } else {
        accounts.push({
          email: authorEmail,
          name: authorName,
          lastSeen: now
        });
      }

      store.metadata = {
        revision: newRevision,
        lastUpdated: now,
        lastUpdatedByEmail: authorEmail,
        lastUpdatedByName: authorName,
        activeAccounts: accounts
      };

      const saved = saveSharedStore(store);
      if (!saved) {
        res.status(500).json({ success: false, error: 'Không thể lưu trữ dữ liệu trên máy chủ' });
        return;
      }

      // BROADCAST TO ALL CONNECTED TEACHERS & TEAM LEADER IN REAL TIME (<100ms)
      broadcastToClients({
        type: 'data_changed',
        revision: newRevision,
        lastUpdated: now,
        lastUpdatedByEmail: authorEmail,
        lastUpdatedByName: authorName,
        data: store.data,
        activePeers: sseClients.length
      });

      res.json({
        success: true,
        revision: newRevision,
        lastUpdated: now,
        lastUpdatedByEmail: authorEmail,
        lastUpdatedByName: authorName,
        data: store.data,
        message: 'Đã lưu trữ và đồng bộ tức thì cho máy Tổ trưởng và tất cả giáo viên!'
      });
    } catch (err: any) {
      console.error('Error in /api/sync POST:', err);
      res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý đồng bộ' });
    }
  });

  // Dedicated delete endpoint to instantly delete an item from the shared store & broadcast to all peers
  app.post('/api/sync/delete', (req, res) => {
    try {
      const { collection: colName, id, userEmail, userName } = req.body;
      if (!colName || !id) {
        res.status(400).json({ success: false, error: 'Thiếu thông tin mục cần xóa' });
        return;
      }

      // Protected collections: Only host server account ngoctokhoi2@gmail.com has permission to delete
      const protectedCollections = ['directives', 'meetings', 'emulations', 'emulation_docs', 'team_docs', 'exams'];
      const isHostServerUser = (userEmail || '').toLowerCase().trim() === 'ngoctokhoi2@gmail.com';
      if (protectedCollections.includes(colName) && !isHostServerUser) {
        res.status(403).json({
          success: false,
          error: 'Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa Kế hoạch Tổ, PPCT, KHDH và Đề thi! Các máy chia sẻ / máy lẻ chỉ có quyền xem và tải xuống.'
        });
        return;
      }

      const store = readSharedStore();
      if (Array.isArray(store.data[colName])) {
        store.data[colName] = store.data[colName].filter((item: any) => item && item.id !== id);
      }

      const newRevision = (store.metadata.revision || 0) + 1;
      const now = new Date().toISOString();
      const authorEmail = userEmail || 'ngoctokhoi2@gmail.com';
      const authorName = userName || 'Giáo viên Khối 2';

      store.metadata = {
        ...store.metadata,
        revision: newRevision,
        lastUpdated: now,
        lastUpdatedByEmail: authorEmail,
        lastUpdatedByName: authorName
      };

      saveSharedStore(store);

      broadcastToClients({
        type: 'item_deleted',
        collection: colName,
        id,
        revision: newRevision,
        lastUpdated: now,
        lastUpdatedByEmail: authorEmail,
        lastUpdatedByName: authorName,
        data: store.data,
        activePeers: sseClients.length
      });

      res.json({
        success: true,
        revision: newRevision,
        data: store.data,
        message: 'Đã xóa mục thành công trên toàn bộ hệ thống'
      });
    } catch (err: any) {
      console.error('Error in /api/sync/delete:', err);
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi xóa mục' });
    }
  });

  // Reset shared data to default
  app.post('/api/sync/reset', (_req, res) => {
    try {
      const initial = getInitialStore();
      saveSharedStore(initial);
      broadcastToClients({
        type: 'data_changed',
        revision: initial.metadata.revision,
        lastUpdated: initial.metadata.lastUpdated,
        lastUpdatedByEmail: initial.metadata.lastUpdatedByEmail,
        lastUpdatedByName: initial.metadata.lastUpdatedByName,
        data: initial.data,
        activePeers: sseClients.length
      });
      res.json({ success: true, message: 'Đã khôi phục dữ liệu trực tuyến về ban đầu' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SSE Keep-alive heartbeat every 15 seconds to prevent proxy timeout
  setInterval(() => {
    broadcastToClients({ type: 'heartbeat', timestamp: Date.now() });
  }, 15000);

  // Root redirect & backwards compatibility
  app.get('/', (_req, res) => {
    res.redirect('/tochuyenmon2/');
  });
  app.get('/to2', (_req, res) => {
    res.redirect('/tochuyenmon2/');
  });
  app.get('/to2/*', (_req, res) => {
    res.redirect('/tochuyenmon2/');
  });
  app.get('/to5', (_req, res) => {
    res.redirect('/tochuyenmon2/');
  });
  app.get('/to5/*', (_req, res) => {
    res.redirect('/tochuyenmon2/');
  });

  // Vite integration
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use('/tochuyenmon2', express.static(distPath));
    app.use('/to2', express.static(distPath));
    app.use('/to5', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Online Shared Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
