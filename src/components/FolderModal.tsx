import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';

interface FolderModalProps {
  visible: boolean;
  theme: AppTheme;
  onCreateFolder: (name: string) => Promise<void>;
  onClose: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  visible,
  theme,
  onCreateFolder,
  onClose,
}) => {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!folderName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateFolder(folderName.trim());
      setFolderName('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
                styles.modalContent,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  New Folder
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Input */}
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceSubtle,
                  },
                ]}
                placeholder="Folder name (e.g. Travel, Journal)..."
                placeholderTextColor={theme.colors.textMuted}
                value={folderName}
                onChangeText={setFolderName}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: folderName.trim()
                        ? theme.colors.textPrimary
                        : theme.colors.surfaceSubtle,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!folderName.trim() || isSubmitting}
                >
                  <Text
                    style={[
                      styles.submitText,
                      {
                        color: folderName.trim()
                          ? theme.isDark
                            ? '#191919'
                            : '#FFFFFF'
                          : theme.colors.textMuted,
                      },
                    ]}
                  >
                    Create
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FolderModal;
