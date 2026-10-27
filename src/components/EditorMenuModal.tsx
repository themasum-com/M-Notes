import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';

interface EditorMenuModalProps {
  visible: boolean;
  theme: AppTheme;
  noteTitle?: string;
  currentFolderName?: string;
  onMoveToFolder: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const EditorMenuModal: React.FC<EditorMenuModalProps> = ({
  visible,
  theme,
  noteTitle,
  currentFolderName,
  onMoveToFolder,
  onExport,
  onDelete,
  onClose,
}) => {
  const confirmDelete = () => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to permanently delete "${noteTitle || 'Untitled Note'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete();
          },
        },
      ]
    );
  };

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
                styles.sheet,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Text
                    style={[styles.title, { color: theme.colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {noteTitle || 'Untitled Note'}
                  </Text>
                  {currentFolderName ? (
                    <Text
                      style={[styles.subtitle, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      Folder: {currentFolderName}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close menu"
                >
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

              {/* Actions List */}
              <View style={styles.actionsList}>
                {/* Move to Folder */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onMoveToFolder();
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Move note to folder"
                >
                  <Ionicons
                    name="folder-outline"
                    size={20}
                    color={theme.colors.textPrimary}
                    style={styles.actionIcon}
                  />
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                      Move to Folder
                    </Text>
                    {currentFolderName ? (
                      <Text style={[styles.actionSubtext, { color: theme.colors.textMuted }]}>
                        Currently in {currentFolderName}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {/* Export (.txt or .md) */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onExport();
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Export note"
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={theme.colors.textPrimary}
                    style={styles.actionIcon}
                  />
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                      Export (.txt or .md)
                    </Text>
                    <Text style={[styles.actionSubtext, { color: theme.colors.textMuted }]}>
                      Save or share plain text or markdown
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

                {/* Delete Note */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={confirmDelete}
                  activeOpacity={0.7}
                  accessibilityLabel="Delete note"
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.colors.danger}
                    style={styles.actionIcon}
                  />
                  <View style={styles.actionTextWrap}>
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: theme.colors.danger, fontWeight: '600' },
                      ]}
                    >
                      Delete Note
                    </Text>
                    <Text style={[styles.actionSubtext, { color: theme.colors.danger }]}>
                      Permanently remove this note
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  headerTitleWrap: {
    maxWidth: '85%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  actionsList: {
    paddingTop: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    marginRight: 14,
    width: 24,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default EditorMenuModal;
