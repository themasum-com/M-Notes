import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Note, NoteMetadata, Folder, ExportFormat, EncryptedPayload } from '../types';
import { securityService } from './SecurityService';

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: 'All Notes', icon: 'apps-outline', createdAt: 0, isDefault: true },
  { id: 'general', name: 'General', icon: 'folder-outline', createdAt: 1, isDefault: true },
  { id: 'personal', name: 'Personal', icon: 'person-outline', createdAt: 2 },
  { id: 'work', name: 'Work', icon: 'briefcase-outline', createdAt: 3 },
  { id: 'ideas', name: 'Ideas', icon: 'bulb-outline', createdAt: 4 },
];

export function sanitizeFilename(name: string = ''): string {
  // Strip characters illegal in filesystem paths on Android/Linux/Windows, preserving international unicode characters
  const sanitized = (name || '').replace(/[\\/:*?"<>|\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
  const truncated = sanitized.substring(0, 60).trim();
  return truncated.length > 0 ? truncated : 'Untitled_Note';
}

export function formatExportContent(note: Note, folderName: string, format: ExportFormat): string {
  const dateStr = new Date(note.updatedAt).toLocaleString();
  if (format === 'md') {
    return `# ${note.title || 'Untitled'}\n\n> **Folder:** ${folderName} | **Updated:** ${dateStr}\n\n${note.content}\n`;
  } else {
    const divider = '─'.repeat(40);
    return `${note.title || 'Untitled'}\nFolder: ${folderName}\nUpdated: ${dateStr}\n${divider}\n\n${note.content}\n`;
  }
}

class StorageService {
  private baseDir: string = '';
  private notesDir: string = '';
  private indexPath: string = '';
  private foldersPath: string = '';
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  // In-memory fallback for testing environments without native expo-file-system
  private memoryFiles: Map<string, string> = new Map();
  private useMemoryFs: boolean = false;

  public enableMemoryFsForTesting(): void {
    this.useMemoryFs = true;
    this.memoryFiles.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }

  private async readFile(path: string): Promise<string | null> {
    if (this.useMemoryFs) {
      return this.memoryFiles.get(path) ?? null;
    }
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
    } catch {
      return null;
    }
  }

  private async writeFile(path: string, content: string): Promise<void> {
    if (this.useMemoryFs) {
      this.memoryFiles.set(path, content);
      return;
    }
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
  }

  private async deleteFile(path: string): Promise<void> {
    if (this.useMemoryFs) {
      this.memoryFiles.delete(path);
      return;
    }
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
    } catch {
      // Ignore deletion errors if file already gone
    }
  }

  /**
   * Initializes the secure sandboxed storage directories and default folders.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (!this.useMemoryFs) {
          const docDir = FileSystem.documentDirectory || '';
          this.baseDir = `${docDir}m_notes_secure/`;
          this.notesDir = `${this.baseDir}notes/`;
          this.indexPath = `${this.baseDir}index.enc.json`;
          this.foldersPath = `${this.baseDir}folders.enc.json`;

          try {
            const baseDirInfo = await FileSystem.getInfoAsync(this.baseDir);
            if (!baseDirInfo.exists) {
              await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
            }

            const notesDirInfo = await FileSystem.getInfoAsync(this.notesDir);
            if (!notesDirInfo.exists) {
              await FileSystem.makeDirectoryAsync(this.notesDir, { intermediates: true });
            }
          } catch (err) {
            console.warn('FileSystem init error (falling back to memory):', err);
            this.useMemoryFs = true;
          }
        } else {
          this.baseDir = 'm_notes_secure/';
          this.notesDir = 'm_notes_secure/notes/';
          this.indexPath = 'm_notes_secure/index.enc.json';
          this.foldersPath = 'm_notes_secure/folders.enc.json';
        }

        // Ensure default folders exist on disk
        const rawFolders = await this.readFile(this.foldersPath);
        if (!rawFolders) {
          await this.saveFolders(DEFAULT_FOLDERS);
        }

        this.isInitialized = true;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  // -------------------------------------------------------------
  // FOLDERS MANAGEMENT
  // -------------------------------------------------------------

  public async getFolders(): Promise<Folder[]> {
    await this.init();
    try {
      const encryptedData = await this.readFile(this.foldersPath);
      if (!encryptedData) {
        return DEFAULT_FOLDERS;
      }
      const payload: EncryptedPayload = JSON.parse(encryptedData);
      const decrypted = await securityService.decrypt(payload);
      const parsed: Folder[] = JSON.parse(decrypted);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  }

  public async saveFolders(folders: Folder[]): Promise<void> {
    const json = JSON.stringify(folders);
    const encrypted = await securityService.encrypt(json);
    await this.writeFile(this.foldersPath, JSON.stringify(encrypted));
  }

  public async createFolder(name: string, icon: string = 'folder-outline'): Promise<Folder> {
    await this.init();
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error('Folder name cannot be empty');
    }

    const folders = await this.getFolders();
    const existing = folders.find((f) => f.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      return existing;
    }

    const newFolder: Folder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      icon,
      createdAt: Date.now(),
    };
    folders.push(newFolder);
    await this.saveFolders(folders);
    return newFolder;
  }

  /**
   * Computes accurate note counts per folder and total across all notes.
   */
  public async getFolderCounts(): Promise<Record<string, number>> {
    await this.init();
    const allNotes = await this.getNoteMetadataList();
    const counts: Record<string, number> = { all: allNotes.length };
    for (const note of allNotes) {
      const fId = note.folderId || 'general';
      counts[fId] = (counts[fId] || 0) + 1;
    }
    return counts;
  }

  public async deleteFolder(folderId: string): Promise<void> {
    await this.init();
    if (folderId === 'all' || folderId === 'general') return;

    let folders = await this.getFolders();
    folders = folders.filter((f) => f.id !== folderId);
    await this.saveFolders(folders);

    // Reassign any notes in the deleted folder to 'general'
    const notes = await this.getNoteMetadataList();
    let updated = false;
    for (const meta of notes) {
      if (meta.folderId === folderId) {
        meta.folderId = 'general';
        updated = true;
        // Also update the note file itself
        const note = await this.getNote(meta.id);
        if (note) {
          note.folderId = 'general';
          await this.saveRawNoteFile(note);
        }
      }
    }
    if (updated) {
      await this.saveNoteMetadataList(notes);
    }
  }

  // -------------------------------------------------------------
  // NOTES MANAGEMENT
  // -------------------------------------------------------------

  private async getNoteMetadataList(): Promise<NoteMetadata[]> {
    try {
      const encryptedData = await this.readFile(this.indexPath);
      if (!encryptedData) return [];
      const payload: EncryptedPayload = JSON.parse(encryptedData);
      const decrypted = await securityService.decrypt(payload);
      return JSON.parse(decrypted);
    } catch {
      return [];
    }
  }

  private async saveNoteMetadataList(list: NoteMetadata[]): Promise<void> {
    const json = JSON.stringify(list);
    const encrypted = await securityService.encrypt(json);
    await this.writeFile(this.indexPath, JSON.stringify(encrypted));
  }

  private getNoteFilePath(id: string): string {
    return `${this.notesDir}${id}.enc.json`;
  }

  private async saveRawNoteFile(note: Note): Promise<void> {
    const noteJson = JSON.stringify(note);
    const encrypted = await securityService.encrypt(noteJson);
    await this.writeFile(this.getNoteFilePath(note.id), JSON.stringify(encrypted));
  }

  /**
   * Fetch notes with optional folder filtering and search query.
   */
  public async getNotes(folderId?: string, query?: string): Promise<NoteMetadata[]> {
    await this.init();
    let notes = await this.getNoteMetadataList();

    if (folderId && folderId !== 'all') {
      notes = notes.filter((n) => n.folderId === folderId);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      notes = notes.filter(
        (n) => n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then newest updated first
    notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

    return notes;
  }

  /**
   * Load and decrypt a specific note with full content.
   */
  public async getNote(id: string): Promise<Note | null> {
    await this.init();
    try {
      const filePath = this.getNoteFilePath(id);
      const fileData = await this.readFile(filePath);
      if (!fileData) return null;

      const payload: EncryptedPayload = JSON.parse(fileData);
      const decrypted = await securityService.decrypt(payload);
      return JSON.parse(decrypted) as Note;
    } catch {
      return null;
    }
  }

  /**
   * Encrypts and saves a note, updating both individual file and metadata index.
   */
  public async saveNote(note: Note): Promise<void> {
    await this.init();

    // 1. Encrypt and save note file
    await this.saveRawNoteFile(note);

    // 2. Update index
    const preview = note.content
      .replace(/[#*`_~>[\]()\-+!=]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 140);

    const metadata: NoteMetadata = {
      id: note.id,
      title: note.title.trim() || 'Untitled Note',
      preview,
      folderId: note.folderId || 'general',
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      isPinned: !!note.isPinned,
    };

    const list = await this.getNoteMetadataList();
    const index = list.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      list[index] = metadata;
    } else {
      list.unshift(metadata);
    }

    await this.saveNoteMetadataList(list);
  }

  /**
   * Moves a note to a different folder.
   */
  public async moveNote(noteId: string, targetFolderId: string): Promise<void> {
    await this.init();
    const note = await this.getNote(noteId);
    if (!note) return;

    note.folderId = targetFolderId;
    note.updatedAt = Date.now();
    await this.saveNote(note);
  }

  /**
   * Securely deletes a note file and removes it from the metadata index.
   */
  public async deleteNote(id: string): Promise<void> {
    await this.init();

    // 1. Delete physical encrypted file
    await this.deleteFile(this.getNoteFilePath(id));

    // 2. Remove from index
    let list = await this.getNoteMetadataList();
    list = list.filter((n) => n.id !== id);
    await this.saveNoteMetadataList(list);
  }

  /**
   * Exports a note to .txt or .md using native sharing sheet.
   */
  public async exportNote(note: Note, format: ExportFormat): Promise<boolean> {
    await this.init();

    const folders = await this.getFolders();
    const folder = folders.find((f) => f.id === note.folderId);
    const folderName = folder ? folder.name : 'General';

    const content = formatExportContent(note, folderName, format);
    const filename = `${sanitizeFilename(note.title)}.${format}`;

    if (this.useMemoryFs) {
      return true; // For unit tests
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Native file sharing is not available on this device');
      }

      const tempUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(tempUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(tempUri, {
        mimeType: format === 'md' ? 'text/markdown' : 'text/plain',
        dialogTitle: `Export M Note (${format.toUpperCase()})`,
        UTI: format === 'md' ? 'net.daringfireball.markdown' : 'public.plain-text',
      });

      // Attempt to clean up temp export file after sharing dialog
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
        } catch {
          // ignore cleanup error
        }
      }, 5000);

      return true;
    } catch (err: any) {
      console.error('Export note error:', err);
      throw err;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
