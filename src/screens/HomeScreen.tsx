import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NoteMetadata, Folder, ExportFormat } from '../types';
import { AppTheme } from '../constants/theme';
import { storageService } from '../services/StorageService';
import { BrandLogo } from '../components/BrandLogo';
import { FolderPills } from '../components/FolderPills';
import { NoteCard } from '../components/NoteCard';
import { MoveNoteModal } from '../components/MoveNoteModal';
import { ExportModal } from '../components/ExportModal';
import { FolderModal } from '../components/FolderModal';
import { NoteActionSheet } from '../components/NoteActionSheet';

interface HomeScreenProps {
  theme: AppTheme;
  onOpenNote: (noteId: string | null, initialFolderId?: string) => void;
  onLockApp: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  theme,
  onOpenNote,
  onLockApp,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal states
  const [actionNote, setActionNote] = useState<NoteMetadata | null>(null);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState<boolean>(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState<boolean>(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState<boolean>(false);
  const [isFolderModalVisible, setIsFolderModalVisible] = useState<boolean>(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [fetchedFolders, fetchedNotes, counts] = await Promise.all([
        storageService.getFolders(),
        storageService.getNotes(activeFolderId, searchQuery),
        storageService.getFolderCounts(),
      ]);
      setFolders(fetchedFolders);
      setNotes(fetchedNotes);
      setFolderCounts(counts);
    } catch {
      // Error loading notes
    }
  }, [activeFolderId, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [fetchedFolders, fetchedNotes, counts] = await Promise.all([
          storageService.getFolders(),
          storageService.getNotes(activeFolderId, searchQuery),
          storageService.getFolderCounts(),
        ]);
        if (isMounted) {
          setFolders(fetchedFolders);
          setNotes(fetchedNotes);
          setFolderCounts(counts);
        }
      } catch {
        // Handle silently
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeFolderId, searchQuery]);

  // BackHandler to dismiss search on Android
  useEffect(() => {
    const backAction = () => {
      if (isSearchVisible) {
        setIsSearchVisible(false);
        setSearchQuery('');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSearchVisible]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Folder lookup
  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  // Actions
  const handleOpenActionMenu = (note: NoteMetadata) => {
    setActionNote(note);
    setIsActionSheetVisible(true);
  };

  const handleOpenMoveModal = () => {
    setIsActionSheetVisible(false);
    setTimeout(() => {
      setIsMoveModalVisible(true);
    }, 150);
  };

  const handleOpenExportModal = () => {
    setIsActionSheetVisible(false);
    setTimeout(() => {
      setIsExportModalVisible(true);
    }, 150);
  };

  const handleMoveNote = async (targetFolderId: string) => {
    if (!actionNote) return;
    try {
      await storageService.moveNote(actionNote.id, targetFolderId);
      setIsMoveModalVisible(false);
      setActionNote(null);
      await loadData();
    } catch {
      Alert.alert('Error', 'Could not move note.');
    }
  };

  const handleExportNote = async (format: ExportFormat) => {
    if (!actionNote) return;
    const fullNote = await storageService.getNote(actionNote.id);
    if (!fullNote) {
      throw new Error('Note could not be loaded for export');
    }
    await storageService.exportNote(fullNote, format);
  };

  const handleDeleteNote = async () => {
    if (!actionNote) return;
    try {
      await storageService.deleteNote(actionNote.id);
      setIsActionSheetVisible(false);
      setActionNote(null);
      await loadData();
    } catch {
      Alert.alert('Error', 'Could not delete note.');
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await storageService.createFolder(name);
      await loadData();
      setActiveFolderId(newFolder.id);
    } catch {
      Alert.alert('Error', 'Failed to create folder.');
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      'Delete Folder',
      `Delete folder "${folder.name}"? Notes inside will be moved to General.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteFolder(folder.id);
            if (activeFolderId === folder.id) {
              setActiveFolderId('all');
            }
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Top App Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size="sm" />
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            M Notes
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Search Toggle */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
            onPress={() => {
              setIsSearchVisible(!isSearchVisible);
              if (isSearchVisible) {
                setSearchQuery('');
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSearchVisible ? 'close' : 'search-outline'}
              size={18}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Instant Lock Button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
            onPress={onLockApp}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.brandOrange} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Search Bar */}
      {isSearchVisible ? (
        <View style={[styles.searchBarWrapper, { backgroundColor: theme.colors.surfaceSubtle }]}>
          <Ionicons name="search" size={16} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search notes by title or content..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Folders Bar */}
      <FolderPills
        folders={folders}
        activeFolderId={activeFolderId}
        counts={folderCounts}
        theme={theme}
        onSelectFolder={(id) => setActiveFolderId(id)}
        onAddFolder={() => setIsFolderModalVisible(true)}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notes.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brandOrange}
          />
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            folder={folderMap.get(item.folderId)}
            theme={theme}
            onPress={() => onOpenNote(item.id)}
            onMenuPress={() => handleOpenActionMenu(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <View style={[styles.emptyAvatar, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <BrandLogo size="lg" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              {searchQuery ? 'No matching notes found' : 'No notes here yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {searchQuery
                ? 'Try a different keyword or clear search'
                : 'Write down your thoughts, plans, or secrets with complete privacy.'}
            </Text>
            {!searchQuery ? (
              <TouchableOpacity
                style={[styles.emptyCreateBtn, { backgroundColor: theme.colors.textPrimary }]}
                onPress={() => onOpenNote(null, activeFolderId === 'all' ? 'general' : activeFolderId)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={theme.isDark ? '#191919' : '#FFFFFF'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.emptyCreateText,
                    { color: theme.isDark ? '#191919' : '#FFFFFF' },
                  ]}
                >
                  Create First Note
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      {/* Floating Action Button (+ New Note) */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.brandOrange,
            shadowColor: theme.colors.brandOrange,
          },
        ]}
        onPress={() => onOpenNote(null, activeFolderId === 'all' ? 'general' : activeFolderId)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Action Sheet Modal */}
      <NoteActionSheet
        visible={isActionSheetVisible}
        note={actionNote}
        theme={theme}
        onOpen={() => {
          if (actionNote) onOpenNote(actionNote.id);
        }}
        onMove={handleOpenMoveModal}
        onExport={handleOpenExportModal}
        onDelete={handleDeleteNote}
        onClose={() => {
          setIsActionSheetVisible(false);
        }}
      />

      {/* Move Note Modal */}
      <MoveNoteModal
        visible={isMoveModalVisible}
        folders={folders}
        currentFolderId={actionNote?.folderId || 'general'}
        theme={theme}
        onSelectFolder={handleMoveNote}
        onClose={() => {
          setIsMoveModalVisible(false);
          setActionNote(null);
        }}
      />

      {/* Export Modal */}
      <ExportModal
        visible={isExportModalVisible}
        noteTitle={actionNote?.title || 'Untitled Note'}
        theme={theme}
        onExport={handleExportNote}
        onClose={() => {
          setIsExportModalVisible(false);
          setActionNote(null);
        }}
      />

      {/* Create Folder Modal */}
      <FolderModal
        visible={isFolderModalVisible}
        theme={theme}
        onCreateFolder={handleCreateFolder}
        onClose={() => setIsFolderModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 90,
  },
  emptyView: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyAvatar: {
    padding: 16,
    borderRadius: 28,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyCreateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default HomeScreen;
