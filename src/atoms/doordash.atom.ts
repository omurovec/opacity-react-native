import {atom, selector} from 'recoil';
import {CartInterface} from '../doordash';
import {OrderInterface} from '../doordash/orderHistory';
import {SearchResultInterface} from '../doordash/searchRestaurants';
import {ProfileInterface} from '../doordash/userProfile';
import {randomDeviceId, randomState} from '../utils';

const IS_TESTING = true;

// Replace w/ string of auth token
const TESTING_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJvcmlnX2lhdCI6MTcxMzM1MDA1NSwiZXhwIjoxNzEzNjA5MjU1LCJ1c2VyIjp7ImF1dGhfdmVyc2lvbiI6MywiaXNfc3RhZmYiOmZhbHNlLCJpZCI6Mjc2OTI5MDg0LCJlbWFpbCI6Im93ZW5tdXJvdmVjQGdtYWlsLmNvbSJ9LCJjaWQiOjE2OTI5MjIyNDI2MzkzMzE1Njh9.V5CsgcleDGb9sPBy2QdBMOJ40mNGSENqvmNzxsgKfZc';

export const randomDeviceIdState = atom({
  key: 'random-device-id',
  default: randomDeviceId(),
});

export const randomStateState = atom({
  key: 'random-state',
  default: randomState(),
});

export const codeState = atom<string | undefined>({
  key: 'code',
  default: undefined,
});

export const tokenState = atom<string | undefined>({
  key: 'token',
  default: TESTING_TOKEN,

  // Commented out storage for the time being since Expo Go doesn't support it
  // ...(IS_TESTING
  //   ? {
  //       default: TESTING_TOKEN,
  //     }
  //   : {
  //       default: undefined,
  //       effects: [
  //         ({onSet}) => {
  //           onSet(token =>
  //             token
  //               ? storage.set(DOORDASH_TOKEN, token)
  //               : storage.delete(DOORDASH_TOKEN),
  //           );
  //         },
  //       ],
  //     }),
});

export const hasTokenSelector = selector<boolean>({
  key: 'has-token',
  get: ({get}) => !!get(tokenState),
});

export const profileState = atom<ProfileInterface | undefined>({
  key: 'profile',
  default: undefined,
});

export const ordersState = atom<OrderInterface[]>({
  key: 'orders',
  default: [],
});

export const searchResultsState = atom<SearchResultInterface | undefined>({
  key: 'search-results',
  default: undefined,
});

export const cartIdState = atom<string | undefined>({
  key: 'cart-id',
  default: undefined,
});

export const cartState = atom<CartInterface | undefined>({
  key: 'cart',
  default: undefined,
});
