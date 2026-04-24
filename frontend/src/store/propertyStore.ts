import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property } from '../types';

interface PropertyState {
  activeProperty: Property | null;
  properties: Property[];
  setActiveProperty: (property: Property) => void;
  setProperties: (properties: Property[]) => void;
  clearProperty: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      activeProperty: null,
      properties: [],

      setActiveProperty: (property) => {
        localStorage.setItem('active_property_id', property.id);
        set({ activeProperty: property });
      },

      setProperties: (properties) => set({ properties }),

      clearProperty: () => {
        localStorage.removeItem('active_property_id');
        set({ activeProperty: null, properties: [] });
      },
    }),
    {
      name: 'property-storage',
      partialize: (state) => ({
        activeProperty: state.activeProperty,
      }),
    }
  )
);
