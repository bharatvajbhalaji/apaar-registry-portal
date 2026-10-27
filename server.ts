/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config'; // must be first: loads .env before the database pool is created
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ensureDatabaseTables,
  seedDemoDataIfEmpty,
  setSeedAccountPasswords,
  getUserByEmail,
  getUserByApaarId,
  getAllUsers,
  createUser,
  updateUserProfile,
  toPublicUser,
  getAllStudentsStored,
  getStudentStored,
  insertStudent,
  updateStudentFields,
  insertCredentials,
  getAllRequestsStored,
  getRequestStored,
  insertRequest,
  updateRequestFields,
  getAllAuditLogsStored,
  insertAuditLog,
  DbUser,
} from './src/db/databaseService.ts';
import { isDatabaseConfigured } from './src/db/index.ts';
import { requireAuth, AuthRequest, resolveSessionToken, callerFromDbUser } from './src/middleware/auth.ts';
import { assertSecretsConfigured } from './src/server/secrets.ts';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  issueSessionToken,
  issueOtp,
  consumeOtp,
  rateLimit,
  generateUid,
  generateServerId,
  signCredential,
  verifyCredentialSignature,
  SERVER_ISSUER_SERIAL,
} from './src/server/security.ts';
import {
  Caller,
  Role,
  StoredRequest,
  StoredStudent,
  StoredAuditLog,
  EventContext,
  digitsOnly,
  filterStudentsForCaller,
  filterRequestsForCaller,
  filterAuditLogsForCaller,
  canWriteStudent,
  canChangeRequestStatus,
  canVerifyRequest,
  canReceiveEvent,
  toPublicRequest,
  toPublicAuditLog,
} from './src/server/accessRules.ts';
import { generateHash, validateApaarId, formatApaarId, generateValidApaarId, transitionRequestStatus } from './src/utils/verificationEngine.ts';
import type { AcademicCredential, AuditLogEntry, Student, VerificationRequest } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

export interface RealtimeEvent {
  type:
    | 'connected'
    | 'presence:update'
    | 'student:upserted'
    | 'request:upserted'
    | 'audit:created'
    | 'user:synced'
    | 'alert:dispatched';
  payload: any;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Small input helpers
// ---------------------------------------------------------------------------

const CREDENTIAL_TYPES: AcademicCredential['type'][] = ['DEGREE', 'MARKSHEET', 'AICTE_APPROVAL', 'ABC_TRANSCRIPT', 'TRANSFER_CERTIFICATE'];
const SCOPES: VerificationRequest['scopeOfAccess'] = ['IDENTITY', 'ACADEMIC_MARKS', 'DIGITAL_SIGNATURE', 'FULL_TRANSCRIPT'];
const SELF_REGISTER_ROLES: Role[] = ['STUDENT', 'EMPLOYER', 'INSTITUTION'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_RE = /^[A-Za-z0-9_-]{4,80}$/;

function str(value: unknown, max: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, max);
}

function clientIp(req: Request): string {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function actorTypeFor(role: Role): AuditLogEntry['actorType'] {
  return role === 'STUDENT' ? 'STUDENT' : role === 'EMPLOYER' ? 'EMPLOYER' : 'SYSTEM';
}

function buildAuditEntry(params: {
  actor: string;
  actorType: AuditLogEntry['actorType'];
  action: AuditLogEntry['action'];
  studentApaarId: string;
  details: string;
  level: AuditLogEntry['level'];
  requestId?: string;
}): AuditLogEntry {
  const id = generateServerId('AUDIT');
  const timestamp = new Date().toISOString();
  const fingerprint = crypto
    .createHash('sha256')
    .update([id, timestamp, params.actor, params.action, params.studentApaarId, params.details, params.requestId || ''].join('|'))
    .digest('hex');
  return { id, timestamp, sha256Fingerprint: fingerprint, ...params };
}

function sanitizeCredential(raw: any, fallbackInstitution: string): AcademicCredential | null {
  if (!raw || typeof raw !== 'object') return null;
  const type = CREDENTIAL_TYPES.includes(raw.type) ? raw.type : null;
  const year = Number(raw.yearOfPassing);
  if (!type || !Number.isInteger(year) || year < 1950 || year > 2100) return null;
  const title = str(raw.title, 200);
  const cgpa = str(raw.cgpaOrPercentage, 60);
  if (!title || !cgpa) return null;
  return {
    id: typeof raw.id === 'string' && ID_RE.test(raw.id) ? raw.id : generateServerId('CRED'),
    type,
    title,
    issuingInstitution: str(raw.issuingInstitution, 200, fallbackInstitution) || fallbackInstitution,
    issuingAuthority: str(raw.issuingAuthority, 200, 'Registrar'),
    yearOfPassing: year,
    cgpaOrPercentage: cgpa,
    specialization: str(raw.specialization, 200),
    digilockerUri: str(raw.digilockerUri, 300),
    aicteApprovalNumber: str(raw.aicteApprovalNumber, 80, 'N/A') || 'N/A',
    sha256Hash: '',
    digitalSignature: '',
    issuerCertificateSerial: '',
    timestamp: new Date().toISOString(),
  };
}

function sanitizeStudent(raw: any): Student | null {
  if (!raw || typeof raw !== 'object') return null;
  const valid = validateApaarId(String(raw.apaarId || ''));
  if (!valid.isValid) return null;
  const name = str(raw.name, 120);
  const institution = str(raw.currentInstitution, 200);
  if (name.length < 2 || institution.length < 2) return null;
  return {
    apaarId: formatApaarId(String(raw.apaarId)),
    pen: str(raw.pen, 20),
    name,
    dob: str(raw.dob, 40),
    gender: ['Female', 'Male', 'Other'].includes(raw.gender) ? raw.gender : 'Other',
    currentInstitution: institution,
    stage: str(raw.stage, 40, 'UG') as Student['stage'],
    gradeOrClass: str(raw.gradeOrClass, 80),
    district: str(raw.district, 80),
    status: ['Active', 'Graduated', 'Dropped out'].includes(raw.status) ? raw.status : 'Active',
    aadhaarMismatch: false,
    consentPending: !!raw.consentPending,
    hasDigilockerAccount: raw.hasDigilockerAccount !== false,
    digilockerDocumentsCount: Math.max(0, Math.min(1000, Number(raw.digilockerDocumentsCount) || 0)),
    abcCreditsBalance: Math.max(0, Math.min(10000, Number(raw.abcCreditsBalance) || 0)),
    credentials: [],
    contactEmail: str(raw.contactEmail, 160),
    contactPhone: str(raw.contactPhone, 30),
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

async function startServer() {
  assertSecretsConfigured(); // stops the server in production if secrets are missing

  let dbReady = false;
  if (!isDatabaseConfigured()) {
    console.warn('[db] No database settings found (DATABASE_URL or SQL_*). The UI will load, but /api routes return 503.');
  } else {
    try {
      await ensureDatabaseTables();
      const seeded = await seedDemoDataIfEmpty();
      if (seeded) console.log('[db] Loaded demo registry, accounts and sample requests.');
      await configureDemoPasswords();
      dbReady = true;
    } catch (err) {
      console.error('[db] Database unavailable; /api routes will return 503.', err);
    }
  }

  const app = express();
  const httpServer = http.createServer(app);
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // ------------------------------------------------------------------
  // Real-time: every SSE / WebSocket client must present a session token,
  // and only receives events it is allowed to see.
  // ------------------------------------------------------------------

  interface LiveClient {
    caller: Caller;
    send: (data: string) => void;
  }
  const sseClients = new Set<LiveClient>();
  const wsClients = new Map<WebSocket, LiveClient>();

  function activeConnections(): number {
    return sseClients.size + wsClients.size;
  }

  function payloadFor(type: RealtimeEvent['type'], payload: any, caller: Caller): any {
    if (type === 'student:upserted') {
      return filterStudentsForCaller([payload as StoredStudent], [], caller)[0];
    }
    if (type === 'request:upserted') return toPublicRequest(payload as StoredRequest);
    if (type === 'audit:created') return toPublicAuditLog(payload as StoredAuditLog);
    return payload;
  }

  function broadcast(type: RealtimeEvent['type'], payload: any, ctx: EventContext = {}) {
    const timestamp = new Date().toISOString();
    const deliver = (client: LiveClient) => {
      if (!canReceiveEvent(type, client.caller, ctx)) return;
      const body = payloadFor(type, payload, client.caller);
      if (body === undefined) return;
      try {
        client.send(JSON.stringify({ type, payload: body, timestamp }));
      } catch {
        // dropped connection; cleaned up on close
      }
    };
    sseClients.forEach(deliver);
    wsClients.forEach(deliver);
  }

  function broadcastPresence() {
    broadcast('presence:update', { activeConnections: activeConnections() });
  }

  const wss = new WebSocketServer({ noServer: true });
  httpServer.on('upgrade', async (req, socket, head) => {
    const url = new URL(req.url || '', 'http://localhost');
    if (url.pathname !== '/ws') return; // other upgrade requests (none in production)
    const user = dbReady ? await resolveSessionToken(url.searchParams.get('token')).catch(() => null) : null;
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, ws => {
      const client: LiveClient = { caller: callerFromDbUser(user), send: data => ws.send(data) };
      wsClients.set(ws, client);
      ws.send(JSON.stringify({ type: 'connected', payload: { activeConnections: activeConnections() }, timestamp: new Date().toISOString() }));
      broadcastPresence();
      ws.on('message', raw => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg?.type === 'ping') ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        } catch {
          // ignore malformed messages
        }
      });
      ws.on('close', () => {
        wsClients.delete(ws);
        broadcastPresence();
      });
    });
  });

  app.get('/api/realtime/stream', async (req: Request, res: Response) => {
    const user = dbReady ? await resolveSessionToken(String(req.query.token || '')).catch(() => null) : null;
    if (!user) return res.status(401).json({ error: 'Unauthorized: missing or invalid session token' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client: LiveClient = { caller: callerFromDbUser(user), send: data => res.write(`data: ${data}\n\n`) };
    sseClients.add(client);
    client.send(JSON.stringify({ type: 'connected', payload: { activeConnections: activeConnections() }, timestamp: new Date().toISOString() }));
    broadcastPresence();

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(client);
      broadcastPresence();
    });
  });

  // ------------------------------------------------------------------
  // Health (no data) and database guard
  // ------------------------------------------------------------------

  app.get('/api/health', (_req, res) => {
    res.json({ status: dbReady ? 'ok' : 'degraded', database: dbReady ? 'connected' : 'unavailable', timestamp: new Date().toISOString() });
  });

  app.use(['/api/auth', '/api/db'], (_req: Request, res: Response, next: NextFunction) => {
    if (!dbReady) return res.status(503).json({ error: 'Database is not configured or unreachable. See README setup steps.' });
    next();
  });

  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------

  async function sessionResponse(user: DbUser, method: string, req: Request) {
    const log = buildAuditEntry({
      actor: `${user.name} (${user.role})`,
      actorType: actorTypeFor(user.role),
      action: 'PREFERENCES_UPDATED',
      studentApaarId: user.apaarId || 'AUTH_GATEWAY',
      details: `Signed in via ${method}. Organization: ${user.organization}. IP: ${clientIp(req)}.`,
      level: 'SUCCESS',
    });
    const stored = await insertAuditLog(log, user.uid);
    broadcast('audit:created', stored, { actorUid: user.uid, studentApaarId: user.apaarId });
    return { token: issueSessionToken(user.uid), user: toPublicUser(user) };
  }

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const email = str(req.body?.email, 160).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!rateLimit(`login:${clientIp(req)}:${email}`, 10, 15 * 60 * 1000)) {
        return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
      }
      const user = email ? await getUserByEmail(email) : null;
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }
      res.json(await sessionResponse(user, 'email and password', req));
    } catch (err) {
      console.error('Login failed:', err);
      res.status(500).json({ error: 'Sign-in failed. Please try again.' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      if (!rateLimit(`register:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
        return res.status(429).json({ error: 'Too many registrations from this network. Try again later.' });
      }
      const body = req.body || {};
      const role = body.role as Role;
      if (role === 'REGULATOR') {
        return res.status(403).json({ error: 'Regulator accounts cannot be self-registered. They are created by the Ministry.' });
      }
      if (!SELF_REGISTER_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Choose Student, Employer or Institution.' });
      }
      const name = str(body.name, 120);
      const email = str(body.email, 160).toLowerCase();
      const organization = str(body.organization, 160);
      if (name.length < 2) return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (organization.length < 2) return res.status(400).json({ error: 'Organization or college name is required.' });
      const pwError = validatePasswordStrength(body.password);
      if (pwError) return res.status(400).json({ error: pwError });
      if (await getUserByEmail(email)) {
        return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      let apaarId: string | null = null;
      if (role === 'STUDENT') {
        if (body.apaarId) {
          const check = validateApaarId(String(body.apaarId));
          if (!check.isValid) return res.status(400).json({ error: check.error });
          const digits = digitsOnly(body.apaarId);
          if ((await getUserByApaarId(digits)) || (await getStudentStored(digits))) {
            return res.status(409).json({
              error: 'This APAAR ID is already in the registry. Sign in with "APAAR ID + OTP" to prove it is yours.',
            });
          }
          apaarId = formatApaarId(digits);
        } else {
          const existingIds = (await getAllStudentsStored()).map(s => s.apaarId);
          apaarId = generateValidApaarId(existingIds);
        }
      }

      const user = await createUser({
        uid: generateUid(role),
        name,
        email,
        role,
        organization,
        designation: str(body.designation, 120),
        phone: str(body.phone, 30),
        apaarId,
        passwordHash: hashPassword(body.password),
        authProvider: 'password',
      });

      if (role === 'STUDENT' && apaarId) {
        // A self-registered student gets a registry entry with no credentials;
        // only an institution can issue signed credentials.
        await insertStudent(
          {
            apaarId,
            pen: '',
            name,
            dob: '',
            gender: 'Other',
            currentInstitution: organization,
            stage: 'UG',
            district: '',
            status: 'Active',
            aadhaarMismatch: false,
            consentPending: false,
            hasDigilockerAccount: true,
            digilockerDocumentsCount: 0,
            abcCreditsBalance: 0,
            credentials: [],
            contactEmail: email,
            contactPhone: user.phone,
          },
          user.uid
        );
      }

      broadcast('user:synced', toPublicUser(user), { subjectUid: user.uid });
      res.status(201).json(await sessionResponse(user, 'new account registration', req));
    } catch (err) {
      console.error('Registration failed:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/otp/request', async (req: Request, res: Response) => {
    try {
      const digits = digitsOnly(req.body?.apaarId);
      if (digits.length !== 12) return res.status(400).json({ error: 'Enter a valid 12-digit APAAR ID.' });
      if (!rateLimit(`otp-req:${clientIp(req)}`, 10, 15 * 60 * 1000) || !rateLimit(`otp-req-id:${digits}`, 3, 5 * 60 * 1000)) {
        return res.status(429).json({ error: 'Too many OTP requests. Wait a few minutes and try again.' });
      }
      const student = await getStudentStored(digits);
      const message = 'If this APAAR ID is registered, a 6-digit OTP has been sent to the linked mobile number. It is valid for 5 minutes.';
      if (!student) return res.json({ message });

      const otp = issueOtp(`apaar:${digits}`);
      // No SMS gateway is connected yet. In development the OTP is returned so the demo works;
      // in production it is only written to the server log for the operator.
      if (isProd) {
        console.log(`[otp] OTP issued for APAAR ${formatApaarId(digits)} (SMS gateway not configured).`);
        return res.json({ message });
      }
      res.json({ message, devOtp: otp, devNote: 'Development mode: shown here because no SMS gateway is configured.' });
    } catch (err) {
      console.error('OTP request failed:', err);
      res.status(500).json({ error: 'Could not send OTP.' });
    }
  });

  app.post('/api/auth/otp/verify', async (req: Request, res: Response) => {
    try {
      const digits = digitsOnly(req.body?.apaarId);
      const otp = str(req.body?.otp, 6);
      if (digits.length !== 12 || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({ error: 'Enter the 12-digit APAAR ID and the 6-digit OTP.' });
      }
      if (!consumeOtp(`apaar:${digits}`, otp)) {
        return res.status(401).json({ error: 'Incorrect or expired OTP. Request a new one.' });
      }
      let user = await getUserByApaarId(digits);
      if (!user) {
        const student = await getStudentStored(digits);
        if (!student) return res.status(404).json({ error: 'No student record for this APAAR ID.' });
        const preferredEmail = (student.contactEmail || '').toLowerCase();
        const email =
          preferredEmail && EMAIL_RE.test(preferredEmail) && !(await getUserByEmail(preferredEmail))
            ? preferredEmail
            : `apaar-${digits}@students.apaar.invalid`;
        user = await createUser({
          uid: generateUid('STUDENT'),
          name: student.name,
          email,
          role: 'STUDENT',
          organization: student.currentInstitution,
          designation: 'Verified APAAR Student',
          phone: student.contactPhone,
          apaarId: student.apaarId,
          passwordHash: null,
          authProvider: 'apaar_otp',
        });
      }
      res.json(await sessionResponse(user, 'APAAR ID and OTP', req));
    } catch (err) {
      console.error('OTP verify failed:', err);
      res.status(500).json({ error: 'Could not verify OTP.' });
    }
  });

  app.post('/api/auth/firebase', async (req: Request, res: Response) => {
    try {
      const idToken = str(req.body?.idToken, 5000);
      if (!idToken) return res.status(400).json({ error: 'Missing Google sign-in token.' });
      const { adminAuth } = await import('./src/lib/firebase-admin.ts');
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (!decoded.email || decoded.email_verified !== true) {
        return res.status(403).json({ error: 'Your Google account email must be verified.' });
      }
      let user = await getUserByEmail(decoded.email);
      if (!user) {
        // New Google users start as students with no APAAR ID linked; they link one by APAAR + OTP.
        user = await createUser({
          uid: `user-stu-g-${decoded.uid}`,
          name: decoded.name || decoded.email.split('@')[0],
          email: decoded.email,
          role: 'STUDENT',
          organization: 'Not set',
          designation: 'Google sign-in',
          authProvider: 'google',
        });
      }
      res.json(await sessionResponse(user, 'Google sign-in', req));
    } catch (err) {
      console.error('Google sign-in failed:', err);
      res.status(401).json({ error: 'Google sign-in could not be verified.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
    res.json({ user: toPublicUser(req.dbUser!) });
  });

  // ------------------------------------------------------------------
  // Reads — always filtered by the caller's role and ownership
  // ------------------------------------------------------------------

  async function loadAll() {
    const [students, requests, logs] = await Promise.all([getAllStudentsStored(), getAllRequestsStored(), getAllAuditLogsStored()]);
    return { students, requests, logs };
  }

  async function visibleUsers(caller: Caller, self: DbUser) {
    if (caller.role === 'REGULATOR') return (await getAllUsers()).map(toPublicUser);
    return [toPublicUser(self)];
  }

  app.get('/api/db/state', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const caller = req.user!;
      const { students, requests, logs } = await loadAll();
      res.json({
        students: filterStudentsForCaller(students, requests, caller),
        requests: filterRequestsForCaller(requests, students, caller),
        auditLogs: filterAuditLogsForCaller(logs, requests, students, caller),
        users: await visibleUsers(caller, req.dbUser!),
        activeConnections: activeConnections(),
      });
    } catch (err) {
      console.error('Error fetching state:', err);
      res.status(500).json({ error: 'Failed to load data' });
    }
  });

  app.get('/api/db/students', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { students, requests } = await loadAll();
      res.json(filterStudentsForCaller(students, requests, req.user!));
    } catch (err) {
      console.error('Error fetching students:', err);
      res.status(500).json({ error: 'Failed to load students' });
    }
  });

  app.get('/api/db/requests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { students, requests } = await loadAll();
      res.json(filterRequestsForCaller(requests, students, req.user!));
    } catch (err) {
      console.error('Error fetching requests:', err);
      res.status(500).json({ error: 'Failed to load requests' });
    }
  });

  app.get('/api/db/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { students, requests, logs } = await loadAll();
      res.json(filterAuditLogsForCaller(logs, requests, students, req.user!));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ error: 'Failed to load audit logs' });
    }
  });

  app.get('/api/db/users', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      res.json(await visibleUsers(req.user!, req.dbUser!));
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to load users' });
    }
  });

  // ------------------------------------------------------------------
  // Students — institutions write their own students; credentials are
  // signed by the server; students may only confirm their own enrolment.
  // ------------------------------------------------------------------

  app.post('/api/db/students', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const caller = req.user!;
      const incoming = sanitizeStudent(req.body);
      if (!incoming) return res.status(400).json({ error: 'Student record is missing a valid APAAR ID, name or institution.' });

      const existing = await getStudentStored(incoming.apaarId);
      const decision = canWriteStudent(caller, existing, incoming);
      if (!decision.ok) return res.status(decision.status).json({ error: decision.error });

      const canIssueCredentials = caller.role === 'INSTITUTION' || caller.role === 'REGULATOR';
      const rawCreds: any[] = Array.isArray(req.body.credentials) ? req.body.credentials.slice(0, 20) : [];
      const newCreds = canIssueCredentials
        ? rawCreds
            .map(c => sanitizeCredential(c, incoming.currentInstitution))
            .filter((c): c is AcademicCredential => !!c)
            .filter(c => !existing?.credentials.some(e => e.id === c.id))
            .map(c => signCredential(c))
        : [];

      if (!existing) {
        await insertStudent(incoming, caller.uid);
      } else if (caller.role === 'STUDENT') {
        // A student can only confirm their own APAAR enrolment consent.
        await updateStudentFields(existing.apaarId, {
          consentPending: incoming.consentPending ? existing.consentPending : false,
        });
      } else {
        await updateStudentFields(existing.apaarId, {
          name: incoming.name,
          currentInstitution: incoming.currentInstitution,
          stage: incoming.stage,
          status: incoming.status,
          district: incoming.district,
          consentPending: incoming.consentPending,
          digilockerDocumentsCount: incoming.digilockerDocumentsCount,
          abcCreditsBalance: incoming.abcCreditsBalance,
          contactEmail: incoming.contactEmail,
          contactPhone: incoming.contactPhone,
        });
      }
      const targetId = existing?.apaarId || incoming.apaarId;
      if (newCreds.length > 0) await insertCredentials(targetId, newCreds);

      const saved = (await getStudentStored(targetId))!;
      const log = await insertAuditLog(
        buildAuditEntry({
          actor: `${caller.name} (${caller.role})`,
          actorType: actorTypeFor(caller.role),
          action: 'APAAR_ENROLLMENT_APPROVED',
          studentApaarId: saved.apaarId,
          details: existing
            ? `Updated registry record for ${saved.name}.${newCreds.length ? ` Issued ${newCreds.length} signed credential(s).` : ''}`
            : `Registered ${saved.name} in the APAAR registry.${newCreds.length ? ` Issued ${newCreds.length} signed credential(s).` : ''}`,
          level: 'SUCCESS',
        }),
        caller.uid
      );
      const ctx: EventContext = { studentApaarId: saved.apaarId, studentCreatedBy: saved.createdByUid, actorUid: caller.uid };
      broadcast('student:upserted', saved, ctx);
      broadcast('audit:created', log, ctx);
      res.status(existing ? 200 : 201).json(filterStudentsForCaller([saved], [], caller)[0] ?? null);
    } catch (err) {
      console.error('Error saving student:', err);
      res.status(500).json({ error: 'Failed to save student record' });
    }
  });

  // ------------------------------------------------------------------
  // Verification requests
  // ------------------------------------------------------------------

  async function requestContext(r: StoredRequest, actorUid?: string): Promise<EventContext> {
    const student = await getStudentStored(r.studentApaarId);
    return { studentApaarId: r.studentApaarId, employerUid: r.employerUid, studentCreatedBy: student?.createdByUid, actorUid };
  }

  app.post('/api/db/requests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const caller = req.user!;
      if (caller.role !== 'EMPLOYER') {
        return res.status(403).json({ error: 'Only employer accounts can create verification requests.' });
      }
      const body = req.body || {};
      const student = await getStudentStored(String(body.studentApaarId || ''));
      if (!student) return res.status(404).json({ error: 'No student with this APAAR ID in the registry.' });

      const types = (Array.isArray(body.requestedCredentialTypes) ? body.requestedCredentialTypes : []).filter((t: any) =>
        CREDENTIAL_TYPES.includes(t)
      );
      if (types.length === 0) return res.status(400).json({ error: 'Choose at least one credential type.' });
      const scope = (Array.isArray(body.scopeOfAccess) ? body.scopeOfAccess : ['IDENTITY']).filter((s: any) => SCOPES.includes(s));
      const purpose = str(body.purpose, 300);
      if (purpose.length < 5) return res.status(400).json({ error: 'Describe the purpose of the verification.' });

      const now = Date.now();
      const requestedExpiry = Date.parse(body.consentExpiresAt);
      const maxExpiry = now + 30 * 24 * 3600 * 1000;
      const expiry = Number.isFinite(requestedExpiry) && requestedExpiry > now ? Math.min(requestedExpiry, maxExpiry) : now + 24 * 3600 * 1000;

      const id = typeof body.id === 'string' && ID_RE.test(body.id) && !(await getRequestStored(body.id)) ? body.id : generateServerId('BGV');
      const record: VerificationRequest = {
        id,
        employerId: caller.uid,
        employerName: caller.organization,
        verifierName: caller.name,
        verifierRole: str(req.dbUser!.designation, 120, 'Verifier') || 'Verifier',
        verifierEmail: caller.email,
        verifierIp: '',
        studentApaarId: student.apaarId,
        studentName: student.name,
        requestedCredentialTypes: types,
        purpose,
        requestedAt: new Date(now).toISOString(),
        consentExpiresAt: new Date(expiry).toISOString(),
        status: 'PENDING_STUDENT_CONSENT', // always: only the student can grant consent
        scopeOfAccess: scope.length ? scope : ['IDENTITY'],
        auditTrailId: `AUDIT-${id}`,
      };
      if (!(await insertRequest(record, caller.uid))) {
        return res.status(409).json({ error: 'A request with this ID already exists.' });
      }
      const saved = (await getRequestStored(id))!;
      const ctx = await requestContext(saved, caller.uid);
      const log = await insertAuditLog(
        buildAuditEntry({
          actor: `${caller.organization} (${caller.name})`,
          actorType: 'EMPLOYER',
          action: 'REQUEST_INITIATED',
          studentApaarId: student.apaarId,
          details: `Submitted background check request #${id} for [${types.join(', ')}]. Purpose: ${purpose}`,
          level: 'INFO',
          requestId: id,
        }),
        caller.uid
      );
      broadcast('request:upserted', saved, ctx);
      broadcast('audit:created', log, ctx);
      broadcast(
        'alert:dispatched',
        { requestId: id, studentName: student.name, studentApaarId: student.apaarId, employerName: caller.organization, requestedCredentials: types, purpose },
        ctx
      );
      res.status(201).json(toPublicRequest(saved));
    } catch (err) {
      console.error('Error creating request:', err);
      res.status(500).json({ error: 'Failed to create verification request' });
    }
  });

  app.patch('/api/db/requests/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const caller = req.user!;
      const existing = await getRequestStored(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Request not found.' });
      const target = req.body?.status;
      const decision = canChangeRequestStatus(caller, existing, target);
      if (!decision.ok) return res.status(decision.status).json({ error: decision.error });

      const nowIso = new Date().toISOString();
      let details = '';
      let level: AuditLogEntry['level'] = 'INFO';
      let saved: StoredRequest | null = null;

      if (target === 'CONSENT_GRANTED') {
        const scope = (Array.isArray(req.body.scopeOfAccess) ? req.body.scopeOfAccess : existing.scopeOfAccess).filter((s: any) =>
          SCOPES.includes(s)
        );
        const requestedExpiry = Date.parse(req.body.consentExpiresAt);
        const maxExpiry = Date.now() + 30 * 24 * 3600 * 1000;
        const consentExpiresAt =
          Number.isFinite(requestedExpiry) && requestedExpiry > Date.now()
            ? new Date(Math.min(requestedExpiry, maxExpiry)).toISOString()
            : existing.consentExpiresAt;
        saved = await updateRequestFields(existing.id, { status: target, consentGrantedAt: nowIso, scopeOfAccess: scope, consentExpiresAt });
        details = `Student granted ${existing.employerName} access. Scope: [${scope.join(', ')}]. Valid until ${consentExpiresAt}.`;
        level = 'SUCCESS';
      } else if (target === 'CONSENT_REJECTED') {
        const reason = str(req.body.rejectionReason, 300, 'No reason given');
        saved = await updateRequestFields(existing.id, { status: target, rejectionReason: reason });
        details = `Student declined the request from ${existing.employerName}. Reason: "${reason}"`;
        level = 'ALERT';
      } else {
        const reason = str(req.body.revocationReason, 300, 'No reason given');
        saved = await updateRequestFields(existing.id, { status: target, consentRevokedAt: nowIso, revocationReason: reason });
        details = `Student withdrew consent under DPDP Act 2023 § 6(4). Access for ${existing.employerName} ended. Reason: "${reason}"`;
        level = 'ALERT';
      }

      const ctx = await requestContext(saved!, caller.uid);
      const log = await insertAuditLog(
        buildAuditEntry({
          actor: `Student: ${caller.name} (APAAR: ${existing.studentApaarId})`,
          actorType: 'STUDENT',
          action: target,
          studentApaarId: existing.studentApaarId,
          details,
          level,
          requestId: existing.id,
        }),
        caller.uid
      );
      broadcast('request:upserted', saved, ctx);
      broadcast('audit:created', log, ctx);
      res.json(toPublicRequest(saved!));
    } catch (err) {
      console.error('Error updating request:', err);
      res.status(500).json({ error: 'Failed to update verification request' });
    }
  });

  /** Server-side credential verification. The only way a request becomes VERIFIED or TAMPERED_FAILED. */
  app.post('/api/db/requests/:id/verify', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const started = Date.now();
      const caller = req.user!;
      const existing = await getRequestStored(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Request not found.' });
      const decision = canVerifyRequest(caller, existing);
      if (!decision.ok) return res.status(decision.status).json({ error: decision.error });

      const student = await getStudentStored(existing.studentApaarId);
      const creds = (student?.credentials || []).filter(c => existing.requestedCredentialTypes.includes(c.type));
      if (creds.length === 0) {
        return res.status(409).json({ error: 'No issued credentials of the requested types are on record for this student.' });
      }

      // Demo switch: alter the first credential in memory to show that tampering is detected.
      const simulateTamper = req.body?.simulateTamper === true;
      const checked = creds.map((c, i) =>
        verifyCredentialSignature(simulateTamper && i === 0 ? { ...c, cgpaOrPercentage: `${c.cgpaOrPercentage} (edited)` } : c)
      );
      const failed = checked.find(r => !r.valid);
      const finalStatus = failed ? 'TAMPERED_FAILED' : 'VERIFIED';

      // Lifecycle: CONSENT_GRANTED -> VERIFYING -> VERIFIED | TAMPERED_FAILED (checked by canVerifyRequest
      // and transitionRequestStatus; the VERIFYING step happens inside this call).
      const toVerifying = existing.status === 'VERIFYING' || transitionRequestStatus(existing.status, 'VERIFYING').allowed;
      if (!toVerifying || !transitionRequestStatus('VERIFYING', finalStatus).allowed) {
        return res.status(409).json({ error: 'Request lifecycle does not allow verification.' });
      }
      const saved = await updateRequestFields(existing.id, {
        status: finalStatus,
        backendValidation: {
          repositoryChecked: 'AICTE Central Repository',
          signatureAlgorithm: 'HMAC-SHA256',
          certificateSerial: SERVER_ISSUER_SERIAL,
          issuerCA: 'APAAR server credential signing key',
          sha256Digest: (failed || checked[0]).computedDigest,
          verifiedAt: new Date().toISOString(),
          isTampered: !!failed,
          tamperDetails: failed?.reason,
          networkLatencyMs: Date.now() - started,
        },
      });

      const ctx = await requestContext(saved!, caller.uid);
      const log = await insertAuditLog(
        buildAuditEntry({
          actor: 'APAAR server verification engine',
          actorType: 'AICTE_GATEWAY',
          action: failed ? 'SECURITY_TAMPER_ALERT' : 'DIGITAL_SIGNATURE_VERIFIED',
          studentApaarId: existing.studentApaarId,
          details: failed
            ? `Signature check FAILED for ${existing.studentName}: ${failed.reason} Requested by ${existing.employerName}.`
            : `Checked ${creds.length} credential signature(s) for ${existing.studentName}; all match. Requested by ${existing.employerName}.`,
          level: failed ? 'ALERT' : 'SUCCESS',
          requestId: existing.id,
        }),
        null
      );
      broadcast('request:upserted', saved, ctx);
      broadcast('audit:created', log, ctx);
      res.json(toPublicRequest(saved!));
    } catch (err) {
      console.error('Error verifying request:', err);
      res.status(500).json({ error: 'Verification failed to run' });
    }
  });

  // ------------------------------------------------------------------
  // Audit logs — clients may only add their own activity notes; the actor,
  // time, ID and fingerprint are always set by the server.
  // ------------------------------------------------------------------

  const CLIENT_LOGGABLE_ACTIONS: AuditLogEntry['action'][] = ['PREFERENCES_UPDATED', 'REPORT_DOWNLOADED'];

  app.post('/api/db/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const caller = req.user!;
      const action = req.body?.action;
      if (!CLIENT_LOGGABLE_ACTIONS.includes(action)) {
        return res.status(403).json({ error: 'This event is recorded by the server automatically and cannot be posted by clients.' });
      }
      const studentApaarId =
        caller.role === 'STUDENT' ? caller.apaarId || 'SYSTEM_LEVEL' : str(req.body.studentApaarId, 64, 'SYSTEM_LEVEL') || 'SYSTEM_LEVEL';
      const level: AuditLogEntry['level'] = ['SUCCESS', 'INFO', 'ALERT'].includes(req.body.level) ? req.body.level : 'INFO';
      const log = await insertAuditLog(
        buildAuditEntry({
          actor: `${caller.name} (${caller.role})`,
          actorType: actorTypeFor(caller.role),
          action,
          studentApaarId,
          details: str(req.body.details, 600, 'No details') || 'No details',
          level,
        }),
        caller.uid
      );
      broadcast('audit:created', log, { actorUid: caller.uid, studentApaarId });
      res.status(201).json(toPublicAuditLog(log));
    } catch (err) {
      console.error('Error saving audit log:', err);
      res.status(500).json({ error: 'Failed to record audit log' });
    }
  });

  // ------------------------------------------------------------------
  // Own profile — role, email and APAAR ID cannot be changed here
  // ------------------------------------------------------------------

  app.post('/api/db/users/sync', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const updated = await updateUserProfile(req.user!.uid, {
        name: str(req.body?.name, 120) || undefined,
        organization: str(req.body?.organization, 160) || undefined,
        designation: typeof req.body?.designation === 'string' ? str(req.body.designation, 120) : undefined,
        phone: typeof req.body?.phone === 'string' ? str(req.body.phone, 30) : undefined,
      });
      const pub = toPublicUser(updated!);
      broadcast('user:synced', pub, { subjectUid: req.user!.uid });
      res.json(pub);
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ------------------------------------------------------------------
  // Frontend
  // ------------------------------------------------------------------

  if (!isProd) {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (database: ${dbReady ? 'connected' : 'unavailable'})`);
  });
}

/**
 * Demo accounts have no password in the code.
 * - DEMO_PASSWORD set: demo accounts use it.
 * - Development without DEMO_PASSWORD: a random password is generated and printed at startup.
 * - Production without DEMO_PASSWORD: demo accounts are locked (no password login).
 */
async function configureDemoPasswords() {
  const configured = process.env.DEMO_PASSWORD;
  if (configured) {
    const problem = validatePasswordStrength(configured);
    if (problem) throw new Error(`DEMO_PASSWORD is too weak: ${problem}`);
    await setSeedAccountPasswords(hashPassword(configured));
    console.log('[demo] Demo accounts use the password from DEMO_PASSWORD.');
    return;
  }
  if (isProd) {
    await setSeedAccountPasswords(null);
    console.log('[demo] Demo accounts are locked in production (set DEMO_PASSWORD to enable them).');
    return;
  }
  const generated = `Demo-${crypto.randomBytes(4).toString('hex')}-${crypto.randomInt(10, 99)}`;
  await setSeedAccountPasswords(hashPassword(generated));
  console.log('');
  console.log('  ┌──────────────────────────────────────────────────────────┐');
  console.log(`  │  Demo account password for this run: ${generated.padEnd(20)}│`);
  console.log('  │  (set DEMO_PASSWORD in .env to keep a fixed one)         │');
  console.log('  └──────────────────────────────────────────────────────────┘');
  console.log('');
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
