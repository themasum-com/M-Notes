export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface NoteMetadata {
  id: string;
  title: string;
  preview: string;
  folderId: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  createdAt: number;
  isDefault?: boolean;
}

export interface EncryptedPayload {
  iv: string; // hex
  ciphertext: string; // hex (includes AES-GCM tag)
  version: number;
}

export type ExportFormat = 'txt' | 'md';
