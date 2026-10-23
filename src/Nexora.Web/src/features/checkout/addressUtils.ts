export interface AddressFormData {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
}

export function formatFullShippingAddress(address: AddressFormData): string {
  const name = address.fullName.trim();
  const phone = address.phone.trim();
  const detail = address.fullAddress.trim();
  const district = address.district.trim();
  const city = address.city.trim();

  return `${name} - Tel: ${phone} - Adres: ${detail} ${district}/${city}`.trim();
}

export function validateAddressFormData(address: AddressFormData): { isValid: boolean; error?: string } {
  if (
    !address.fullName.trim() ||
    !address.phone.trim() ||
    !address.city.trim() ||
    !address.district.trim() ||
    !address.fullAddress.trim()
  ) {
    return {
      isValid: false,
      error: 'Lütfen tüm adres alanlarını eksiksiz doldurunuz.',
    };
  }

  const phoneDigits = address.phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return {
      isValid: false,
      error: 'Lütfen geçerli bir telefon numarası giriniz (en az 10 hane).',
    };
  }

  return { isValid: true };
}
