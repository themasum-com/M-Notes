import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../types';
import { AppTheme } from '../constants/theme';

interface MoveNoteModalProps {
  visible: boolean;
  folders: Folder[];
  currentFolderId: string;
  theme: AppTheme;
  onSelectFolder: (targetFolderId: string) => void;
  onClose: () => void;
}

export const MoveNoteModal: React.FC<MoveNoteModalProps> = ({
  visible,
  folders,
  currentFolderId,
  theme,
  onSelectFolder,
  onClose,
}) => {
  // Exclude 'all' folder from move targets
  const targetFolders = folders.filter((f) => f.id !== 'all');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                  Move Note to Folder
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Folders List */}
              <FlatList
                data={targetFolders}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => (
                  <View style={[styles.separator, { backgroundColor: theme.colors.borderSubtle }]} />
                )}
                renderItem={({ item }) => {
                  const isCurrent = item.id === currentFolderId;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.folderRow,
                        isCurrent && { backgroundColor: theme.colors.surfaceSubtle },
                      ]}
                      onPress={() => onSelectFolder(item.id)}
                      activeOpacity={0.65}
                    >
                      <View style={styles.folderRowLeft}>
                        <Ionicons
                          name="folder-outline"
                          size={18}
                          color={isCurrent ? theme.colors.brandOrange : theme.colors.textSecondary}
                          style={styles.folderIcon}
                        />
                        <Text
                          style={[
                            styles.folderName,
                            {
                              color: isCurrent
                                ? theme.colors.brandOrange
                                : theme.colors.textPrimary,
                              fontWeight: isCurrent ? '600' : '500',
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>
                      {isCurrent ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={theme.colors.brandOrange}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: 380,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  folderRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    marginRight: 12,
  },
  folderName: {
    fontSize: 14,
  },
});

export default MoveNoteModal;
