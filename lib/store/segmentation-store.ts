import { create } from 'zustand';
import { SegmentedObject, SegmentationResult } from '@/lib/types/segmentation';

interface SegmentationState {
  segmentationResult: SegmentationResult | null;
  selectedObjects: string[]; // IDs of objects selected for the new design
  generatedModels: any[];
  isProcessing: boolean;
  
  setSegmentationResult: (result: SegmentationResult) => void;
  toggleObjectSelection: (id: string) => void;
  selectAllObjects: () => void;
  deselectAllObjects: () => void;
  setGeneratedModels: (models: any[]) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

export const useSegmentationStore = create<SegmentationState>((set, get) => ({
  segmentationResult: null,
  selectedObjects: [],
  generatedModels: [],
  isProcessing: false,

  setSegmentationResult: (result) => {
    // Auto-select all objects by default
    const allIds = result.objects.map((obj) => obj.id);
    set({ segmentationResult: result, selectedObjects: allIds });
  },

  toggleObjectSelection: (id) => {
    const { selectedObjects } = get();
    if (selectedObjects.includes(id)) {
      set({ selectedObjects: selectedObjects.filter((objId) => objId !== id) });
    } else {
      set({ selectedObjects: [...selectedObjects, id] });
    }
  },

  selectAllObjects: () => {
    const { segmentationResult } = get();
    if (segmentationResult) {
      const allIds = segmentationResult.objects.map((obj) => obj.id);
      set({ selectedObjects: allIds });
    }
  },

  deselectAllObjects: () => {
    set({ selectedObjects: [] });
  },

  setGeneratedModels: (models) => set({ generatedModels: models }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  reset: () =>
    set({
      segmentationResult: null,
      selectedObjects: [],
      generatedModels: [],
      isProcessing: false,
    }),
}));
