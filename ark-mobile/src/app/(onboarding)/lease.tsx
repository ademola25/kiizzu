import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { OrganizingOverlay } from '@/components/onboarding/OrganizingOverlay';
import { useOnboarding } from '@/store/onboarding';
import { tentzu, tentzuFont } from '@/theme/tokens';

/**
 * Step 7/14 — "Let me read your lease for you."
 *
 * The file is held locally and uploaded after sign-in: every step before 14 is
 * unauthenticated, so there is no account to attach a document to yet.
 *
 * Phase 3 adds the "Tentzu is organizing your lease…" loader and turns the next
 * three screens into confirmations. Today it stores the file and moves on — the
 * copy promises only what we actually do.
 */
export default function LeaseStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const [error, setError] = useState<string | null>(null);
  const [organizing, setOrganizing] = useState(false);

  const pick = async () => {
    setError(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const file = res.assets[0];
      set('lease_document_uri', file.uri);
      set('lease_document_name', file.name ?? 'Lease document');
      set('lease_document_mime', file.mimeType ?? 'application/pdf');
      set('lease_document_size', file.size ?? 0);
    } catch {
      setError("I couldn't open your files. You can add the lease later from Documents.");
    }
  };

  const next = () => router.push('/(onboarding)/home');

  // Only pause when there is genuinely a file to process. Showing "organizing
  // your lease" after a skip would be theatre with nothing behind it.
  const continueWithFile = () => setOrganizing(true);
  const picked = !!draft.lease_document_uri;

  return (
    <TentzuScreen
      step={7}
      total={14}
      title="Let me read your lease for you."
      subtitle="Upload the PDF or a photo and I'll keep it safe with your other documents. Skip if you haven't got it to hand."
      primaryLabel={picked ? 'Continue' : 'Choose a file'}
      primaryIcon={picked ? 'arrow-forward' : 'document-attach-outline'}
      onPrimary={picked ? continueWithFile : pick}
      secondaryLabel={picked ? 'Choose a different file' : 'Skip for now'}
      onSecondary={picked ? pick : next}
      footerNote={
        error ? (
          <View style={{ backgroundColor: tentzu.dangerBg, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.danger }}>
              {error}
            </Text>
          </View>
        ) : null
      }
    >
      <OrganizingOverlay
        visible={organizing}
        onDone={() => {
          setOrganizing(false);
          next();
        }}
      />

      {picked ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: tentzu.primaryBright,
            backgroundColor: 'rgba(214,246,248,0.7)',
            paddingVertical: 16,
            paddingHorizontal: 16,
          }}
        >
          <Ionicons name="document-text" size={22} color={tentzu.primary} />
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: tentzuFont.label, fontSize: 15, color: tentzu.ink }}
            >
              {draft.lease_document_name}
            </Text>
            <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk }}>
              I'll store this once your account is saved.
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={tentzu.primary} />
        </View>
      ) : null}
    </TentzuScreen>
  );
}
