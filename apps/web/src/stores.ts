import { create } from "zustand";
import {
  RegisterProducerArgs,
  ProducerTypes,
} from "@/backend/validators/producers";
import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

type CertificationFilter = {
  id: string;
  name: string;
  mustBeVerified: boolean;
};

export type HomePageState = {
  page: number;
  categoryFilter: ProducerTypes | undefined;
  query: string | undefined;
  certsFilter: CertificationFilter[];
  locationSearchArea: google.maps.LatLngBounds | undefined;
  setPage: (page: number | ((current: number) => number)) => void;
  setCategoryFilter: (type: ProducerTypes | undefined) => void;
  setQuery: (query: string | undefined) => void;
  setCertsFilter: (certs: CertificationFilter[]) => void;
  setLocationSearchArea: (
    locationSearchArea: google.maps.LatLngBounds | undefined
  ) => void;
  useIpGeo: boolean;
  setUseIpGeo: (val: boolean) => void;
  countryFilter: undefined | string;
  setCountryFilter: (country: undefined | string) => void;
  customUserLocationRadius: number[] | undefined;
  setCustomUserLocationRadius: (value: number[] | undefined) => void;
  resetFilters: () => void;
};

export const useHomePageStore = create<HomePageState>((set, get) => ({
  page: 0,
  setPage: (page) => {
    if (typeof page === "number") {
      set({ page });
    } else {
      set({ page: page(get().page) });
    }
  },
  query: undefined,
  setQuery: (query) => set({ query }),
  categoryFilter: undefined,
  setCategoryFilter: (typeFilter) =>
    set({ categoryFilter: typeFilter, page: 0 }),
  certsFilter: [],
  setCertsFilter: (certs) => set({ certsFilter: certs }),
  countryFilter: undefined,
  setCountryFilter: (country) => set({ countryFilter: country }),
  resetFilters: () => {
    set({
      categoryFilter: undefined,
      certsFilter: [],
      countryFilter: undefined,
    });
  },
  customUserLocationRadius: undefined,
  setCustomUserLocationRadius: (val) => set({ customUserLocationRadius: val }),
  locationSearchArea: undefined,
  setLocationSearchArea: (locationSearchArea) => set({ locationSearchArea }),
  useIpGeo: false,
  setUseIpGeo: (useIpGeo) => set({ useIpGeo }),
}));

export type GeolocationState =
  | undefined
  | {
      geolocationSupported: boolean;
      location: undefined | GeolocationPosition | GeolocationPositionError;
      position: GeolocationPosition | undefined;
      positionError: GeolocationPositionError | undefined;
    };

export const alreadyRequestedGeoAtom = atomWithStorage(
  "already-requested-geo",
  false
);

export const useGeolocationStore = create<{
  state: GeolocationState;
  setLocationSupported: (value: boolean) => void;
  setPosition: (value: undefined | GeolocationPosition) => void;
  setPositionError: (value: undefined | GeolocationPositionError) => void;
}>((set) => ({
  state: undefined,
  setLocationSupported: (value) =>
    set(({ state }) => ({
      state: state
        ? { ...state, geolocationSupported: value }
        : {
            geolocationSupported: value,
            location: undefined,
            position: undefined,
            positionError: undefined,
          },
    })),
  setPosition: (value) =>
    set(({ state }) => ({
      state: state
        ? {
            ...state,
            location: value,
            position: value,
            positionError: undefined,
          }
        : {
            geolocationSupported: true,
            location: value,
            position: value,
            positionError: undefined,
          },
    })),
  setPositionError: (value) =>
    set(({ state }) => ({
      state: state
        ? {
            ...state,
            location: value,
            position: undefined,
            positionError: value,
          }
        : {
            geolocationSupported: true,
            location: value,
            position: undefined,
            positionError: value,
          },
    })),
}));

export const useProducerRegisterStore = create<{
  args: RegisterProducerArgs | undefined;
  setArgs: (args: RegisterProducerArgs | undefined) => void;
}>((set) => ({
  args: undefined,
  setArgs: (args) => set({ args }),
}));

export const showPinlistDialogAfterPinCreationAtom = atomWithStorage(
  "showPinlistDialogAfterPinCreation",
  true
);

export const showFilterMenuAtom = atom(false);
