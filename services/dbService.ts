import { createClient, Client } from "@libsql/client/web";
import { User, Quiz, Role, LogEntry, LogType, SystemSettings } from "../types";

// Local Storage Keys
const LS_USERS = 'genz_quiz_users';
const LS_QUIZZES = 'genz_quiz_quizzes';
const LS_TURSO_CONFIG = 'genz_turso_config';
const LS_LOGS = 'genz_system_logs';
const LS_SETTINGS = 'genz_settings';

class DbService {
  private client: Client | null = null;
  private isTurso: boolean = false;
  private listeners: ((status: 'TURSO' | 'LOCAL') => void)[] = [];
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Start init immediately but don't block constructor
    this.init();
  }

  // Subscribe to status changes (Reactive UI)
  subscribe(listener: (status: 'TURSO' | 'LOCAL') => void) {
    this.listeners.push(listener);
    // Emit current status immediately upon subscription
    listener(this.getConnectionStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const status = this.getConnectionStatus();
    this.listeners.forEach(l => l(status));
  }

  // Ensure init is only called once and returns a promise
  async init() {
    // Always create a new promise chain to ensure fresh config check
    this.initializationPromise = this._initLogic();
    return this.initializationPromise;
  }

  // CRITICAL FIX: Web driver requires HTTPS, not libsql://
  private formatUrl(url: string): string {
    if (!url) return '';
    let cleanUrl = url.trim();
    
    // Jika user memasukkan libsql://, ubah ke https://
    if (cleanUrl.startsWith('libsql://')) {
        cleanUrl = cleanUrl.replace('libsql://', 'https://');
    } 
    // Jika tidak ada protokol, tambahkan https://
    else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
    }

    // Hapus trailing slash
    return cleanUrl.replace(/\/$/, '');
  }

  private async _initLogic() {
    let url = process.env.TURSO_DB_URL;
    let authToken = process.env.TURSO_AUTH_TOKEN;

    // 1. Cek Local Storage TERLEBIH DAHULU jika ENV kosong atau jika user ingin override
    // Kita prioritaskan LS jika ENV tidak valid
    if (!url || url.length < 5) {
        const stored = localStorage.getItem(LS_TURSO_CONFIG);
        if (stored) {
            try {
                const config = JSON.parse(stored);
                if (config.url && config.token) {
                    url = config.url;
                    authToken = config.token;
                }
            } catch (e) {
                console.error("Invalid stored Turso config", e);
            }
        }
    }

    // Reset state
    this.client = null;
    this.isTurso = false;

    if (url && authToken) {
      try {
        const safeUrl = this.formatUrl(url);
        // console.log("Attempting Turso connection to:", safeUrl); 

        this.client = createClient({
          url: safeUrl,
          authToken,
        });
        
        // Verify connection dengan query ringan
        await this.client.execute("SELECT 1");
        
        this.isTurso = true;
        
        // Create tables if connection successful
        await this.createTables();
        await this.seedUsers();
        
        console.log("Connected to Turso Successfully");
        this.notifyListeners(); 
      } catch (e) {
        console.error("Failed to connect to Turso. Falling back to Local Storage.", e);
        this.isTurso = false;
        this.client = null;
        this.seedLocalUsers();
        this.notifyListeners();
      }
    } else {
      console.log("No Turso credentials found. Using Local Storage.");
      this.isTurso = false;
      this.client = null;
      this.seedLocalUsers();
      this.notifyListeners();
    }
  }

  async testConnection(url: string, token: string): Promise<boolean> {
    try {
      const safeUrl = this.formatUrl(url);
      const tempClient = createClient({
        url: safeUrl,
        authToken: token,
      });
      await tempClient.execute("SELECT 1");
      return true;
    } catch (e) {
      console.error("Test connection failed:", e);
      return false;
    }
  }

  getStoredConfig() {
      const stored = localStorage.getItem(LS_TURSO_CONFIG);
      return stored ? JSON.parse(stored) : { url: '', token: '' };
  }

  async setTursoConfig(url: string, token: string): Promise<boolean> {
      // Simpan config mentah, nanti formatUrl yang membereskan saat init
      localStorage.setItem(LS_TURSO_CONFIG, JSON.stringify({ url, token }));
      
      // Force re-initialization immediately
      await this.init();
      
      return this.isTurso;
  }

  async disconnectTurso() {
      localStorage.removeItem(LS_TURSO_CONFIG);
      await this.init();
  }

  getConnectionStatus(): 'TURSO' | 'LOCAL' {
    return this.isTurso ? 'TURSO' : 'LOCAL';
  }

  async createTables() {
    if (!this.client) return;
    
    try {
        await this.client.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            credits INTEGER,
            is_active BOOLEAN
        )
        `);

        await this.client.execute(`
        CREATE TABLE IF NOT EXISTS quizzes (
            id TEXT PRIMARY KEY,
            title TEXT,
            subject TEXT,
            level TEXT,
            grade TEXT,
            topic TEXT,
            data TEXT, 
            created_by TEXT,
            created_at TEXT,
            status TEXT,
            is_public BOOLEAN
        )
        `);

        await this.client.execute(`
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            action TEXT,
            details TEXT,
            type TEXT,
            user_id TEXT,
            timestamp INTEGER
        )
        `);

        await this.client.execute(`
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            data TEXT
        )
        `);
    } catch (e) {
        console.error("Error creating tables:", e);
        throw e;
    }
  }

  async seedUsers() {
    if (!this.client) return;

    try {
        const adminCheck = await this.client.execute({
          sql: "SELECT * FROM users WHERE username = ?",
          args: ["hairi"]
        });

        if (adminCheck.rows.length === 0) {
          await this.client.execute({
            sql: "INSERT INTO users (id, username, password, role, credits, is_active) VALUES (?, ?, ?, ?, ?, ?)",
            args: ["1", "hairi", "Midorima88@@", Role.ADMIN, 9999, true]
          });
        }

        const teacherCheck = await this.client.execute({
          sql: "SELECT * FROM users WHERE username = ?",
          args: ["guru123"]
        });

        if (teacherCheck.rows.length === 0) {
          await this.client.execute({
            sql: "INSERT INTO users (id, username, password, role, credits, is_active) VALUES (?, ?, ?, ?, ?, ?)",
            args: ["2", "guru123", "guru123", Role.TEACHER, 50, true]
          });
        }
    } catch (e) {
        console.error("Error seeding users", e);
    }
  }

  seedLocalUsers() {
    const existing = localStorage.getItem(LS_USERS);
    if (!existing) {
      const initialUsers = [
        { id: '1', username: 'hairi', password: 'Midorima88@@', role: Role.ADMIN, credits: 9999, isActive: true },
        { id: '2', username: 'guru123', password: 'guru123', role: Role.TEACHER, credits: 50, isActive: true }
      ];
      localStorage.setItem(LS_USERS, JSON.stringify(initialUsers));
    }
  }

  // --- User Operations ---

  async authenticate(username: string, pass: string): Promise<User | null> {
    await this.init(); // Ensure fresh state

    if (this.isTurso && this.client) {
      try {
        const result = await this.client.execute({
          sql: "SELECT * FROM users WHERE username = ? AND password = ?",
          args: [username, pass]
        });
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id as string,
            username: row.username as string,
            role: row.role as Role,
            credits: row.credits as number,
            isActive: Boolean(row.is_active)
          };
        }
        return null;
      } catch (e) {
        console.error("Auth error", e);
        return null;
      }
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      const user = users.find((u: any) => u.username === username && u.password === pass);
      return user || null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (this.isTurso && this.client) {
      try {
        const result = await this.client.execute("SELECT * FROM users ORDER BY role ASC, username ASC");
        return result.rows.map(row => ({
          id: row.id as string,
          username: row.username as string,
          role: row.role as Role,
          credits: row.credits as number,
          isActive: Boolean(row.is_active)
        }));
      } catch(e) { console.error(e); return []; }
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      return users.map((u: any) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        credits: u.credits,
        isActive: u.isActive
      }));
    }
  }

  async createUser(user: User, password: string) {
    if (this.isTurso && this.client) {
      await this.client.execute({
        sql: "INSERT INTO users (id, username, password, role, credits, is_active) VALUES (?, ?, ?, ?, ?, ?)",
        args: [user.id, user.username, password, user.role, user.credits, user.isActive ? 1 : 0]
      });
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      users.push({ ...user, password });
      localStorage.setItem(LS_USERS, JSON.stringify(users));
    }
  }

  async deleteUser(id: string) {
      if (this.isTurso && this.client) {
          await this.client.execute({
              sql: "DELETE FROM users WHERE id = ?",
              args: [id]
          });
      } else {
          let users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
          users = users.filter((u: any) => u.id !== id);
          localStorage.setItem(LS_USERS, JSON.stringify(users));
      }
  }

  async toggleUserStatus(id: string, isActive: boolean) {
      if (this.isTurso && this.client) {
          await this.client.execute({
              sql: "UPDATE users SET is_active = ? WHERE id = ?",
              args: [isActive ? 1 : 0, id]
          });
      } else {
          const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
          const user = users.find((u: any) => u.id === id);
          if (user) {
              user.isActive = isActive;
              localStorage.setItem(LS_USERS, JSON.stringify(users));
          }
      }
  }

  async updateUserCredits(userId: string, newCredits: number) {
    if (this.isTurso && this.client) {
      await this.client.execute({
        sql: "UPDATE users SET credits = ? WHERE id = ?",
        args: [newCredits, userId]
      });
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      const idx = users.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        users[idx].credits = newCredits;
        localStorage.setItem(LS_USERS, JSON.stringify(users));
      }
    }
  }

  // --- Quiz Operations ---

  async saveQuiz(quiz: Quiz) {
    if (this.isTurso && this.client) {
      const dataPayload = {
        questions: quiz.questions,
        blueprint: quiz.blueprint,
        subjectCategory: quiz.subjectCategory,
        subTopic: quiz.subTopic
      };

      await this.client.execute({
        sql: `INSERT INTO quizzes (id, title, subject, level, grade, topic, data, created_by, created_at, status, is_public) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          quiz.id, 
          quiz.title, 
          quiz.subject, 
          quiz.level, 
          quiz.grade, 
          quiz.topic, 
          JSON.stringify(dataPayload),
          quiz.createdBy,
          quiz.createdAt,
          quiz.status,
          quiz.isPublic ? 1 : 0
        ]
      });
    } else {
      const quizzes = JSON.parse(localStorage.getItem(LS_QUIZZES) || '[]');
      quizzes.push(quiz);
      localStorage.setItem(LS_QUIZZES, JSON.stringify(quizzes));
    }
  }

  async deleteQuiz(quizId: string) {
    if (this.isTurso && this.client) {
      await this.client.execute({
        sql: "DELETE FROM quizzes WHERE id = ?",
        args: [quizId]
      });
    } else {
      let quizzes = JSON.parse(localStorage.getItem(LS_QUIZZES) || '[]');
      quizzes = quizzes.filter((q: Quiz) => q.id !== quizId);
      localStorage.setItem(LS_QUIZZES, JSON.stringify(quizzes));
    }
  }

  async toggleQuizVisibility(quizId: string, isPublic: boolean) {
    if (this.isTurso && this.client) {
        await this.client.execute({
            sql: "UPDATE quizzes SET is_public = ? WHERE id = ?",
            args: [isPublic ? 1 : 0, quizId]
        });
    } else {
        const quizzes = JSON.parse(localStorage.getItem(LS_QUIZZES) || '[]');
        const idx = quizzes.findIndex((q: Quiz) => q.id === quizId);
        if (idx !== -1) {
            quizzes[idx].isPublic = isPublic;
            localStorage.setItem(LS_QUIZZES, JSON.stringify(quizzes));
        }
    }
  }

  async getQuizzes(userId?: string): Promise<Quiz[]> {
    if (this.isTurso && this.client) {
      try {
          let sql = "SELECT * FROM quizzes";
          const args = [];
          if (userId) {
            sql += " WHERE created_by = ?";
            args.push(userId);
          }
          sql += " ORDER BY created_at DESC";

          const result = await this.client.execute({ sql, args });
          return result.rows.map(row => {
            const rawData = JSON.parse(row.data as string);
            const isLegacy = Array.isArray(rawData);
            
            const questions = isLegacy ? rawData : (rawData.questions || []);
            const blueprint = isLegacy ? [] : (rawData.blueprint || []);
            const subjectCategory = isLegacy ? 'Wajib Umum' : (rawData.subjectCategory || 'Wajib Umum');
            const subTopic = isLegacy ? undefined : rawData.subTopic;

            return {
              id: row.id as string,
              title: row.title as string,
              subject: row.subject as string,
              subjectCategory, 
              level: row.level as string,
              grade: row.grade as string,
              topic: row.topic as string,
              subTopic,
              blueprint,
              questions,
              createdBy: row.created_by as string,
              createdAt: row.created_at as string,
              status: row.status as any,
              isPublic: Boolean(row.is_public)
            };
          });
      } catch (e) {
          console.error("Error fetching quizzes from Turso", e);
          return [];
      }
    } else {
      const quizzes = JSON.parse(localStorage.getItem(LS_QUIZZES) || '[]');
      if (userId) {
        return quizzes.filter((q: Quiz) => q.createdBy === userId);
      }
      return quizzes;
    }
  }

  // --- Settings Operations ---

  async getSettings(): Promise<SystemSettings> {
    const defaults: SystemSettings = { ai: { factCheck: true }, cron: { enabled: true } };
    if (this.isTurso && this.client) {
        try {
            const res = await this.client.execute("SELECT data FROM settings WHERE id = 'config'");
            if(res.rows.length > 0) return { ...defaults, ...JSON.parse(res.rows[0].data as string) };
        } catch(e) { console.error(e); }
    } else {
        const local = localStorage.getItem(LS_SETTINGS);
        if(local) return { ...defaults, ...JSON.parse(local) };
    }
    return defaults;
  }

  async saveSettings(s: SystemSettings) {
    if (this.isTurso && this.client) {
       await this.client.execute({
           sql: "INSERT INTO settings (id, data) VALUES ('config', ?) ON CONFLICT(id) DO UPDATE SET data = ?",
           args: [JSON.stringify(s), JSON.stringify(s)]
       });
    } else {
       localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
    }
  }

  // --- Log Operations ---

  async addLog(action: string, details: string, type: LogType, userId: string) {
    const log: LogEntry = {
      id: Date.now().toString() + Math.random(),
      action,
      details,
      type,
      userId,
      timestamp: Date.now()
    };

    if (this.isTurso && this.client) {
      try {
        await this.client.execute({
          sql: "INSERT INTO logs (id, action, details, type, user_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
          args: [log.id, log.action, log.details, log.type, log.userId, log.timestamp]
        });
      } catch (e) {
        console.error("Failed to add log to Turso", e);
      }
    } else {
      const logs = JSON.parse(localStorage.getItem(LS_LOGS) || '[]');
      logs.unshift(log); // Add to beginning
      if (logs.length > 200) logs.pop(); // Keep max 200 locally
      localStorage.setItem(LS_LOGS, JSON.stringify(logs));
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    if (this.isTurso && this.client) {
      try {
        const result = await this.client.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 200");
        return result.rows.map(row => ({
          id: row.id as string,
          action: row.action as string,
          details: row.details as string,
          type: row.type as LogType,
          userId: row.user_id as string,
          timestamp: row.timestamp as number
        }));
      } catch (e) {
        console.error(e);
        return [];
      }
    } else {
      return JSON.parse(localStorage.getItem(LS_LOGS) || '[]');
    }
  }

  async clearLogs() {
    if (this.isTurso && this.client) {
      await this.client.execute("DELETE FROM logs");
    } else {
      localStorage.removeItem(LS_LOGS);
    }
  }

  async deleteLog(id: string) {
    if (this.isTurso && this.client) {
      await this.client.execute({
        sql: "DELETE FROM logs WHERE id = ?",
        args: [id]
      });
    } else {
      let logs = JSON.parse(localStorage.getItem(LS_LOGS) || '[]');
      logs = logs.filter((l: LogEntry) => l.id !== id);
      localStorage.setItem(LS_LOGS, JSON.stringify(logs));
    }
  }
}

export const dbService = new DbService();