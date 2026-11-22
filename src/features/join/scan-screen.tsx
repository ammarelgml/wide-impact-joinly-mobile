import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  Screen,
  Text,
  Toast,
  camera,
  font,
  motion,
  space,
} from '@/ui';

import { parseJoinUrl } from './join-code';

const IGNORE_REPEAT_MS = 2500;
const GUIDE = 248;

function enterCodeInstead() {
  router.replace('/student/join/code');
}

/** P2: scan the teacher's QR code. Explains why before the system prompt; denial has a way out. */
export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.camera} />;

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <Screen
        appBar={{ leading: 'close' }}
        surface
        center
        footer={
          blocked ? (
            <>
              <Button
                label="Open settings"
                icon="settings-outline"
                onPress={() => void Linking.openSettings()}
              />
              <Button
                label="Enter code instead"
                icon="keypad-outline"
                variant="secondary"
                onPress={enterCodeInstead}
              />
            </>
          ) : (
            <>
              <Button
                testID="allow-camera"
                label="Allow camera"
                onPress={() => void requestPermission()}
              />
              <Button label="Enter code instead" variant="text" onPress={enterCodeInstead} />
            </>
          )
        }
      >
        <EmptyState
          icon="camera-outline"
          tone={blocked ? 'neutral' : 'primary'}
          title={blocked ? 'Camera access is off' : 'Scan your class QR code'}
          message={
            blocked
              ? 'Turn it on in Settings to scan, or type the code instead.'
              : 'Joinly uses the camera only to read the code. Nothing is recorded or saved.'
          }
        />
      </Screen>
    );
  }

  return <Scanner />;
}

function Corner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const top = position[0] === 't';
  const left = position[1] === 'l';
  return (
    <View
      style={[
        styles.corner,
        { borderColor: color },
        top ? { top: 0, borderBottomWidth: 0 } : { bottom: 0, borderTopWidth: 0 },
        left ? { left: 0, borderRightWidth: 0 } : { right: 0, borderLeftWidth: 0 },
        top && left && { borderTopLeftRadius: 18 },
        top && !left && { borderTopRightRadius: 18 },
        !top && left && { borderBottomLeftRadius: 18 },
        !top && !left && { borderBottomRightRadius: 18 },
      ]}
    />
  );
}

function Scanner() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [torch, setTorch] = useState(false);
  const [found, setFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const handled = useRef(false);
  const lastRejected = useRef<{ data: string; at: number } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (found) AccessibilityInfo.announceForAccessibility('Code found');
  }, [found]);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return;
    const code = parseJoinUrl(data);
    if (!code) {
      // Not a Joinly invite: say so once per code, and keep scanning. No haptic on errors.
      const last = lastRejected.current;
      if (last?.data === data && Date.now() - last.at < IGNORE_REPEAT_MS) return;
      lastRejected.current = { data, at: Date.now() };
      setToast("That's not a Joinly code. Keep the class QR in the frame.");
      return;
    }
    handled.current = true;
    setToast(null);
    setFound(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(
      () => router.replace({ pathname: '/student/join/confirm', params: { code, via: 'qr' } }),
      motion.scanFoundToConfirm,
    );
  };

  const guideColor = found ? camera.found : camera.guide;

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

      <View style={[styles.topBar, { top: insets.top + space[2] }]}>
        <IconButton
          icon="close"
          label="Close scanner"
          color={camera.fg}
          style={styles.control}
          onPress={() => router.back()}
        />
        <IconButton
          icon={torch ? 'flashlight' : 'flashlight-outline'}
          label="Torch"
          selected={torch}
          color={torch ? camera.onControlOn : camera.fg}
          style={[styles.control, torch && styles.controlOn]}
          onPress={() => setTorch((on) => !on)}
        />
      </View>

      <View style={[styles.middle, { paddingTop: insets.top + 96 }]}>
        <Text
          style={styles.status}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          testID="scan-status"
        >
          {found ? 'Code found' : "Point your camera at the QR code on your teacher's screen"}
        </Text>
        <View
          style={styles.guide}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Corner position="tl" color={guideColor} />
          <Corner position="tr" color={guideColor} />
          <Corner position="bl" color={guideColor} />
          <Corner position="br" color={guideColor} />
          {found ? (
            <View style={styles.foundBadge}>
              <Icon name="checkmark" size={34} color={camera.onFound} />
            </View>
          ) : null}
        </View>
      </View>

      <Toast
        message={toast}
        onHide={hideToast}
        icon="alert-circle-outline"
        light
        bottom={Math.max(28, insets.bottom + space[3]) + 52 + 60}
      />

      <View style={[styles.bottom, { paddingBottom: Math.max(28, insets.bottom + space[3]) }]}>
        <Button
          label="Enter code instead"
          icon="keypad-outline"
          style={styles.control}
          onPress={enterCodeInstead}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1, backgroundColor: camera.bg },
  topBar: {
    position: 'absolute',
    start: space[2],
    end: space[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  control: { backgroundColor: camera.control, borderColor: 'transparent' },
  controlOn: { backgroundColor: camera.controlOn },
  middle: { ...StyleSheet.absoluteFill, alignItems: 'center', gap: 56 },
  status: {
    ...font(600, 17, 24),
    color: camera.fg,
    textAlign: 'center',
    paddingHorizontal: space[6],
  },
  guide: { width: GUIDE, height: GUIDE, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 44, height: 44, borderWidth: 4 },
  foundBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: camera.found,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { position: 'absolute', start: space[4], end: space[4], bottom: 0 },
});
