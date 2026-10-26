import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../types';
import { AppTheme } from '../constants/theme';

interface FolderPillsProps {
  folders: Folder[];
  activeFolderId: string;
  counts: Record<string, number>;
  theme: AppTheme;
  onSelectFolder: (folderId: string) => void;
  onAddFolder: () => void;
  onDeleteFolder?: (folder: Folder) => void;
}

export const FolderPills: React.FC<FolderPillsProps> = ({
  folders,
  activeFolderId,
  counts,
  theme,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {folders.map((folder) => {
          const isActive = folder.id === activeFolderId;
          const count = counts[folder.id] ?? 0;

          return (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? theme.colors.pillActiveBg
                    : theme.colors.pillInactiveBg,
                },
              ]}
              onPress={() => onSelectFolder(folder.id)}
              onLongPress={() => {
                if (!folder.isDefault && onDeleteFolder) {
                  onDeleteFolder(folder);
                }
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isActive
                      ? theme.colors.pillActiveText
                      : theme.colors.pillInactiveText,
                    fontWeight: isActive ? '600' : '500',
                  },
                ]}
              >
                {folder.name}
              </Text>
              {count > 0 ? (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isActive
                        ? theme.isDark
                          ? '#333333'
                          : '#454545'
                        : theme.isDark
                        ? '#3A3A3A'
                        : '#E4E4DF',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      {
                        color: isActive
                          ? '#FFFFFF'
                          : theme.colors.pillInactiveText,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}

        {/* New Folder Button */}
        <TouchableOpacity
          style={[
            styles.addPill,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
          onPress={onAddFolder}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.addPillText, { color: theme.colors.textSecondary }]}>
            Folder
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 4,
  },
  addPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default FolderPills;
