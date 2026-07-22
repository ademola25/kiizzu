import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { Document, DocumentType } from '@/lib/types';
import { colors } from '@/theme/tokens';

type DocumentRowProps = {
  doc: Document;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
};

const TYPE_LABEL: Record<DocumentType, string> = {
  lease: 'Tenancy Contract',
  ejari: 'EJARI',
  other: 'Other',
};

const ICON_FOR_CONTENT: Record<string, keyof typeof Ionicons.glyphMap> = {
  'application/pdf': 'document-text',
  'image/jpeg': 'image',
  'image/png': 'image',
};

/** One uploaded document. Whole row opens it; trailing trash icon deletes. */
export function DocumentRow({ doc, onView, onDelete }: DocumentRowProps) {
  const icon = ICON_FOR_CONTENT[doc.content_type] ?? 'document';
  const typeLabel = TYPE_LABEL[doc.document_type] ?? 'Document';

  return (
    <Pressable
      onPress={() => onView(doc.id)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.filename}`}
    >
      <Card className="py-3 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-mist items-center justify-center">
          <Ionicons name={icon} size={18} color={colors.ink} />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {doc.filename}
          </Text>
          <Text className="text-xs text-muted mt-0.5">
            {typeLabel} · {formatBytes(doc.file_size)} · {formatDateTime(doc.uploaded_at)}
          </Text>
        </View>

        <Pressable
          onPress={() => onDelete(doc.id)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${doc.filename}`}
          className="w-9 h-9 items-center justify-center rounded-full"
        >
          <Ionicons name="trash-outline" size={18} color={colors.muted} />
        </Pressable>
      </Card>
    </Pressable>
  );
}
