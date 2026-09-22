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
import { canPersistProviderApplication, draftFromProvider } from '@/utils/providerDraft';

const emptyDraft = (): ProviderOnboardingDraft => ({
  personal: { name: '', email: '', phone: '', password: '' },
  selectedServices: [],
  business: {},
  vehicles: [],
  rooms: [],
});

interface ProviderState {
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
  setLocationDraft: (location: NonNullable<ProviderOnboardingDraft['location']>) => void;
  setTransport: (transport: Partial<ProviderTransportSetup>) => void;
  setHotel: (hotel: Partial<ProviderHotelSetup>) => void;
  setTour: (tour: Partial<ProviderTourSetup>) => void;
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
      provider: null,
      draft: emptyDraft(),
      draftUserId: null,
      ...emptyLists(),
      loading: false,
      saving: false,
      error: null,

      setPersonal: (personal) => set((state) => ({ draft: { ...state.draft, personal } })),
      setSelectedServices: (selectedServices) =>
        set((state) => ({ draft: { ...state.draft, selectedServices } })),
      toggleService: (service) =>
        set((state) => ({
          draft: {
            ...state.draft,
            selectedServices: state.draft.selectedServices[0] === service ? [] : [service],
          },
        })),
      setBusiness: (business) =>
        set((state) => ({ draft: { ...state.draft, business: { ...state.draft.business, ...business } } })),
      setLocationDraft: (location) => set((state) => ({ draft: { ...state.draft, location } })),
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
      addDraftVehicle: (vehicle) =>
        set((state) => ({ draft: { ...state.draft, vehicles: [...state.draft.vehicles, vehicle] } })),
      addDraftRoom: (room) =>
        set((state) => ({ draft: { ...state.draft, rooms: [...state.draft.rooms, room] } })),
      resetDraft: () => set({ draft: emptyDraft() }),
      clearSession: () =>
        set({
          provider: null,
          draft: emptyDraft(),
          draftUserId: null,
          ...emptyLists(),
          loading: false,
          saving: false,
          error: null,
        }),

      setProvider: (provider) => set({ provider }),

      loadProvider: async (_providerId) => {
        set({ loading: true, error: null });
        try {
          const provider = await providerService.getProviderProfile();
          set({
            provider,
            loading: false,
            draft: provider ? draftFromProvider(provider, get().draft) : get().draft,
          });
          if (provider) await get().refreshDashboard();
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load provider',
          });
        }
      },

      loadProviderByUser: async (userId) => {
        if (get().draftUserId && get().draftUserId !== userId) {
          set({ provider: null, draft: emptyDraft(), ...emptyLists() });
        }
        set({ draftUserId: userId, loading: true, error: null });
        try {
          const provider = await providerService.getProviderByUserId(userId);
          set({
            provider,
            loading: false,
            draft: provider ? draftFromProvider(provider, get().draft) : get().draft,
          });
          if (provider) await get().refreshDashboard();
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load provider',
          });
        }
      },

      saveProgress: async () => {
        const auth = useAuthStore.getState();
        const token = auth.token;
        if (!auth.user || !token || token === 'guest-token') {
          return get().provider;
        }
        const selectedServices =
          get().draft.selectedServices.length > 0
            ? get().draft.selectedServices
            : get().provider?.services ?? [];
        const draft = {
          ...get().draft,
          selectedServices,
        };
        if (!canPersistProviderApplication(draft, selectedServices)) {
          return get().provider;
        }

        set({ saving: true, error: null, draft });
        try {
          const provider = await providerService.saveProviderProgress(
            draft,
            auth.user.providerId || get().provider?.id
          );
          set({
            provider,
            saving: false,
            draftUserId: auth.user.id,
            draft: draftFromProvider(provider, get().draft),
          });
          auth.updateProviderLink(provider.id, provider.verificationStatus);
          return provider;
        } catch (error) {
          set({
            saving: false,
            error: getApiErrorMessage(error),
          });
          throw error;
        }
      },

      submitApplication: async (userId) => {
        set({ loading: true, error: null });
        try {
          const provider = await providerService.submitProviderApplication(get().draft, userId);
          set({
            provider,
            loading: false,
            draftUserId: userId,
            draft: draftFromProvider(provider, get().draft),
          });
          return provider;
        } catch (error) {
          set({
            loading: false,
            error: getApiErrorMessage(error),
          });
          throw error;
        }
      },

      refreshDashboard: async () => {
        const provider = get().provider;
        if (!provider) return;
        set({ loading: true });
        try {
          const [services, vehicles, trips, routes, rooms, bookings, earnings, reviews, messages, notifications, stats] =
            await Promise.all([
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
          set({
            loading: false,
            error: getApiErrorMessage(error),
          });
        }
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
        draftUserId: state.draftUserId,
        draft: {
          ...state.draft,
          personal: { ...state.draft.personal, password: '' },
          vehicles: [],
          rooms: [],
        },
      }),
    }
  )
);
