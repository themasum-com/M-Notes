import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  BackHandler,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note, Folder, ExportFormat } from '../types';
import { AppTheme } from '../constants/theme';
import { storageService } from '../services/StorageService';
import { MoveNoteModal } from '../components/MoveNoteModal';
import { ExportModal } from '../components/ExportModal';

interface EditorScreenProps {
  noteId: string | null;
  initialFolderId?: string;
  theme: AppTheme;
  onBack: () => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  noteId,
  initialFolderId = 'general',
  theme,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState(initialFolderId);
  const [createdAt, setCreatedAt] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [isPinned, setIsPinned] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [folders, setFolders] = useState<Folder[]>([]);

  // Modals
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  const currentNoteIdRef = useRef<string>(noteId || '');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const folderIdRef = useRef(folderId);
  const createdAtRef = useRef(createdAt);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { folderIdRef.current = folderId; }, [folderId]);
  useEffect(() => { createdAtRef.current = createdAt; }, [createdAt]);

  // Load existing note or initialize new
  useEffect(() => {
    let isMounted = true;
    const loadNote = async () => {
      try {
        const fetchedFolders = await storageService.getFolders();
        if (!isMounted) return;
        setFolders(fetchedFolders);

        if (noteId) {
          const loaded = await storageService.getNote(noteId);
          if (loaded && isMounted) {
            setTitle(loaded.title);
            setContent(loaded.content);
            setFolderId(loaded.folderId || 'general');
            setCreatedAt(loaded.createdAt);
            setUpdatedAt(loaded.updatedAt);
            setIsPinned(!!loaded.isPinned);
            currentNoteIdRef.current = loaded.id;
          }
        } else {
          const now = Date.now();
          setCreatedAt(now);
          setUpdatedAt(now);
          if (!currentNoteIdRef.current) {
            currentNoteIdRef.current = `note_${now}_${Math.random().toString(36).substring(2, 7)}`;
          }
        }
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadNote();
    return () => {
      isMounted = false;
    };
  }, [noteId]);

  // Save function
  const performSave = useCallback(
    async (currentTitle: string, currentContent: string, currentFolder: string) => {
      // Don't save empty note if never edited
      if (!currentTitle.trim() && !currentContent.trim() && !noteId && !isDirtyRef.current) {
        return;
      }

      setSaveStatus('saving');
      const now = Date.now();
      const initialCreated = createdAtRef.current || now;
      if (!createdAtRef.current) {
        setCreatedAt(initialCreated);
        createdAtRef.current = initialCreated;
      }

      const noteToSave: Note = {
        id: currentNoteIdRef.current,
        title: currentTitle,
        content: currentContent,
        folderId: currentFolder,
        createdAt: initialCreated,
        updatedAt: now,
        isPinned,
      };

      try {
        await storageService.saveNote(noteToSave);
        setUpdatedAt(now);
        setSaveStatus('saved');
        isDirtyRef.current = false;
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    },
    [isPinned, noteId]
  );

  // Trigger auto-save debounce on changes
  const triggerAutoSave = (newTitle: string, newContent: string) => {
    isDirtyRef.current = true;
    setSaveStatus('saving');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(newTitle, newContent, folderIdRef.current);
    }, 700);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave(newTitle, content);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave(title, newContent);
  };

  const handleBackPress = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    if (isDirtyRef.current) {
      await performSave(titleRef.current, contentRef.current, folderIdRef.current);
    }
    onBack();
  }, [onBack, performSave]);

  // Android hardware back handler: navigate back cleanly without exiting app
  useEffect(() => {
    const onHardwareBack = () => {
      handleBackPress();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [handleBackPress]);

  // Flush pending save immediately when app is minimized or backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && isDirtyRef.current) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        performSave(titleRef.current, contentRef.current, folderIdRef.current);
      }
    });
    return () => subscription.remove();
  }, [performSave]);

  const handleMoveFolder = async (targetFolderId: string) => {
    setFolderId(targetFolderId);
    folderIdRef.current = targetFolderId;
    setIsMoveModalVisible(false);
    await performSave(titleRef.current, contentRef.current, targetFolderId);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to permanently delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (autoSaveTimerRef.current) {
              clearTimeout(autoSaveTimerRef.current);
            }
            isDirtyRef.current = false;
            const targetId = currentNoteIdRef.current || noteId;
            if (targetId) {
              await storageService.deleteNote(targetId);
            }
            onBack();
          },
        },
      ]
    );
  };

  const handleExport = async (format: ExportFormat) => {
    // Ensure latest content is saved first
    const currentNote: Note = {
      id: currentNoteIdRef.current,
      title,
      content,
      folderId,
      createdAt,
      updatedAt: Date.now(),
      isPinned,
    };
    await storageService.saveNote(currentNote);
    await storageService.exportNote(currentNote, format);
  };

  const currentFolder = folders.find((f) => f.id === folderId) || { name: 'General' };

  // Calculate statistics
  const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
  const charCount = content.length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.navBar, { borderBottomColor: theme.colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          <Text style={[styles.backText, { color: theme.colors.textPrimary }]}>Notes</Text>
        </TouchableOpacity>

        {/* Center: Folder Chip */}
        <TouchableOpacity
          style={[styles.folderChip, { backgroundColor: theme.colors.surfaceSubtle }]}
          onPress={() => setIsMoveModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="folder-outline"
            size={13}
            color={theme.colors.brandOrange}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[styles.folderChipText, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {currentFolder.name}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={theme.colors.textMuted}
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>

        {/* Right Actions: Save Status, Export, Delete */}
        <View style={styles.rightActions}>
          <View style={styles.statusIndicator}>
            {saveStatus === 'saving' ? (
              <ActivityIndicator size="small" color={theme.colors.textMuted} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
            )}
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsExportModalVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleDeletePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Editor Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Note Title Input */}
          <TextInput
            style={[styles.titleInput, { color: theme.colors.textPrimary }]}
            placeholder="Untitled"
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={handleTitleChange}
            multiline
            scrollEnabled={false}
          />

          {/* Note Body Content Input */}
          <TextInput
            style={[styles.bodyInput, { color: theme.colors.textPrimary }]}
            placeholder="Type something, or write down your thoughts..."
            placeholderTextColor={theme.colors.textMuted}
            value={content}
            onChangeText={handleContentChange}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Footer Stats Bar */}
        <View style={[styles.footerBar, { borderTopColor: theme.colors.borderSubtle }]}>
          <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} chars
          </Text>
          <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
            {updatedAt
              ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'New Note'}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Move Note Modal */}
      <MoveNoteModal
        visible={isMoveModalVisible}
        folders={folders}
        currentFolderId={folderId}
        theme={theme}
        onSelectFolder={handleMoveFolder}
        onClose={() => setIsMoveModalVisible(false)}
      />

      {/* Export Modal */}
      <ExportModal
        visible={isExportModalVisible}
        noteTitle={title || 'Untitled'}
        theme={theme}
        onExport={handleExport}
        onClose={() => setIsExportModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 2,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    maxWidth: 140,
  },
  folderChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 60,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 16,
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 250,
    paddingVertical: 4,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statText: {
    fontSize: 11,
    fontWeight: '400',
  },
});

export default EditorScreen;
