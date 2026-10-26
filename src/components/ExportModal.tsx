import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExportFormat } from '../types';
import { AppTheme } from '../constants/theme';

interface ExportModalProps {
  visible: boolean;
  noteTitle: string;
  theme: AppTheme;
  onExport: (format: ExportFormat) => Promise<void>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  noteTitle,
  theme,
  onExport,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      await onExport(selectedFormat);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to export note');
    } finally {
      setIsExporting(false);
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
                <View>
                  <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                    Export Note
                  </Text>
                  <Text
                    style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {`"${noteTitle || 'Untitled Note'}"`}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Format Options */}
              <View style={styles.optionsContainer}>
                {/* Markdown (.md) */}
                <TouchableOpacity
                  style={[
                    styles.formatCard,
                    {
                      borderColor:
                        selectedFormat === 'md'
                          ? theme.colors.brandOrange
                          : theme.colors.border,
                      backgroundColor:
                        selectedFormat === 'md'
                          ? theme.colors.brandOrangeLight
                          : theme.colors.surfaceSubtle,
                    },
                  ]}
                  onPress={() => setSelectedFormat('md')}
                  activeOpacity={0.7}
                >
                  <View style={styles.formatLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            selectedFormat === 'md'
                              ? theme.colors.brandOrange
                              : theme.colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="logo-markdown"
                        size={18}
                        color={selectedFormat === 'md' ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                    </View>
                    <View style={styles.formatInfo}>
                      <Text
                        style={[
                          styles.formatTitle,
                          {
                            color:
                              selectedFormat === 'md'
                                ? theme.colors.brandOrange
                                : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        Markdown (.md)
                      </Text>
                      <Text
                        style={[styles.formatDesc, { color: theme.colors.textSecondary }]}
                      >
                        Formatted with headers, quotes & lists
                      </Text>
                    </View>
                  </View>
                  {selectedFormat === 'md' ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.brandOrange}
                    />
                  ) : null}
                </TouchableOpacity>

                {/* Plain Text (.txt) */}
                <TouchableOpacity
                  style={[
                    styles.formatCard,
                    {
                      borderColor:
                        selectedFormat === 'txt'
                          ? theme.colors.brandOrange
                          : theme.colors.border,
                      backgroundColor:
                        selectedFormat === 'txt'
                          ? theme.colors.brandOrangeLight
                          : theme.colors.surfaceSubtle,
                    },
                  ]}
                  onPress={() => setSelectedFormat('txt')}
                  activeOpacity={0.7}
                >
                  <View style={styles.formatLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            selectedFormat === 'txt'
                              ? theme.colors.brandOrange
                              : theme.colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={selectedFormat === 'txt' ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                    </View>
                    <View style={styles.formatInfo}>
                      <Text
                        style={[
                          styles.formatTitle,
                          {
                            color:
                              selectedFormat === 'txt'
                                ? theme.colors.brandOrange
                                : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        Plain Text (.txt)
                      </Text>
                      <Text
                        style={[styles.formatDesc, { color: theme.colors.textSecondary }]}
                      >
                        Clean unformatted text for any app
                      </Text>
                    </View>
                  </View>
                  {selectedFormat === 'txt' ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.brandOrange}
                    />
                  ) : null}
                </TouchableOpacity>
              </View>

              {/* Error message if any */}
              {errorMsg ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                  {errorMsg}
                </Text>
              ) : null}

              {/* Export Button */}
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  { backgroundColor: theme.colors.textPrimary },
                ]}
                onPress={handleExport}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.isDark ? '#191919' : '#FFFFFF'}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={theme.isDark ? '#191919' : '#FFFFFF'}
                      style={styles.buttonIcon}
                    />
                    <Text
                      style={[
                        styles.buttonText,
                        { color: theme.isDark ? '#191919' : '#FFFFFF' },
                      ]}
                    >
                      Export & Share
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    maxWidth: 220,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  formatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  formatDesc: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExportModal;
