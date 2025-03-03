import { create } from "zustand";

type SortState = {
  sortBy: "rank" | "id";
  sortOrder: "ASC" | "DESC";
  searchTokenId: string;
  traitFilters: { [traitType: string]: string[] };
  page: number;
  showMigratedFrogs: boolean;
  setShowMigratedFrogs: (show: boolean) => void;
  setSortBy: (sortBy: "rank" | "id") => void;
  setSortOrder: (sortOrder: "ASC" | "DESC") => void;
  setSearchTokenId: (tokenId: string) => void;
  setTraitFilter: (traitType: string, traitValue: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
};

export const useSortStore = create<SortState>((set) => ({
  sortBy: "id",
  sortOrder: "ASC",
  searchTokenId: "",
  traitFilters: {},
  page: 1,
  showMigratedFrogs: false,
  setShowMigratedFrogs: (show) => set({ showMigratedFrogs: show, page: 1 }),
  setSortBy: (sortBy) => set({ sortBy, page: 1 }),
  setSortOrder: (sortOrder) => set({ sortOrder, page: 1 }),
  setSearchTokenId: (tokenId) => set({ searchTokenId: tokenId, page: 1 }),
  setTraitFilter: (traitType, traitValue) =>
    set((state) => {
      const currentValues = state.traitFilters[traitType] || [];
      const updatedValues = currentValues.includes(traitValue)
        ? currentValues.filter((v) => v !== traitValue) // Remove if exists
        : [...currentValues, traitValue]; // Add if not exists

      const updatedTraitFilters = {
        ...state.traitFilters,
        [traitType]: updatedValues,
      };

      // ✅ If no traits remain, reset the entire object
      if (Object.values(updatedTraitFilters).every((arr) => arr.length === 0)) {
        return { traitFilters: {}, page: 1 };
      }

      return { traitFilters: updatedTraitFilters, page: 1 };
    }),
  setPage: (page) => set({ page }),
  reset: () =>
    set({
      sortBy: "id",
      sortOrder: "ASC",
      searchTokenId: "",
      traitFilters: {},
      page: 1,
      showMigratedFrogs: false,
    }),
}));
