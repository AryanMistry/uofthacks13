import { create } from 'zustand';
import { RoomData } from '@/lib/types/room';
import { IdentityProfile } from '@/lib/types/identity';
import { DesignResult } from '@/lib/types/design';

interface DesignState {
  roomData: RoomData | null;
  identityProfile: IdentityProfile | null;
  designResult: DesignResult | null;
  setRoomData: (data: RoomData) => void;
  setIdentityProfile: (profile: IdentityProfile) => void;
  setDesignResult: (result: DesignResult) => void;
  reset: () => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  roomData: null,
  identityProfile: null,
  designResult: null,
  setRoomData: (data) => set({ roomData: data }),
  setIdentityProfile: (profile) => set({ identityProfile: profile }),
  setDesignResult: (result) => set({ designResult: result }),
  reset: () => set({ 
    roomData: null, 
    identityProfile: null, 
    designResult: null 
  }),
}));
