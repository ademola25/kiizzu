import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { OptionCard } from '@/components/ui/OptionCard';
import type { DocumentType } from '@/lib/types';

type UploadSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (type: DocumentType) => void;
};

const OPTIONS: { value: DocumentType; label: string; description: string }[] = [
  { value: 'lease', label: 'Tenancy Contract', description: 'Your signed lease agreement.' },
  { value: 'ejari', label: 'Ejari Certificate', description: 'Your registered tenancy contract.' },
  { value: 'emirates_id', label: 'Emirates ID', description: 'Front and back of your Emirates ID.' },
  { value: 'passport', label: 'Passport', description: 'Your passport photo page.' },
  { value: 'license', label: "Driver's License", description: 'Your UAE driving licence.' },
  { value: 'other', label: 'Other', description: 'Anything else worth keeping.' },
];

/** Pick a document type — the OS file picker launches afterwards. */
export function UploadSheet({ visible, onClose, onPick }: UploadSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Upload a document"
      subtitle="Choose what kind of document you're adding."
    >
      <View className="gap-3">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            onPress={() => onPick(opt.value)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}
