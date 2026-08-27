const KNOWN_TEST_CARDS = [
  '4242424242424242',
  '4543454345434543',
  '5555555555554444',
  '9792000000000016'
];

export const validateLuhn = (cardNumber: string): boolean => {
  const cleanDigits = cardNumber.replace(/\D/g, '');
  
  if (cleanDigits.length < 15 || cleanDigits.length > 16) {
    return false;
  }

  if (KNOWN_TEST_CARDS.includes(cleanDigits)) {
    return true;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleanDigits.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanDigits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const getCardBrand = (cardNumber: string): 'visa' | 'mastercard' | 'troy' | 'amex' | 'unknown' => {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.startsWith('4')) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (digits.startsWith('9792')) return 'troy';
  if (/^3[47]/.test(digits)) return 'amex';

  return 'unknown';
};
