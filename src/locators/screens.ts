import { androidId as id, iosButton, iosPredicate, iosText, pair } from './strategies.js';

// Source-backed selectors for native release 2.3.0; see docs/locator-audit.md.
// iOS's native cart cells lack accessibility IDs. These scoped structural selectors
// are deliberate exceptions, isolated here rather than spread through business tests.
const iosCell = '//XCUIElementTypeTable/XCUIElementTypeCell[1]';
const iosCartFooter = '//XCUIElementTypeStaticText[@label="Total:"]/..';
const iosReviewFooter = '//XCUIElementTypeStaticText[@label="Total:"]/..';
export const navigation = {
  cart: pair(id('cartIV'), '~Cart-tab-item'),
  // The count sits beside the cart tab button, over the gray circle. It is not inside the button.
  badge: pair(id('cartTV'), '//XCUIElementTypeButton[@name="Cart-tab-item"]/following-sibling::XCUIElementTypeOther/XCUIElementTypeStaticText'),
};
export const catalog = {
  ready: pair('~title', '~Catalog-screen'),
  // Android only wires the product image's click handler, not its title.
  product: (name: string) => pair(`//*[@resource-id="com.saucelabs.mydemoapp.android:id/titleTV" and @text=${JSON.stringify(name)}]/../*[@resource-id="com.saucelabs.mydemoapp.android:id/productIV"]`, iosText(name)),
};
export const product = {
  ready: pair(id('cartBt'), '~ProductDetails-screen'),
  add: pair(id('cartBt'), '~AddToCart'),
};
export const cart = {
  ready: pair(id('cartBt'), '~ProceedToCheckout'),
  name: pair(id('titleTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"Sauce Labs")]`),
  price: pair(id('priceTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"$")]`),
  quantity: pair(id('noTV'), `${iosCell}//XCUIElementTypeStaticText[string(number(@label)) != "NaN"]`),
  increase: pair(id('plusIV'), iosButton('AddPlus Icons')),
  decrease: pair(id('minusIV'), iosButton('SubtractMinus Icons')),
  subtotal: pair(id('totalPriceTV'), `${iosCartFooter}/XCUIElementTypeStaticText[last()]`),
  checkout: pair(id('cartBt'), '~ProceedToCheckout'),
};
export const login = {
  username: pair(id('nameET'), '-ios class chain:**/XCUIElementTypeTextField[1]'),
  password: pair(id('passwordET'), '-ios class chain:**/XCUIElementTypeSecureTextField[1]'),
  // iOS shows these rows under the fields. Tapping one fills both values.
  savedUser: (email: string) => pair(id('nameET'), iosPredicate(`type == 'XCUIElementTypeButton' AND name == ${JSON.stringify(email)}`)),
  submit: pair(id('loginBtn'), iosButton('Login')),
};
const field = (android: string, placeholder: string) => pair(id(android), iosPredicate(`type == 'XCUIElementTypeTextField' AND value == ${JSON.stringify(placeholder)}`));
export const shipping = {
  ready: pair(id('enterShippingAddressTV'), iosText('Enter a shipping address')),
  fullName: field('fullNameET', 'Rebecca Winter'),
  address1: field('address1ET', 'Mandorley 112'),
  city: field('cityET', 'Truro'),
  state: field('stateET', 'Cornwall'),
  zip: field('zipET', '89750'),
  country: field('countryET', 'United Kingdom'),
  submit: pair(id('paymentBtn'), iosButton('To Payment')),
  nameError: pair(id('fullNameErrorTV'), iosText('Please provide your full name.')),
  dismissError: pair(id('fullNameErrorTV'), iosButton('OK')),
};
export const payment = {
  ready: pair(id('enterPaymentMethodTV'), iosText('Enter a payment method')),
  fullName: field('nameET', 'Maxim Winter'),
  cardNumber: field('cardNumberET', '3258 1265 7568 7896'),
  expiry: field('expirationDateET', '03/25'),
  securityCode: field('securityCodeET', '123'),
  submit: pair(id('paymentBtn'), iosButton('Review Order')),
};
export const review = {
  ready: pair(id('enterShippingAddressTV'), iosText('Review your order')),
  name: pair(id('titleTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"Sauce Labs")]`),
  unitPrice: pair(id('priceTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"$")]`),
  total: pair(id('totalAmountTV'), `${iosReviewFooter}/XCUIElementTypeStaticText[last()]`),
  quantity: pair(id('itemNumberTV'), `${iosReviewFooter}/XCUIElementTypeStaticText[contains(@label,"item")]`),
  placeOrder: pair(id('paymentBtn'), iosButton('Place Order')),
};
export const confirmation = {
  heading: pair(id('completeTV'), iosText('Checkout Complete')),
};
