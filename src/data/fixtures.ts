import type { Credentials, PaymentDetails, Product, ShippingDetails } from '../types/domain.js';
import type { Platform } from '../types/domain.js';

export const products: Record<Platform, Product> = {
  android: { name: 'Sauce Labs Backpack', unitPriceCents: 2999 },
  ios: { name: 'Sauce Labs Backpack - Black', unitPriceCents: 2999 },
};
export const credentials: Credentials = { username: 'bob@example.com', password: '10203040' };
export const shippingDetails: ShippingDetails = {
  fullName: 'Alex Tester', address1: '123 Test Street', city: 'Toronto',
  state: 'Ontario', zip: '12345', country: 'Canada',
};
export const paymentDetails: PaymentDetails = {
  fullName: 'Alex Tester', cardNumber: '4111111111111111', expiry: '1230', securityCode: '123',
};
export const deliveryCents = 599;
