import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, IconButton, Screen, Text, Toast, radius, spacing } from '@/ui';

import { parseJoinUrl } from './join-code';

const IGNORE_REPEAT_MS = 2500;

function enterCodeInstead() {
  router.replace('/student/join/code');
}

/** P2: scan the teacher's QR code. Explains why before asking for the camera; denial has a way out. */
export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.camera} />;

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.close}>
          <IconButton icon="close" label="Close scanner" onPress={() => router.back()} />
        </View>
        <EmptyState
          icon="camera-outline"
          title={blocked ? 'Camera access is off' : 'Scan your class QR code'}
          message={
            blocked
              ? 'Turn on camera access for Joinly in Settings to scan, or enter the 6-digit code instead.'
              : 'Joinly uses the camera only to read the QR code your teacher shows. Nothing is recorded.'
          }
        >
          {blocked ? (
            <Button
              label="Open settings"
              icon="settings-outline"
              onPress={() => void Linking.openSettings()}
            />
          ) : (
            <Button
              testID="allow-camera"
              label="Allow camera"
              icon="camera"
              onPress={() => void requestPermission()}
            />
          )}
          <Button label="Enter code instead" variant="secondary" onPress={enterCodeInstead} />
        </EmptyState>
      </Screen>
    );
  }

  return <Scanner />;
}

function Scanner() {
  const focused = useIsFocused();
  const [torch, setTorch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const handled = useRef(false);
  const lastRejected = useRef<{ data: string; at: number } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return;
    const code = parseJoinUrl(data);
    if (!code) {
      // Not a Joinly invite: say so once per code, and keep scanning.
      const last = lastRejected.current;
      if (last?.data === data && Date.now() - last.at < IGNORE_REPEAT_MS) return;
      lastRejected.current = { data, at: Date.now() };
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setToast("This isn't a Joinly code");
      return;
    }
    handled.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/student/join/confirm', params: { code, via: 'qr' } });
  };

  return (
    <View style={styles.camera}>
      {focused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      ) : null}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <IconButton
            icon="close"
            label="Close scanner"
            color="#FFFFFF"
            onPress={() => router.back()}
          />
          <IconButton
            icon={torch ? 'flashlight' : 'flashlight-outline'}
            label={torch ? 'Turn torch off' : 'Turn torch on'}
            color="#FFFFFF"
            onPress={() => setTorch((on) => !on)}
          />
        </View>

        <View style={styles.center}>
          <View
            style={styles.frame}
            accessible
            accessibilityLabel="Point the camera at the QR code"
          />
          <Text variant="bodyStrong" align="center" style={styles.hint}>
            Point your camera at the QR code on your teacher&apos;s screen
          </Text>
          <Toast message={toast} onHide={hideToast} />
        </View>

        <View style={styles.bottom}>
          <Button
            label="Enter code instead"
            variant="secondary"
            icon="keypad-outline"
            onPress={enterCodeInstead}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  camera: { flex: 1, backgroundColor: '#000000' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  close: { alignItems: 'flex-start' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: spacing.xl },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: radius.xl,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  hint: { color: '#FFFFFF', maxWidth: 280 },
  bottom: { gap: spacing.md },
});
