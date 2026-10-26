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
import { NoteMetadata } from '../types';
import { AppTheme } from '../constants/theme';

interface NoteActionSheetProps {
  visible: boolean;
  note: NoteMetadata | null;
  theme: AppTheme;
  onOpen: () => void;
  onMove: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const NoteActionSheet: React.FC<NoteActionSheetProps> = ({
  visible,
  note,
  theme,
  onOpen,
  onMove,
  onExport,
  onDelete,
  onClose,
}) => {
  if (!note) return null;

  const confirmDelete = () => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title || 'Untitled'}"? This cannot be undone.`,
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
              {/* Note Title preview */}
              <View style={styles.header}>
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {note.title || 'Untitled Note'}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

              {/* Actions List */}
              <View style={styles.actionsList}>
                {/* Open */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onOpen();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={20} color={theme.colors.textPrimary} style={styles.actionIcon} />
                  <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                    Open & Edit
                  </Text>
                </TouchableOpacity>

                {/* Move */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onMove();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="folder-outline" size={20} color={theme.colors.textPrimary} style={styles.actionIcon} />
                  <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                    Move to Folder...
                  </Text>
                </TouchableOpacity>

                {/* Export */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onExport();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={20} color={theme.colors.textPrimary} style={styles.actionIcon} />
                  <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                    Export (.txt / .md)...
                  </Text>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

                {/* Delete */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={confirmDelete}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} style={styles.actionIcon} />
                  <Text style={[styles.actionLabel, { color: theme.colors.danger, fontWeight: '600' }]}>
                    Delete Note
                  </Text>
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '85%',
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
    paddingVertical: 14,
  },
  actionIcon: {
    marginRight: 14,
    width: 24,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default NoteActionSheet;
