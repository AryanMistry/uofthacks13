import { RoomData } from './room';
import { Product } from './product';
import { IdentityProfile } from './identity';

export interface DesignLayout {
  roomData: RoomData;
  furniture: Product[];
  lighting: Product[];
  decorations: Product[];
  colorScheme: {
    walls: string;
    floor: string;
    ceiling: string;
    accent: string;
  };
  layout: {
    furniture: Array<{
      productId: string;
      position: { x: number; y: number; z: number };
      rotation: number;
    }>;
  };
}

export interface DesignResult {
  id: string;
  identityProfile: IdentityProfile;
  originalRoom: RoomData;
  designLayout: DesignLayout;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  createdAt: Date;
}
