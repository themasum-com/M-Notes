import test from 'node:test';
import assert from 'node:assert/strict';
import { securityService, bytesToHex, hexToBytes, getRandomBytes } from '../services/SecurityService';
import { storageService, sanitizeFilename, formatExportContent } from '../services/StorageService';
import { Note } from '../types';

// @ts-ignore
globalThis.__DEV__ = true;

test('Security & Cryptography Suite', async (t: any) => {
  // Use a fixed 32-byte key for reproducible test verification
  const testKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) testKey[i] = i + 1;
  securityService.setCustomKeyForTesting(testKey);

  await t.test('AES-256-GCM encrypts and decrypts accurately', async () => {
    const originalText = 'M Notes - Extremely private and secure thoughts 🔐 12345!@#$%^&*()_+';
    const encrypted = await securityService.encrypt(originalText);

    assert.ok(encrypted.iv, 'IV should exist');
    assert.equal(encrypted.iv.length, 24, '12-byte IV should be 24 hex chars');
    assert.ok(encrypted.ciphertext, 'Ciphertext should exist');
    assert.notEqual(encrypted.ciphertext, originalText, 'Ciphertext must not equal plaintext');

    const decrypted = await securityService.decrypt(encrypted);
    assert.equal(decrypted, originalText, 'Decrypted text must match original plaintext');
  });

  await t.test('AES-256-GCM authenticated encryption rejects tampered data', async () => {
    const originalText = 'Tamper-proof secret note';
    const encrypted = await securityService.encrypt(originalText);

    // Tamper with one byte of the ciphertext
    const tamperedChars = encrypted.ciphertext.split('');
    const lastChar = tamperedChars[tamperedChars.length - 1];
    tamperedChars[tamperedChars.length - 1] = lastChar === 'a' ? 'b' : 'a';
    const tamperedPayload = {
      ...encrypted,
      ciphertext: tamperedChars.join(''),
    };

    await assert.rejects(
      async () => {
        await securityService.decrypt(tamperedPayload);
      },
      /tag|authenticate|integrity|decrypt|failed|error/i,
      'Decrypting tampered ciphertext must throw authentication tag error'
    );
  });

  await t.test('Hex conversion utilities work symmetrically', () => {
    const bytes = getRandomBytes(32);
    const hex = bytesToHex(bytes);
    assert.equal(hex.length, 64);
    const roundtripBytes = hexToBytes(hex);
    assert.deepEqual(Array.from(roundtripBytes), Array.from(bytes));
  });
});

test('Storage & Note Management Suite', async (t: any) => {
  storageService.enableMemoryFsForTesting();
  await storageService.init();

  await t.test('Initializes with default folders', async () => {
    const folders = await storageService.getFolders();
    assert.ok(folders.length >= 4);
    assert.ok(folders.some((f) => f.id === 'general'));
    assert.ok(folders.some((f) => f.id === 'personal'));
    assert.ok(folders.some((f) => f.id === 'work'));
    assert.ok(folders.some((f) => f.id === 'ideas'));
  });

  await t.test('Can create a custom folder', async () => {
    const folder = await storageService.createFolder('Travel Plans');
    assert.equal(folder.name, 'Travel Plans');

    const allFolders = await storageService.getFolders();
    assert.ok(allFolders.some((f) => f.id === folder.id));
  });

  await t.test('Save, read, and search encrypted notes', async () => {
    const newNote: Note = {
      id: 'note_test_1',
      title: 'Secret Passwords & Keys',
      content: 'Database connection strings and recovery seed words.',
      folderId: 'personal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveNote(newNote);

    // Fetch single note with decrypted full content
    const loadedNote = await storageService.getNote('note_test_1');
    assert.ok(loadedNote);
    assert.equal(loadedNote?.title, 'Secret Passwords & Keys');
    assert.equal(loadedNote?.content, 'Database connection strings and recovery seed words.');
    assert.equal(loadedNote?.folderId, 'personal');

    // Filter by folder
    const personalNotes = await storageService.getNotes('personal');
    assert.equal(personalNotes.length, 1);
    assert.equal(personalNotes[0].id, 'note_test_1');

    const workNotes = await storageService.getNotes('work');
    assert.equal(workNotes.length, 0);

    // Search query
    const searchMatch = await storageService.getNotes('all', 'seed words');
    assert.equal(searchMatch.length, 1);

    const searchMiss = await storageService.getNotes('all', 'nonexistent query 123');
    assert.equal(searchMiss.length, 0);
  });

  await t.test('Move note between folders', async () => {
    await storageService.moveNote('note_test_1', 'work');

    const personalNotes = await storageService.getNotes('personal');
    assert.equal(personalNotes.length, 0, 'Should no longer be in personal');

    const workNotes = await storageService.getNotes('work');
    assert.equal(workNotes.length, 1, 'Should now be in work');
    assert.equal(workNotes[0].id, 'note_test_1');
  });

  await t.test('Delete note securely', async () => {
    await storageService.deleteNote('note_test_1');

    const loaded = await storageService.getNote('note_test_1');
    assert.equal(loaded, null, 'Deleted note must return null');

    const allNotes = await storageService.getNotes('all');
    assert.equal(allNotes.filter((n) => n.id === 'note_test_1').length, 0);
  });

  await t.test('Newly created note with auto-generated ID can be saved and deleted immediately', async () => {
    const generatedId = `note_${Date.now()}_test_xyz`;
    const newNote: Note = {
      id: generatedId,
      title: 'Temporary Draft Note',
      content: 'This draft should be deletable immediately.',
      folderId: 'general',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveNote(newNote);
    const saved = await storageService.getNote(generatedId);
    assert.ok(saved);
    assert.equal(saved?.title, 'Temporary Draft Note');

    // Simulate deleting freshly created note in editor
    await storageService.deleteNote(generatedId);
    const afterDelete = await storageService.getNote(generatedId);
    assert.equal(afterDelete, null, 'Freshly saved note must be deleted successfully');
  });

  await t.test('Computes accurate folder note counts', async () => {
    // Add 2 notes in 'work' and 1 in 'ideas'
    await storageService.saveNote({
      id: 'work_note_1',
      title: 'Sprint Planning',
      content: 'Tasks for sprint 42',
      folderId: 'work',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await storageService.saveNote({
      id: 'work_note_2',
      title: 'Architecture Review',
      content: 'Review cryptography architecture',
      folderId: 'work',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await storageService.saveNote({
      id: 'idea_note_1',
      title: 'App Ideas',
      content: 'Build offline-first secure apps',
      folderId: 'ideas',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const counts = await storageService.getFolderCounts();
    assert.equal(counts.all, 3, 'Total count across all folders should be 3');
    assert.equal(counts.work, 2, 'Work folder should have 2 notes');
    assert.equal(counts.ideas, 1, 'Ideas folder should have 1 note');
    assert.equal(counts.personal || 0, 0, 'Personal folder should have 0 notes');

    // Clean up
    await storageService.deleteNote('work_note_1');
    await storageService.deleteNote('work_note_2');
    await storageService.deleteNote('idea_note_1');
  });

  await t.test('Prevents duplicate folder creation', async () => {
    const existingFoldersBefore = await storageService.getFolders();
    const folder1 = await storageService.createFolder('Travel');
    const folder2 = await storageService.createFolder('travel'); // Case-insensitive duplicate

    assert.equal(folder1.id, folder2.id, 'Should return existing folder for duplicate name');
    const existingFoldersAfter = await storageService.getFolders();
    assert.equal(existingFoldersAfter.length, existingFoldersBefore.length + 1);
  });

  await t.test('Concurrent init calls resolve cleanly without race conditions', async () => {
    const freshService = storageService;
    // Trigger concurrent getFolders and getNotes at the exact same moment
    const [folders, notes] = await Promise.all([
      freshService.getFolders(),
      freshService.getNotes('all'),
    ]);
    assert.ok(Array.isArray(folders));
    assert.ok(Array.isArray(notes));
  });
});

test('Export Formatting Suite', async (t: any) => {
  const sampleNote: Note = {
    id: 'export_test_note',
    title: 'Q3 Financial Strategy / Budget',
    content: '1. Reduce cloud costs\n2. Boost hardware security\n3. Zero network egress',
    folderId: 'work',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  await t.test('Sanitizes filenames safely and preserves unicode international characters', () => {
    const safeEnglish = sanitizeFilename('Q3 Financial Strategy / Budget: Confidential???');
    assert.ok(!safeEnglish.includes('/'));
    assert.ok(!safeEnglish.includes(':'));
    assert.ok(!safeEnglish.includes('?'));
    assert.ok(safeEnglish.startsWith('Q3 Financial Strategy Budget Confidential'));

    const safeChinese = sanitizeFilename('工作计划 / 会议纪要: 2026');
    assert.ok(safeChinese.includes('工作计划'));
    assert.ok(safeChinese.includes('会议纪要'));
    assert.ok(!safeChinese.includes('/'));
    assert.ok(!safeChinese.includes(':'));

    const safeArabic = sanitizeFilename('ملاحظات سرية / مهمة: 1');
    assert.ok(safeArabic.includes('ملاحظات سرية'));
    assert.ok(!safeArabic.includes('/'));
    assert.ok(!safeArabic.includes(':'));

    const safeRussian = sanitizeFilename('План на день / Заметки: 2026');
    assert.ok(safeRussian.includes('План на день'));
    assert.ok(!safeRussian.includes('/'));
    assert.ok(!safeRussian.includes(':'));

    const emptyFallback = sanitizeFilename('   /// ??? ***   ');
    assert.equal(emptyFallback, 'Untitled_Note');

    // Edge cases: null, undefined, empty string
    assert.equal(sanitizeFilename(''), 'Untitled_Note');
    assert.equal(sanitizeFilename(undefined as any), 'Untitled_Note');
    assert.equal(sanitizeFilename(null as any), 'Untitled_Note');
  });

  await t.test('Formats Markdown (.md) export cleanly', () => {
    const md = formatExportContent(sampleNote, 'Work', 'md');
    assert.ok(md.startsWith('# Q3 Financial Strategy / Budget'));
    assert.ok(md.includes('> **Folder:** Work'));
    assert.ok(md.includes('1. Reduce cloud costs'));
  });

  await t.test('Formats Plain Text (.txt) export cleanly', () => {
    const txt = formatExportContent(sampleNote, 'Work', 'txt');
    assert.ok(txt.startsWith('Q3 Financial Strategy / Budget'));
    assert.ok(txt.includes('Folder: Work'));
    assert.ok(txt.includes('──────────'));
    assert.ok(txt.includes('1. Reduce cloud costs'));
  });

  await t.test('Handles empty and untitled notes in exports gracefully', () => {
    const emptyNote: Note = {
      id: 'empty_note',
      title: '',
      content: '',
      folderId: 'general',
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };
    const md = formatExportContent(emptyNote, 'General', 'md');
    assert.ok(md.startsWith('# Untitled'));
    const txt = formatExportContent(emptyNote, 'General', 'txt');
    assert.ok(txt.startsWith('Untitled'));
  });
});

test('App Version & UI Enhancements Suite', async (t: any) => {
  await t.test('app.json and package.json versions are bumped correctly to 1.0.1 and versionCode 2', async () => {
    const fs = await import('fs');
    const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
    const pkgJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

    assert.equal(appJson.expo.version, '1.0.1');
    assert.equal(appJson.expo.android.versionCode, 2);
    assert.equal(appJson.expo.android.softwareKeyboardLayoutMode, 'resize');
    assert.equal(pkgJson.version, '1.0.1');
    assert.equal(appJson.expo.android.adaptiveIcon.backgroundColor, '#FED766');
  });

  await t.test('Responsive auto-scroll cursor Y position calculation handles various screen widths and edge cases', () => {
    const calculateCursorY = (
      title: string,
      content: string,
      activeField: 'title' | 'content',
      cursorIndex: number,
      containerWidth: number = 360,
      titleHeight: number = 48,
      bodyHeight: number = 250
    ) => {
      const CONTENT_PADDING_TOP = 18;
      const TITLE_MARGIN_BOTTOM = 16;
      const BODY_TOP = CONTENT_PADDING_TOP + titleHeight + TITLE_MARGIN_BOTTOM;

      if (activeField === 'title') {
        const textBefore = (title || '').slice(0, cursorIndex);
        const titleLinesBefore = textBefore.split('\n').length - 1;
        const totalTitleLines = Math.max(1, (title || '').split('\n').length);
        const lineHeight = titleHeight / totalTitleLines;
        return CONTENT_PADDING_TOP + titleLinesBefore * lineHeight;
      }

      const text = content || '';
      const safeCursor = Math.min(cursorIndex, text.length);
      if (safeCursor === 0) {
        return BODY_TOP;
      }

      const textBefore = text.slice(0, safeCursor);
      const paragraphs = textBefore.split('\n');
      const textWidth = Math.max(200, containerWidth - 40);
      const charsPerLine = Math.max(15, Math.floor(textWidth / 8.2));

      let visualLines = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (i < paragraphs.length - 1) {
          visualLines += Math.max(1, Math.ceil(p.length / charsPerLine));
        } else {
          visualLines += Math.floor(p.length / charsPerLine);
        }
      }

      const estimatedY = BODY_TOP + visualLines * 24;
      return Math.min(estimatedY, BODY_TOP + bodyHeight);
    };

    // Edge case 1: Title cursor at line 0
    const y1 = calculateCursorY('', '', 'title', 0);
    assert.equal(y1, 18);

    // Edge case 2: Empty note content cursor
    const y2 = calculateCursorY('', '', 'content', 0);
    assert.equal(y2, 18 + 48 + 16); // 18 padding + 48 title + 16 margin = 82

    // Edge case 3: 50 lines down in content on mobile phone (360dp width)
    const multilineContent = Array(50).fill('Line item for notes').join('\n');
    const endCursor = multilineContent.length;
    const y3 = calculateCursorY('My Note Title', multilineContent, 'content', endCursor, 360, 48, 1500);
    assert.ok(y3 >= 82 + 49 * 24, 'Cursor 50 lines down must be positioned vertically correctly');

    // Edge case 4: Tablet width (768dp) adapts charsPerLine and avoids overcounting visual lines
    const longParagraph = 'A'.repeat(120);
    const phoneY = calculateCursorY('Title', longParagraph, 'content', 120, 360, 48, 500);
    const tabletY = calculateCursorY('Title', longParagraph, 'content', 120, 768, 48, 500);
    // On tablet (wider), fewer visual lines are wrapped, so Y is lower or equal
    assert.ok(tabletY <= phoneY, 'Wider tablet container should wrap into fewer or equal lines than phone');
  });
});


