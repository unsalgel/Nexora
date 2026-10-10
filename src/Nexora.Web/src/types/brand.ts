export interface BrandDto {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
}

export type BrandStatusChangedPayload = Pick<
  BrandDto,
  'id' | 'name' | 'logoUrl' | 'isActive'
>;
