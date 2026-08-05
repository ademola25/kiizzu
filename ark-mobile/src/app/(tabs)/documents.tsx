import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

import {
  MAX_UPLOAD_MB,
  fetchDownloadUrl,
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
  type PickedFile,
} from '@/api/documents';
import { DocumentRow } from '@/components/documents/DocumentRow';
import { UploadSheet } from '@/components/documents/UploadSheet';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StateCard } from '@/components/ui/StateCard';
import { errorMessage } from '@/lib/errors';
import type { DocumentType } from '@/lib/types';

/** Clearance under the sticky FAB so the last list row isn't covered. */
const FAB_BOTTOM_CLEARANCE = 100;

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const documents = useDocuments();
  const upload = useUploadDocument();
  const remove = useDeleteDocument();

  const [sheetOpen, setSheetOpen] = useState(false);
  // Covers the window: sheet closes → OS picker opens → mutate starts.
  // `upload.isPending` only flips after the mutation starts, so without
  // this we'd allow a second picker to launch on top of the first.
  const [picking, setPicking] = useState(false);

  const handlePick = async (documentType: DocumentType) => {
    setSheetOpen(false);
    if (picking || upload.isPending) return;
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      const file: PickedFile = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? '',
        size: asset.size ?? 0,
      };

      upload.mutate(
        { file, documentType },
        {
          onError: (err: unknown) => {
            Alert.alert('Upload failed', errorMessage(err, "Couldn't upload that file."));
          },
        },
      );
    } finally {
      setPicking(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      const url = await fetchDownloadUrl(id);
      // Presigned URLs are sensitive — keep them out of the Android browser's
      // "recents" surface.
      await WebBrowser.openBrowserAsync(url, { showInRecents: false });
    } catch (err) {
      Alert.alert("Can't open document", errorMessage(err, 'Please try again.'));
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete document?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onError: (err: unknown) => {
              Alert.alert('Delete failed', errorMessage(err, 'Please try again.'));
            },
          }),
      },
    ]);
  };

  const list = documents.data ?? [];
  const uploadBusy = picking || upload.isPending;

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + FAB_BOTTOM_CLEARANCE,
          gap: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={documents.isRefetching}
            onRefresh={() => documents.refetch()}
          />
        }
      >
        <ScreenHeader
          title="Documents"
          subtitle={`Lease, EJARI, anything you want kept safe. Max ${MAX_UPLOAD_MB} MB per file.`}
        />

        {documents.isLoading ? (
          <StateCard variant="loading" />
        ) : documents.isError ? (
          <StateCard
            variant="error"
            title="Couldn't load documents"
            message="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => documents.refetch()}
          />
        ) : list.length === 0 ? (
          <StateCard
            variant="empty"
            title="No documents yet"
            message="Upload your lease or EJARI to keep them in one place."
          />
        ) : (
          <View className="gap-2.5">
            {list.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky upload action — sits above the tab bar. */}
      <View
        className="absolute left-5 right-5"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <PillButton
          label={uploadBusy ? 'Uploading…' : '+ Upload document'}
          loading={uploadBusy}
          disabled={uploadBusy}
          onPress={() => setSheetOpen(true)}
        />
      </View>

      <UploadSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPick={handlePick}
      />
    </View>
  );
}
