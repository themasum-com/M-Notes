import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NoteMetadata, Folder } from '../types';
import { AppTheme } from '../constants/theme';

interface NoteCardProps {
  note: NoteMetadata;
  folder?: Folder;
  theme: AppTheme;
  onPress: () => void;
  onMenuPress: () => void;
}

export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;

  if (diff < oneMinute) {
    return 'Just now';
  } else if (diff < oneHour) {
    const mins = Math.floor(diff / oneMinute);
    return `${mins}m ago`;
  } else if (diff < oneDay) {
    const hours = Math.floor(diff / oneHour);
    return `${hours}h ago`;
  } else if (diff < 7 * oneDay) {
    const days = Math.floor(diff / oneDay);
    return `${days}d ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folder,
  theme,
  onPress,
  onMenuPress,
}) => {
  const folderName = folder ? folder.name : 'General';
  const formattedDate = formatRelativeDate(note.updatedAt);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      onLongPress={onMenuPress}
      activeOpacity={0.7}
    >
      {/* Header row: Title + Menu */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {note.title || 'Untitled'}
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Preview content snippet */}
      {note.preview ? (
        <Text
          style={[styles.preview, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {note.preview}
        </Text>
      ) : null}

      {/* Footer: Folder badge + Date */}
      <View style={styles.footerRow}>
        <View
          style={[
            styles.folderBadge,
            { backgroundColor: theme.colors.surfaceSubtle },
          ]}
        >
          <Ionicons
            name="folder-outline"
            size={11}
            color={theme.colors.brandOrange}
            style={styles.folderIcon}
          />
          <Text
            style={[styles.folderText, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {folderName}
          </Text>
        </View>

        <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
          {formattedDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 8,
  },
  menuButton: {
    padding: 2,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    maxWidth: '60%',
  },
  folderIcon: {
    marginRight: 4,
  },
  folderText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '400',
  },
});

export default NoteCard;
