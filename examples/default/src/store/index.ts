import { configureStore } from '@reduxjs/toolkit';
import { createLuciqReduxMiddleware } from '@luciq/react-native';

import counterReducer from './counterSlice';

/**
 * Store wired with the Luciq Redux middleware. Every dispatched action is
 * recorded as an APM custom span (dispatch timing) and a breadcrumb carrying
 * the action type and serialized payload size.
 */
export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      createLuciqReduxMiddleware({
        namePrefix: 'Redux',
      }),
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
