export interface AddressDto {
  id: string;
  title: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  district: string;
  detailedAddress: string;
  postalCode?: string | null;
  isDefault: boolean;
}
