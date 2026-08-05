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
  ejari: 'Ejari',
  emirates_id: 'Emirates ID',
  passport: 'Passport',
  license: "Driver's License",
  other: 'Other',
};

// A meaningful icon per document kind takes priority over the file-type icon.
const TYPE_ICON: Partial<Record<DocumentType, keyof typeof Ionicons.glyphMap>> = {
  lease: 'document-text',
  ejari: 'ribbon-outline',
  emirates_id: 'card',
  license: 'card',
  passport: 'person-circle-outline',
};

const ICON_FOR_CONTENT: Record<string, keyof typeof Ionicons.glyphMap> = {
  'application/pdf': 'document-text',
  'image/jpeg': 'image',
  'image/png': 'image',
};

/** One uploaded document. Whole row opens it; trailing trash icon deletes. */
export function DocumentRow({ doc, onView, onDelete }: DocumentRowProps) {
  const icon = TYPE_ICON[doc.document_type] ?? ICON_FOR_CONTENT[doc.content_type] ?? 'document';
  const typeLabel = TYPE_LABEL[doc.document_type] ?? 'Document';

  return (
    <Pressable
      onPress={() => onView(doc.id)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.filename}`}
    >
      <Card className="py-3 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-wash items-center justify-center">
          <Ionicons name={icon} size={18} color={colors.brand} />
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
