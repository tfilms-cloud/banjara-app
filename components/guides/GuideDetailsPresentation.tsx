import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/components/agency/ExpandableText';
import {
  TripDetailsHeader,
  TripPanel,
  TripReviewCard,
} from '@/components/trip/TripDetailsPresentation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelPhotoGallery } from '@/components/ui/TravelPhotoGallery';
import { TravelIconAction, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { GuideAvailabilityPublic, GuideOfferedService } from '@/types/guide';
import type { Provider } from '@/types/provider';
import type { Review } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  guideDisplayName,
  guideFareSummary,
  guidePhotos,
  guidePricingUnit,
  guideServiceBookable,
  guideServiceKey,
} from '@/utils/guidePresentation';

type Props = {
  provider: Provider;
  availability: GuideAvailabilityPublic | null;
  reviews: Review[];
  services: GuideOfferedService[];
  selected?: string;
  onSelect: (service: GuideOfferedService) => void;
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onProfile: () => void;
  onShare: () => void;
  onChat?: () => void;
  onBook: () => void;
};

export function GuideDetailsPresentation(props: Props) {
  return (
    <TravelDesignProvider>
      <GuideDetailsContent {...props} />
    </TravelDesignProvider>
  );
}

export function GuideDetailsFrame({
  children,
  onBack,
  onProfile,
}: {
  children: ReactNode;
  onBack: () => void;
  onProfile: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <TravelDesignProvider>
      <View style={[s.root, { backgroundColor: theme.background }]}>
        <TripDetailsHeader title="Guide Details" onBack={onBack} onProfile={onProfile} />
        {children}
      </View>
    </TravelDesignProvider>
  );
}

function GuideDetailsContent({
  provider,
  availability,
  reviews,
  services,
  selected,
  onSelect,
  loading,
  onRefresh,
  onBack,
  onProfile,
  onShare,
  onChat,
  onBook,
}: Props) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const guide = provider.guideDetails;
  const legacy = provider.tour;
  const photos = guidePhotos(provider);
  const name = guideDisplayName(provider);
  const years = guide?.yearsExperience ?? legacy?.yearsExperience ?? provider.yearsExperience;
  const hasYears = Number.isFinite(years) && years >= 0;
  const gender = guide?.gender || legacy?.gender;
  const verified = provider.verificationStatus === 'approved';
  const languages = guide?.languages?.length
    ? guide.languages.map((language) => `${language.language} (${language.proficiency})`)
    : [
        ...(legacy?.regionalLanguages ?? []).map((language) => `${language} (regional)`),
        ...(legacy?.internationalLanguages ?? []).map((language) => `${language} (international)`),
      ];
  const areas = guide?.areasCovered?.length ? guide.areasCovered : (legacy?.operatingAreas ?? []);
  const skills = guide?.specialSkills?.length ? guide.specialSkills : (legacy?.specialties ?? []);
  const certifications = guide?.certifications ?? legacy?.certifications ?? [];
  const about =
    guide?.detailedDescription ||
    guide?.shortBio ||
    legacy?.experienceHistory ||
    legacy?.description ||
    provider.description;
  const summary = guideFareSummary(services);
  const canBook = services.some(guideServiceBookable);
  const subtitle = guide?.shortBio || guide?.currentLocation || guide?.city || provider.city;

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <TripDetailsHeader
        title="Guide Details"
        shareLabel="Share guide"
        onBack={onBack}
        onProfile={onProfile}
        onShare={onShare}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <TravelPhotoGallery images={photos.hero} label="Guide" />
        <View style={s.body}>
          <TripPanel style={s.identityPanel}>
            <View style={s.identityRow}>
              <View>
                <Avatar uri={photos.portrait} name={name} size={72} />
                {verified ? (
                  <View
                    style={[
                      s.portraitBadge,
                      { backgroundColor: theme.action, borderColor: theme.surface },
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={12} color={theme.background} />
                  </View>
                ) : null}
              </View>
              <View style={s.flex}>
                <Text style={[s.name, { color: theme.text }]}>{name}</Text>
                {subtitle ? (
                  <Text style={[s.bodyText, { color: theme.muted }]}>{subtitle}</Text>
                ) : null}
                <Text style={[s.rating, { color: theme.text }]}>
                  {provider.rating > 0
                    ? `★ ${provider.rating.toFixed(2)}${provider.reviewCount ? ` (${provider.reviewCount} reviews)` : ''}`
                    : 'New on Banjara'}
                </Text>
              </View>
            </View>
            <View style={s.chips}>
              {verified ? <GuideChip icon="shield-checkmark" label="Banjara verified" /> : null}
              {gender ? (
                <GuideChip
                  label={gender === 'female' ? 'Female' : gender === 'male' ? 'Male' : 'Other'}
                  neutral
                />
              ) : null}
              {hasYears ? (
                <GuideChip
                  icon="ribbon-outline"
                  label={`${years} ${years === 1 ? 'year' : 'years'} experience`}
                  coral
                />
              ) : null}
            </View>
            <View style={[s.stats, { borderTopColor: theme.border }]}>
              <GuideStat value={hasYears ? `${years}y` : '—'} label="Experience" />
              <View style={[s.statDivider, { backgroundColor: theme.border }]} />
              <GuideStat
                value={languages.length ? String(languages.length) : '—'}
                label="Languages"
              />
              <View style={[s.statDivider, { backgroundColor: theme.border }]} />
              <GuideStat
                value={
                  summary.kind === 'price'
                    ? formatCurrency(summary.amount, summary.currency)
                    : summary.kind === 'mixed'
                      ? 'View rates'
                      : 'Ask guide'
                }
                label={summary.kind === 'price' ? `From · ${summary.unit}` : 'Pricing'}
                accent
              />
            </View>
          </TripPanel>

          <GuideSection title="Availability" accessory="Weekly schedule">
            <GuideAvailabilityCard availability={availability} />
          </GuideSection>

          {guide?.guideTypes?.length ||
          languages.length ||
          areas.length ||
          skills.length ||
          certifications.length ? (
            <GuideSection title="Expertise & Qualifications">
              {guide?.guideTypes?.length ? (
                <View style={s.chips}>
                  {guide.guideTypes.map((type, position) => (
                    <GuideChip key={`${type}-${position}`} label={type.replace(/_/g, ' ')} />
                  ))}
                </View>
              ) : null}
              {languages.length ? (
                <GuideInfoCard
                  icon="language-outline"
                  title="Languages"
                  text={languages.join(' · ')}
                />
              ) : null}
              {areas.length ? (
                <GuideInfoCard
                  icon="compass-outline"
                  title="Areas Covered"
                  text={areas.join(' · ')}
                />
              ) : null}
              {skills.length ? (
                <GuideInfoCard icon="bulb-outline" title="Specialist Skills" entries={skills} />
              ) : null}
              {certifications.length ? (
                <GuideInfoCard
                  icon="ribbon-outline"
                  title="Certifications"
                  entries={certifications}
                />
              ) : null}
            </GuideSection>
          ) : null}

          {about ? (
            <GuideSection title={`About ${name}`}>
              <TripPanel style={[s.softPanel, { backgroundColor: theme.field }]}>
                <ExpandableText text={about} numberOfLines={4} />
              </TripPanel>
            </GuideSection>
          ) : null}

          <GuideSection title="Services & Pricing" accessory="Listed rates">
            {services.length ? (
              services.map((service, position) => (
                <GuideServiceCard
                  key={`${guideServiceKey(service)}-${position}`}
                  service={service}
                  selected={selected === guideServiceKey(service)}
                  onSelect={() => onSelect(service)}
                />
              ))
            ) : (
              <EmptyState
                title="No services listed"
                message="Contact the guide to discuss services and rates."
                icon="pricetag-outline"
              />
            )}
          </GuideSection>

          {photos.field.length ? (
            <GuideSection
              title="Field Photos"
              accessory={`${photos.field.length} ${photos.field.length === 1 ? 'photo' : 'photos'}`}
            >
              <TravelPhotoGallery images={photos.field} label="Field" variant="strip" />
            </GuideSection>
          ) : null}

          <GuideSection
            title={`Reviews (${provider.reviewCount || reviews.length})`}
            accessory={provider.rating > 0 ? `★ ${provider.rating.toFixed(2)}` : undefined}
          >
            {reviews.length ? (
              reviews.map((review) => <TripReviewCard key={review.id} review={review} />)
            ) : (
              <Text style={[s.bodyText, { color: theme.muted }]}>No reviews yet.</Text>
            )}
          </GuideSection>
        </View>
      </ScrollView>
      <View
        style={[
          s.footer,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Button
          title="Book guide"
          disabled={!canBook}
          onPress={onBook}
          fullWidth={false}
          style={s.bookButton}
          icon={<Ionicons name="calendar-outline" size={17} color={theme.background} />}
        />
        <Button
          title="Chat"
          variant="ghost"
          disabled={!onChat}
          onPress={onChat}
          fullWidth={false}
          style={s.chatButton}
          icon={<Ionicons name="chatbox-outline" size={18} color={theme.primary} />}
        />
        <TravelIconAction
          icon="share-social-outline"
          label="Share guide"
          onPress={onShare}
          filled
          color={theme.primary}
        />
      </View>
    </View>
  );
}

export function GuideServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: GuideOfferedService;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useHomeDesign();
  const bookable = guideServiceBookable(service);
  const hasPrice = Number.isFinite(service.price) && service.price > 0;
  return (
    <TripPanel
      style={[
        s.serviceCard,
        selected && { borderColor: theme.primary, backgroundColor: theme.field },
      ]}
    >
      <Text style={[s.serviceTitle, { color: theme.text }]}>{service.name}</Text>
      <View style={s.chips}>
        {service.durationLabel || service.durationHours ? (
          <GuideChip
            icon="time-outline"
            label={service.durationLabel || `${service.durationHours}h`}
            neutral
          />
        ) : null}
        <GuideChip label={service.category.replace(/_/g, ' ')} neutral />
      </View>
      {service.description ? (
        <Text style={[s.bodyText, { color: theme.muted }]}>{service.description}</Text>
      ) : null}
      {service.included.length ? (
        <GuideServiceDetail title="Included" entries={service.included} />
      ) : null}
      {service.excluded.length ? (
        <GuideServiceDetail title="Not included" entries={service.excluded} />
      ) : null}
      {service.meetingPoint ? (
        <Text style={[s.caption, { color: theme.muted }]}>
          Meeting point: {service.meetingPoint}
        </Text>
      ) : null}
      {service.availableLocations.length ? (
        <Text style={[s.caption, { color: theme.muted }]}>
          Locations: {service.availableLocations.join(' · ')}
        </Text>
      ) : null}
      {service.notes ? (
        <Text style={[s.caption, { color: theme.muted }]}>{service.notes}</Text>
      ) : null}
      <View style={s.priceRow}>
        <Text style={[s.price, s.flex, { color: theme.primary }]}>
          {hasPrice ? formatCurrency(service.price, service.currency) : 'Ask guide'}
          <Text style={[s.caption, { color: theme.muted }]}>
            {hasPrice ? ` · ${guidePricingUnit(service.pricingType)}` : ''}
          </Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selected ? 'Selected' : 'Select'} ${service.name}`}
          accessibilityState={{ selected, disabled: !bookable }}
          disabled={!bookable}
          onPress={onSelect}
          style={[
            s.selectButton,
            { backgroundColor: selected ? theme.primary : theme.soft, opacity: bookable ? 1 : 0.5 },
          ]}
        >
          <Text style={[s.selectText, { color: selected ? theme.background : theme.primary }]}>
            {selected ? 'Selected ✓' : 'Select'}
          </Text>
        </Pressable>
      </View>
    </TripPanel>
  );
}

function GuideServiceDetail({ title, entries }: { title: string; entries: string[] }) {
  const theme = useHomeDesign();
  return (
    <Text style={[s.caption, { color: theme.muted }]}>
      {title}: {entries.join(' · ')}
    </Text>
  );
}

export function GuideAvailabilityCard({
  availability,
}: {
  availability: GuideAvailabilityPublic | null;
}) {
  const theme = useHomeDesign();
  const [expanded, setExpanded] = useState(false);
  const enabled = availability?.weekly.filter((day) => day.enabled) ?? [];
  return (
    <TripPanel style={[s.softPanel, { backgroundColor: theme.field }]}>
      <View style={s.priceRow}>
        <GuideChip
          icon="ellipse"
          label={enabled.length ? 'Weekly schedule set' : 'Confirm with guide'}
        />
        {availability?.blockedDates.length ? (
          <Text style={[s.caption, { color: theme.coral }]}>
            {availability.blockedDates.length} blocked dates
          </Text>
        ) : null}
      </View>
      <View style={s.infoRow}>
        <Ionicons name="calendar-outline" size={17} color={theme.primary} />
        <Text style={[s.bodyText, s.flex, { color: theme.muted }]}>
          {enabled.length
            ? enabled.map((day) => day.day.slice(0, 3)).join(' · ')
            : 'Contact the guide to confirm available dates.'}
        </Text>
      </View>
      {availability?.availableFrom ? (
        <Text style={[s.caption, { color: theme.primary }]}>
          Booking from {formatDate(availability.availableFrom, false)}
        </Text>
      ) : null}
      {availability?.availableUntil ? (
        <Text style={[s.caption, { color: theme.muted }]}>
          Until {formatDate(availability.availableUntil, false)}
        </Text>
      ) : null}
      {availability ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide guide schedule' : 'View guide schedule'}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={s.scheduleButton}
        >
          <Text style={[s.selectText, { color: theme.primary }]}>
            {expanded ? 'Hide schedule ↑' : 'View schedule ↓'}
          </Text>
        </Pressable>
      ) : null}
      {expanded ? (
        <>
          {enabled.map((day) => (
            <Text key={day.day} style={[s.bodyText, { color: theme.muted }]}>
              {day.day}: {day.startTime}–{day.endTime}
            </Text>
          ))}
          {availability?.blockedDates.length ? (
            <Text style={[s.caption, { color: theme.coral }]}>
              Blocked:{' '}
              {availability.blockedDates.map((date) => formatDate(date, false)).join(' · ')}
            </Text>
          ) : null}
          {availability?.minBookingHours != null ? (
            <Text style={[s.caption, { color: theme.muted }]}>
              Minimum booking: {availability.minBookingHours}h
            </Text>
          ) : null}
          {availability?.maxBookingHours != null ? (
            <Text style={[s.caption, { color: theme.muted }]}>
              Maximum booking: {availability.maxBookingHours}h
            </Text>
          ) : null}
          {availability?.advanceBookingHours != null ? (
            <Text style={[s.caption, { color: theme.muted }]}>
              Book at least {availability.advanceBookingHours}h ahead
            </Text>
          ) : null}
          <Text style={[s.caption, { color: theme.muted }]}>
            Confirm your chosen date and time during booking.
          </Text>
        </>
      ) : null}
    </TripPanel>
  );
}

export function GuideInfoCard({
  icon,
  title,
  text,
  entries,
}: {
  icon: TravelIcon;
  title: string;
  text?: string;
  entries?: string[];
}) {
  const theme = useHomeDesign();
  return (
    <TripPanel style={[s.softPanel, { backgroundColor: theme.field }]}>
      <View style={s.infoRow}>
        <Ionicons name={icon} size={17} color={theme.primary} />
        <Text style={[s.infoTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {text ? <Text style={[s.bodyText, s.infoCopy, { color: theme.muted }]}>{text}</Text> : null}
      {entries?.map((entry, position) => (
        <View key={`${entry}-${position}`} style={s.infoRow}>
          <Text style={{ color: theme.primary }}>•</Text>
          <Text style={[s.bodyText, s.flex, { color: theme.muted }]}>{entry}</Text>
        </View>
      ))}
    </TripPanel>
  );
}

function GuideSection({
  title,
  accessory,
  children,
}: {
  title: string;
  accessory?: string;
  children: ReactNode;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.section}>
      <View style={s.priceRow}>
        <Text accessibilityRole="header" style={[s.sectionTitle, s.flex, { color: theme.text }]}>
          {title}
        </Text>
        {accessory ? <Text style={[s.caption, { color: theme.primary }]}>{accessory}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function GuideChip({
  label,
  icon,
  coral,
  neutral,
}: {
  label: string;
  icon?: TravelIcon;
  coral?: boolean;
  neutral?: boolean;
}) {
  const theme = useHomeDesign();
  const color = coral ? theme.coral : neutral ? theme.muted : theme.primary;
  return (
    <View
      style={[
        s.chip,
        { backgroundColor: coral ? theme.coralSoft : neutral ? theme.field : theme.soft },
      ]}
    >
      {icon ? <Ionicons name={icon} size={11} color={color} /> : null}
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function GuideStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const theme = useHomeDesign();
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color: accent ? theme.primary : theme.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  body: { padding: 16, gap: 24 },
  identityPanel: { padding: 16, gap: 14, borderRadius: 22 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: Fonts.displayBold, fontSize: 19, lineHeight: 25 },
  rating: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 20, marginTop: 3 },
  bodyText: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 21 },
  caption: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16, flexShrink: 1 },
  portraitBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 15,
    flexShrink: 1,
    textTransform: 'capitalize',
  },
  stats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 14, gap: 8 },
  stat: { flex: 1, alignItems: 'center', minWidth: 0 },
  statValue: { fontFamily: Fonts.displayBold, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    lineHeight: 14,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statDivider: { width: 1, height: 30 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: Fonts.displayBold, fontSize: 18, lineHeight: 25 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  softPanel: { borderRadius: 20, padding: 14, gap: 8 },
  infoTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 21, flexShrink: 1 },
  infoCopy: { paddingLeft: 23 },
  serviceCard: { borderRadius: 22, padding: 16, gap: 10 },
  serviceTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 22 },
  price: { fontFamily: Fonts.displayBold, fontSize: 18, lineHeight: 25 },
  selectButton: {
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  scheduleButton: { minHeight: 44, justifyContent: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookButton: { flex: 1, borderRadius: 22, paddingHorizontal: 12 },
  chatButton: { borderRadius: 22, paddingHorizontal: 12 },
});
