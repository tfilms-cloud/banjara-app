import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useAuthStore } from '@/store/authStore';
import type {
  Provider,
  ProviderBooking,
  ProviderDashboardStats,
  ProviderEarningsSummary,
  ProviderHotelSetup,
  ProviderMessageThread,
  ProviderNotification,
  ProviderOnboardingDraft,
  ProviderRestaurantSetup,
  ProviderReview,
  ProviderRoom,
  ProviderRoute,
  ProviderServiceItem,
  ProviderServiceType,
  ProviderTourSetup,
  ProviderTransportSetup,
  ProviderTrip,
  ProviderVehicle,
  RoomAvailabilityDay,
} from '@/types/provider';
import type { GuideDetails } from '@/types/guide';
import {
  canPersistProviderApplication,
  draftFromProvider,
} from '@/utils/providerDraft';

/** Shared promise so concurrent refreshDashboard() calls reuse one request batch. */
let dashboardRefreshInFlight: Promise<void> | null = null;
// Ignore profile reads that started before a newer save/checkpoint/session change.
let profileRequestVersion = 0;

const emptyDraft = (): ProviderOnboardingDraft => ({
  personal: { name: '', email: '', phone: '', password: '' },
  selectedServices: [],
  business: {},
  vehicles: [],
  rooms: [],
});

interface ProviderState {
  formDrafts: Record<string, unknown>;
  profileLoadedFor: string | null;
  setFormDraft: (key: string, value: unknown) => void;
  clearFormDraft: (key: string) => void;
  checkpoint: (
    step: 'location' | 'transport' | 'vehicle',
    vehicleId?: string,
  ) => Promise<Provider>;
  provider: Provider | null;
  draft: ProviderOnboardingDraft;
  draftUserId: string | null;
  services: ProviderServiceItem[];
  vehicles: ProviderVehicle[];
  trips: ProviderTrip[];
  routes: ProviderRoute[];
  rooms: ProviderRoom[];
  bookings: ProviderBooking[];
  earnings: ProviderEarningsSummary | null;
  reviews: ProviderReview[];
  messages: ProviderMessageThread[];
  notifications: ProviderNotification[];
  availability: RoomAvailabilityDay[];
  stats: ProviderDashboardStats | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  setPersonal: (personal: ProviderOnboardingDraft['personal']) => void;
  setSelectedServices: (services: ProviderServiceType[]) => void;
  toggleService: (service: ProviderServiceType) => void;
  setBusiness: (business: ProviderOnboardingDraft['business']) => void;
  setLocationDraft: (
    location: NonNullable<ProviderOnboardingDraft['location']>,
  ) => void;
  setTransport: (transport: Partial<ProviderTransportSetup>) => void;
  setHotel: (hotel: Partial<ProviderHotelSetup>) => void;
  setTour: (tour: Partial<ProviderTourSetup>) => void;
  setGuide: (guide: Partial<GuideDetails>) => void;
  setRestaurant: (restaurant: Partial<ProviderRestaurantSetup>) => void;
  addDraftVehicle: (vehicle: ProviderVehicle) => void;
  addDraftRoom: (room: ProviderRoom) => void;
  resetDraft: () => void;
  clearSession: () => void;

  loadProvider: (providerId: string) => Promise<void>;
  loadProviderByUser: (userId: string) => Promise<void>;
  saveProgress: () => Promise<Provider | null>;
  submitApplication: (userId: string) => Promise<Provider>;
  refreshDashboard: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  setProvider: (provider: Provider | null) => void;
}

function emptyLists() {
  return {
    services: [] as ProviderServiceItem[],
    vehicles: [] as ProviderVehicle[],
    trips: [] as ProviderTrip[],
    routes: [] as ProviderRoute[],
    rooms: [] as ProviderRoom[],
    bookings: [] as ProviderBooking[],
    earnings: null as ProviderEarningsSummary | null,
    reviews: [] as ProviderReview[],
    messages: [] as ProviderMessageThread[],
    notifications: [] as ProviderNotification[],
    availability: [] as RoomAvailabilityDay[],
    stats: null as ProviderDashboardStats | null,
  };
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      formDrafts: {},
      profileLoadedFor: null,
      setFormDraft: (key, value) =>
        set((state) => ({ formDrafts: { ...state.formDrafts, [key]: value } })),
      clearFormDraft: (key) =>
        set((state) => {
          const formDrafts = { ...state.formDrafts };
          delete formDrafts[key];
          return { formDrafts };
        }),
      checkpoint: async (step, vehicleId) => {
        const userId = useAuthStore.getState().user?.id;
        ++profileRequestVersion;
        try {
          const provider = await providerService.saveOnboardingCheckpoint(
            step,
            vehicleId,
          );
          if (useAuthStore.getState().user?.id !== userId) return provider;
          ++profileRequestVersion;
          set({
            provider,
            draft: draftFromProvider(provider, get().draft),
            loading: false,
            profileLoadedFor: userId,
          });
          return provider;
        } catch (error) {
          if (useAuthStore.getState().user?.id === userId) {
            ++profileRequestVersion;
            set({ loading: false, error: getApiErrorMessage(error) });
          }
          throw error;
        }
      },
      provider: null,
      draft: emptyDraft(),
      draftUserId: null,
      ...emptyLists(),
      loading: false,
      saving: false,
      error: null,

      setPersonal: (personal) =>
        set((state) => ({ draft: { ...state.draft, personal } })),
      setSelectedServices: (selectedServices) =>
        set((state) => ({ draft: { ...state.draft, selectedServices } })),
      toggleService: (service) =>
        set((state) => ({
          draft: {
            ...state.draft,
            selectedServices:
              state.draft.selectedServices[0] === service ? [] : [service],
          },
        })),
      setBusiness: (business) =>
        set((state) => ({
          draft: {
            ...state.draft,
            business: { ...state.draft.business, ...business },
          },
        })),
      setLocationDraft: (location) =>
        set((state) => ({ draft: { ...state.draft, location } })),
      setTransport: (transport) =>
        set((state) => ({
          draft: {
            ...state.draft,
            transport: { ...state.draft.transport, ...transport },
          },
        })),
      setHotel: (hotel) =>
        set((state) => ({
          draft: { ...state.draft, hotel: { ...state.draft.hotel, ...hotel } },
        })),
      setTour: (tour) =>
        set((state) => ({
          draft: { ...state.draft, tour: { ...state.draft.tour, ...tour } },
        })),
      setGuide: (guide) =>
        set((state) => ({
          draft: { ...state.draft, guide: { ...state.draft.guide, ...guide } },
        })),
      setRestaurant: (restaurant) =>
        set((state) => ({
          draft: {
            ...state.draft,
            restaurant: { ...state.draft.restaurant, ...restaurant },
          },
        })),
      addDraftVehicle: (vehicle) =>
        set((state) => ({
          draft: {
            ...state.draft,
            vehicles: [...state.draft.vehicles, vehicle],
          },
        })),
      addDraftRoom: (room) =>
        set((state) => ({
          draft: { ...state.draft, rooms: [...state.draft.rooms, room] },
        })),
      resetDraft: () => set({ draft: emptyDraft() }),
      clearSession: () => {
        ++profileRequestVersion;
        dashboardRefreshInFlight = null;
        set({
          formDrafts: {},
          profileLoadedFor: null,
          provider: null,
          draft: emptyDraft(),
          draftUserId: null,
          ...emptyLists(),
          loading: false,
          saving: false,
          error: null,
        });
      },

      setProvider: (provider) => set({ provider }),

      loadProvider: async (_providerId) => {
        const userId = useAuthStore.getState().user?.id;
        if (userId) await get().loadProviderByUser(userId);
      },

      loadProviderByUser: async (userId) => {
        const requestVersion = ++profileRequestVersion;
        if (get().draftUserId && get().draftUserId !== userId) {
          set({
            provider: null,
            draft: emptyDraft(),
            formDrafts: {},
            profileLoadedFor: null,
            ...emptyLists(),
          });
        }
        set({ draftUserId: userId, loading: true, error: null });
        try {
          const provider = await providerService.getProviderByUserId(userId);
          if (
            useAuthStore.getState().user?.id !== userId ||
            requestVersion !== profileRequestVersion
          )
            return;
          const vehicles = provider?.services.includes('transport')
            ? await providerService.getProviderVehicles(provider.id)
            : [];
          if (
            useAuthStore.getState().user?.id !== userId ||
            requestVersion !== profileRequestVersion
          )
            return;
          set({
            profileLoadedFor: userId,
            vehicles,
            provider,
            loading: false,
            draft: provider
              ? draftFromProvider(provider, get().draft)
              : get().draft,
          });
          if (provider) {
            useAuthStore
              .getState()
              .updateProviderLink(provider.id, provider.verificationStatus);
            if (
              !provider.services.includes('transport') ||
              (provider.onboardingProgress?.completed &&
                provider.verificationStatus === 'approved')
            )
              await get().refreshDashboard();
          }
        } catch (error) {
          if (
            useAuthStore.getState().user?.id !== userId ||
            requestVersion !== profileRequestVersion
          )
            return;
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load provider',
          });
        }
      },

      saveProgress: async () => {
        const auth = useAuthStore.getState();
        const token = auth.token;
        if (!auth.user || !token || token === 'guest-token') {
          throw new Error(
            'Please sign in before saving your provider details.',
          );
        }
        const selectedServices =
          get().draft.selectedServices.length > 0
            ? get().draft.selectedServices
            : (get().provider?.services ?? []);
        const draft = {
          ...get().draft,
          selectedServices,
        };
        if (!canPersistProviderApplication(draft, selectedServices)) {
          throw new Error(
            'Complete Business Info: business name, owner, phone, email, city and address, and select one service.',
          );
        }

        if (get().saving)
          throw new Error('Your details are already being saved. Please wait.');
        ++profileRequestVersion;
        set({ saving: true, error: null, draft });
        try {
          const provider = await providerService.saveProviderProgress(
            draft,
            auth.user.providerId || get().provider?.id,
          );
          if (useAuthStore.getState().user?.id !== auth.user.id)
            return provider;
          ++profileRequestVersion;
          set({
            loading: false,
            profileLoadedFor: auth.user.id,
            provider,
            saving: false,
            draftUserId: auth.user.id,
            draft: draftFromProvider(provider, get().draft),
          });
          auth.updateProviderLink(provider.id, provider.verificationStatus);
          return provider;
        } catch (error) {
          if (useAuthStore.getState().user?.id !== auth.user.id) throw error;
          ++profileRequestVersion;
          set({
            loading: false,
            saving: false,
            error: getApiErrorMessage(error),
          });
          throw error;
        }
      },

      submitApplication: async (userId) => {
        if (get().loading || get().saving)
          throw new Error('Please wait for the current save to finish.');
        ++profileRequestVersion;
        set({ loading: true, error: null });
        try {
          const provider = await providerService.submitProviderApplication(
            get().draft,
            userId,
            get().provider?.id,
          );
          if (useAuthStore.getState().user?.id !== userId) return provider;
          ++profileRequestVersion;
          set({
            provider,
            loading: false,
            draftUserId: userId,
            draft: draftFromProvider(provider, get().draft),
          });
          return provider;
        } catch (error) {
          if (useAuthStore.getState().user?.id !== userId) throw error;
          ++profileRequestVersion;
          set({
            loading: false,
            error: getApiErrorMessage(error),
          });
          throw error;
        }
      },

      refreshDashboard: async () => {
        const provider = get().provider;
        const userId = useAuthStore.getState().user?.id;
        if (!provider) return;
        // Collapse overlapping refreshes (focus effects / parent+child) into one in-flight call.
        const existing = dashboardRefreshInFlight;
        if (existing) return existing;

        let run: Promise<void> | null = null;
        run = (async () => {
          set({ loading: true });
          try {
            const [
              services,
              vehicles,
              trips,
              routes,
              rooms,
              bookings,
              earnings,
              reviews,
              messages,
              notifications,
              stats,
            ] = await Promise.all([
              providerService.getProviderServicesList(provider.id),
              providerService.getProviderVehicles(provider.id),
              providerService.getProviderTrips(provider.id),
              providerService.getProviderRoutes(provider.id),
              providerService.getProviderRooms(provider.id),
              providerService.getProviderBookings(provider.id),
              providerService.getProviderEarnings(provider.id),
              providerService.getProviderReviews(provider.id),
              providerService.getProviderMessages(),
              providerService.getProviderNotifications(),
              providerService.getDashboardStats(provider.id),
            ]);
            if (
              useAuthStore.getState().user?.id !== userId ||
              get().provider?.id !== provider.id
            )
              return;
            set({
              services,
              vehicles,
              trips,
              routes,
              rooms,
              bookings,
              earnings,
              reviews,
              messages,
              notifications,
              stats,
              loading: false,
            });
          } catch (error) {
            if (
              useAuthStore.getState().user?.id !== userId ||
              get().provider?.id !== provider.id
            )
              return;
            set({
              loading: false,
              error: getApiErrorMessage(error),
            });
          } finally {
            if (dashboardRefreshInFlight === run)
              dashboardRefreshInFlight = null;
          }
        })();

        dashboardRefreshInFlight = run;
        return run;
      },

      refreshBookings: async () => {
        const provider = get().provider;
        if (!provider) return;
        const bookings = await providerService.getProviderBookings(provider.id);
        set({ bookings });
      },
    }),
    {
      name: 'banjara-provider',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        formDrafts: state.formDrafts,
        draftUserId: state.draftUserId,
        draft: {
          ...state.draft,
          personal: { ...state.draft.personal, password: '' },
          vehicles: [],
          rooms: [],
        },
      }),
    },
  ),
);
