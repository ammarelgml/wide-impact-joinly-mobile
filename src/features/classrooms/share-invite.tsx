import * as Sharing from 'expo-sharing';
import { useRef, useState, type ComponentRef } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { formatJoinCode } from '@/lib/format';
import { Sheet, SheetOption, Text, colors, font, qr, radius, space } from '@/ui';

const CARD_WIDTH = 360;
const CARD_QR = 264;

export function shareText(name: string, code: string, url: string): string {
  return `Join "${name}" on Joinly with code ${formatJoinCode(code)}, or open ${url}`;
}

/**
 * The invite's Share action: a sheet with "Share QR image" (a picture of the QR with the class name
 * and code, for WhatsApp and any app that takes images) and "Share code and link" (text). The image
 * is drawn from a card rendered off screen, so it looks the same in portrait and landscape.
 */
export function useShareInvite({ name, code, url }: { name: string; code: string; url: string }) {
  const card = useRef<ComponentRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const shareLink = () => {
    setOpen(false);
    void Share.share({ message: shareText(name, code, url) });
  };

  const shareImage = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
      setOpen(false);
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share the QR code for ${name}`,
      });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const ui = (
    <>
      <View
        style={styles.offscreen}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
      >
        <View ref={card} collapsable={false} style={styles.card}>
          <Text style={styles.brand}>Joinly</Text>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.plate}>
            <QRCode
              value={url}
              size={CARD_QR}
              ecl="M"
              color={qr.module}
              backgroundColor={qr.plate}
            />
          </View>
          <Text style={styles.code}>{formatJoinCode(code)}</Text>
          <Text style={styles.hint}>Scan with your phone camera, or enter the code in Joinly.</Text>
        </View>
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} testID="share-sheet">
        <SheetOption
          testID="share-image"
          icon="qr-code-outline"
          title="Share QR image"
          caption={
            failed
              ? "Couldn't make the image. Try again or share the link."
              : 'For WhatsApp and other apps'
          }
          busy={busy}
          onPress={() => void shareImage()}
        />
        <SheetOption
          testID="share-link"
          icon="link-outline"
          title="Share code and link"
          caption="As a text message"
          disabled={busy}
          onPress={shareLink}
        />
      </Sheet>
    </>
  );

  return {
    open: () => {
      setFailed(false);
      setOpen(true);
    },
    ui,
  };
}

const styles = StyleSheet.create({
  // Laid out and drawable, but off screen: view-shot draws the view itself, not the window.
  offscreen: { position: 'absolute', left: -10_000, top: 0 },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[6],
    paddingHorizontal: space[5],
    backgroundColor: colors.surface,
  },
  brand: { ...font(700, 16, 22), color: colors.primary },
  name: { ...font(700, 22, 28), color: colors.ink, textAlign: 'center' },
  plate: {
    padding: qr.quietZone,
    backgroundColor: qr.plate,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: qr.edge,
  },
  code: {
    ...font(700, 40, 48),
    color: colors.ink,
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  hint: { ...font(500, 14, 20), color: colors.ink2, textAlign: 'center' },
});
