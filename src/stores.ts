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
  typeFilter: ProducerTypes | undefined;
  query: string | undefined;
  certs: CertificationFilter[];
  locationSearchArea: google.maps.LatLngBounds | undefined;
  setPage: (page: number | ((current: number) => number)) => void;
  setTypeFilter: (type: ProducerTypes | undefined) => void;
  setQuery: (query: string | undefined) => void;
  setCerts: (certs: CertificationFilter[]) => void;
  setLocationSearchArea: (
    locationSearchArea: google.maps.LatLngBounds | undefined
  ) => void;
  useIpGeo: boolean;
  setUseIpGeo: (val: boolean) => void;
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
  typeFilter: undefined,
  setTypeFilter: (typeFilter) => set({ typeFilter: typeFilter, page: 0 }),
  query: undefined,
  setQuery: (query) => set({ query }),
  certs: [],
  setCerts: (certs) => set({ certs }),
  locationSearchArea: undefined,
  setLocationSearchArea: (locationSearchArea) => set({ locationSearchArea }),
  useIpGeo: false,
  setUseIpGeo: (useIpGeo) => set({ useIpGeo }),
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
