import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CnicCropModal } from '@/components/provider/CnicCropModal';
import { CnicImageField } from '@/components/provider/CnicImageField';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as cnicVerification from '@/services/cnicVerification.service';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import { useAuthStore } from '@/store/authStore';
import { useIdentityDraft } from '@/hooks/useIdentityDraft';

function formatCnicInput(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export default function ProviderVerificationScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const provider = useProviderStore((state) => state.provider);
  const transportation = provider?.services.includes('transport');
  const verified = provider?.identityVerification?.verificationStatus === 'verified' && provider.identityVerification.cnicVerified;
  const userId = useAuthStore((state) => state.user?.id);
  const identity = useIdentityDraft(userId);
  const { cnicNumber, fatherName, expiryDate, frontUri, backUri } = identity.draft;
  const setCnicNumber = (value: string) => identity.patch({ cnicNumber: value });
  const setFatherName = (value: string) => identity.patch({ fatherName: value });
  const setExpiryDate = (value: string) => identity.patch({ expiryDate: value });
  const setFrontUri = (value: string | null) => identity.patch({ frontUri: value ?? '' });
  const setBackUri = (value: string | null) => identity.patch({ backUri: value ?? '' });
  const [picking, setPicking] = useState<'front' | 'back' | null>(null);
  const [cropSide, setCropSide] = useState<'front' | 'back' | null>(null);
  const [cropSourceUri, setCropSourceUri] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<cnicVerification.CnicVerifyResult | null>(null);
  const [autoFillNote, setAutoFillNote] = useState<string | null>(null);
  const [fillTick, setFillTick] = useState(0);
  const [scannedFrontUri, setScannedFrontUri] = useState<string | null>(null);

  const applyExtractedFields = useCallback(
    (extracted: {
      cnicNumber?: string | null;
      fatherName?: string | null;
      expiryDate?: string | null;
    }) => {
      const filled: string[] = [];
      // Always reset — never keep previous OCR garbage when a field wasn't read this time
      setCnicNumber(extracted.cnicNumber ? formatCnicInput(String(extracted.cnicNumber)) : '');
      setFatherName(extracted.fatherName ? String(extracted.fatherName) : '');
      if (extracted.expiryDate) {
        const raw = String(extracted.expiryDate);
        const [y, m, d] = raw.split('-');
        if (y && m && d && y.length === 4) setExpiryDate(`${d}.${m}.${y}`);
        else setExpiryDate(raw);
      } else {
        setExpiryDate('');
      }

      if (extracted.cnicNumber) filled.push('CNIC number');
      if (extracted.fatherName) filled.push("Father's name");
      if (extracted.expiryDate) filled.push('Expiry date');

      if (filled.length) {
        setFillTick((n) => n + 1);
        const missing = 3 - filled.length;
        setAutoFillNote(
          missing
            ? `Auto-filled: ${filled.join(', ')}. Enter any missing fields from your CNIC, then confirm.`
            : `Auto-filled from your CNIC: ${filled.join(', ')}. Please confirm.`
        );
      }
      return filled.length;
    },
    []
  );

  const runExtract = useCallback(
    async (uri: string) => {
      setExtracting(true);
      setResult(null);
      setAutoFillNote(null);
      try {
        const extracted = await cnicVerification.extractCnicFromImage(uri);
        setScannedFrontUri(uri);
        const count = applyExtractedFields(extracted);
        if (!count) {
          Alert.alert(
            'Could not read CNIC',
            'Crop tighter around the card text, or enter the details manually below.'
          );
        }
      } catch (error) {
        Alert.alert('Image check', getApiErrorMessage(error));
      } finally {
        setExtracting(false);
      }
    },
    [applyExtractedFields]
  );

  const pickSide = useCallback(async (side: 'front' | 'back', source: 'camera' | 'gallery') => {
    setPicking(side);
    try {
      const picked = await uploadService.pickCnicSource(source);
      if (!picked) return;
      setCropSide(side);
      setCropSourceUri(picked.uri);
    } catch (error) {
      Alert.alert('Photo', getApiErrorMessage(error));
    } finally {
      setPicking(null);
    }
  }, []);

  const onCropped = useCallback(
    async (uri: string) => {
      const side = cropSide;
      setCropSourceUri(null);
      setCropSide(null);
      if (!side) return;
      setResult(null);
      const nextFront = side === 'front' ? uri : frontUri;
      const nextBack = side === 'back' ? uri : backUri;
      if (side === 'front') setFrontUri(uri);
      else setBackUri(uri);

      // Scan only once both sides are uploaded, and only when the front hasn't been read yet
      if (nextFront && nextBack && nextFront !== scannedFrontUri) {
        await runExtract(nextFront);
      }
    },
    [cropSide, frontUri, backUri, scannedFrontUri, runExtract]
  );

  const missingSide = !frontUri ? 'front' : !backUri ? 'back' : null;

  const onVerify = async () => {
    if (verifying || extracting) return;
    if (!frontUri) {
      Alert.alert('CNIC front required', 'Take or choose a photo of the front of your CNIC.');
      return;
    }
    if (!backUri) {
      Alert.alert('CNIC back required', 'Take or choose a photo of the back of your CNIC.');
      return;
    }
    if (cnicNumber.replace(/\D/g, '').length !== 13) {
      Alert.alert('CNIC number', 'Enter your 13-digit CNIC number.');
      return;
    }
    if (fatherName.trim().length < 3) {
      Alert.alert("Father's name", "Enter father's name as printed on the CNIC.");
      return;
    }
    if (!expiryDate.trim()) {
      Alert.alert('Expiry date', 'Enter the CNIC date of expiry.');
      return;
    }

    setVerifying(true);
    setResult(null);
    try {
      const data = await cnicVerification.verifyCnic({
        cnicNumber,
        fatherName,
        expiryDate,
        frontUri,
        backUri,
      });
      setResult(data);
      if (transportation && provider) await useProviderStore.getState().loadProvider(provider.id);
      if (data.verified) await identity.clear();
    } catch (error) {
      Alert.alert('Verification failed', getApiErrorMessage(error));
    } finally {
      setVerifying(false);
    }
  };

  if (!identity.ready) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="CNIC Verification" showBack fallbackHref={transportation ? '/(provider)/vehicles/add?mode=onboarding' as never : '/(provider)/register/business'} />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={[styles.heading, { color: colors.dark }]}>CNIC Verification</Text>
          {verified ? <Text style={{ color: colors.success }}>Your saved CNIC verification is complete. You can continue to review.</Text> : null}
          {identity.error ? <Text style={{ color: colors.danger }}>{identity.error}</Text> : null}
          <Text style={[styles.sub, { color: colors.muted }]}>
            Take or choose a photo, then crop so only the CNIC is inside the frame. Avoid glare.
            Matching printed details is not the same as proving the card is authentic.
          </Text>
        </View>

        <CnicImageField
          label="CNIC Front"
          uri={frontUri}
          busy={picking === 'front' || extracting || cropSide === 'front'}
          onTakePhoto={() => void pickSide('front', 'camera')}
          onChooseGallery={() => void pickSide('front', 'gallery')}
          onRemove={() => {
            setFrontUri(null);
            setScannedFrontUri(null);
            setResult(null);
          }}
        />

        <CnicImageField
          label="CNIC Back"
          uri={backUri}
          busy={picking === 'back' || cropSide === 'back' || extracting}
          onTakePhoto={() => void pickSide('back', 'camera')}
          onChooseGallery={() => void pickSide('back', 'gallery')}
          onRemove={() => {
            setBackUri(null);
            setResult(null);
          }}
        />

        {missingSide && (frontUri || backUri) && !extracting ? (
          <View style={[styles.banner, { backgroundColor: `${colors.warning}18` }]}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.bannerText, { color: colors.dark, flex: 1 }]}>
              Now add the {missingSide} of your CNIC. Scanning starts once both sides are uploaded.
            </Text>
          </View>
        ) : null}

        {extracting ? (
          <View style={[styles.banner, { backgroundColor: `${colors.primary}12` }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.primary }]}>
              Reading your CNIC…
            </Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.dark }]}>Confirm details</Text>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>
            Once both sides are uploaded, these fields fill automatically from the CNIC. Check
            them before verifying.
          </Text>
          {autoFillNote ? (
            <View style={[styles.fillBanner, { backgroundColor: `${colors.success}18` }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.fillBannerText, { color: colors.success }]}>{autoFillNote}</Text>
            </View>
          ) : null}
          <Input
            key={`cnic-${fillTick}`}
            label="CNIC Number"
            value={cnicNumber}
            onChangeText={(v) => {
              setAutoFillNote(null);
              setCnicNumber(formatCnicInput(v));
            }}
            placeholder="35202-1234567-1"
            keyboardType="number-pad"
          />
          <Input
            key={`father-${fillTick}`}
            label="Father's Name"
            value={fatherName}
            onChangeText={(v) => {
              setAutoFillNote(null);
              setFatherName(v);
            }}
            placeholder="As printed on CNIC"
            autoCapitalize="characters"
          />
          <Input
            key={`expiry-${fillTick}`}
            label="CNIC Expiry Date"
            value={expiryDate}
            onChangeText={(v) => {
              setAutoFillNote(null);
              setExpiryDate(v);
            }}
            placeholder="DD.MM.YYYY"
          />
        </View>

        <Button
          title={verifying ? 'Verifying your CNIC…' : 'Verify CNIC'}
          loading={verifying}
          disabled={verifying || extracting || !frontUri || !backUri}
          onPress={() => void onVerify()}
        />

        {result ? <ResultCard result={result} /> : null}

        <Button
          title="Continue to Review"
          disabled={Boolean(transportation && !verified)}
          variant="outline"
          onPress={() => {
            if (transportation && !verified) { Alert.alert('Verification required', 'Verify your CNIC before continuing.'); return; }
            router.push('/(provider)/register/review');
          }}
        />
      </ScrollView>

      <CnicCropModal
        visible={Boolean(cropSourceUri)}
        imageUri={cropSourceUri}
        title={cropSide === 'back' ? 'Crop CNIC back' : 'Crop CNIC front'}
        onCancel={() => {
          setCropSourceUri(null);
          setCropSide(null);
        }}
        onCropped={(uri) => void onCropped(uri)}
      />
    </View>
  );
}

function ResultCard({ result }: { result: cnicVerification.CnicVerifyResult }) {
  const colors = useThemeColors();
  const ok = result.status === 'verified';
  const review = result.status === 'manual_review';
  const tone = ok ? colors.success : review ? colors.warning : colors.danger;
  const icon = ok ? 'checkmark-circle' : review ? 'time' : 'alert-circle';
  const title = ok
    ? 'CNIC Verified'
    : review
      ? 'Manual verification required'
      : 'CNIC Verification Failed';

  const Row = ({
    label,
    matched,
    extra,
  }: {
    label: string;
    matched: boolean;
    extra?: string;
  }) => (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, { color: colors.dark }]}>{label}</Text>
      <View style={styles.resultRight}>
        {extra ? <Text style={[styles.resultExtra, { color: colors.muted }]}>{extra}</Text> : null}
        <Ionicons
          name={matched ? 'checkmark' : 'close'}
          size={18}
          color={matched ? colors.success : colors.danger}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.resultCard, { borderColor: `${tone}55`, backgroundColor: colors.card }]}>
      <View style={styles.resultHead}>
        <Ionicons name={icon} size={28} color={tone} />
        <Text style={[styles.resultTitle, { color: tone }]}>{title}</Text>
      </View>
      <Text style={[styles.resultMsg, { color: colors.muted }]}>{result.message}</Text>
      <Row label="CNIC Number" matched={result.fields.cnicNumber.matched} />
      <Row label="Father's Name" matched={result.fields.fatherName.matched} />
      <Row
        label="Expiry Date"
        matched={result.fields.expiryDate.matched && !result.fields.expiryDate.expired}
        extra={result.fields.expiryDate.expired ? 'Expired' : undefined}
      />
      <Row
        label="Document status"
        matched={ok}
        extra={ok ? 'Information matched' : result.status.replace('_', ' ')}
      />
      {ok ? (
        <Pressable onPress={() => router.push('/(provider)/register/review')}>
          <Text style={[styles.continueLink, { color: colors.primary }]}>Continue to review →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { ...Typography.h2 },
  sub: { ...Typography.body, marginTop: Spacing.xs, lineHeight: 22 },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  sectionHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  fillBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  fillBannerText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  bannerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resultTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
  },
  resultMsg: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  resultLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  resultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultExtra: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  continueLink: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
});
