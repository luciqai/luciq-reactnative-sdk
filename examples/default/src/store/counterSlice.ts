import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  lastNote: string;
  loading: boolean;
}

const initialState: CounterState = {
  value: 0,
  lastNote: '',
  loading: false,
};

/**
 * Async thunk that simulates a checkout submit with a large payload, so the
 * Luciq Redux middleware records its full async duration as an APM span and a
 * breadcrumb carrying the (large) payload size.
 */
export const submitCheckout = createAsyncThunk('counter/submitCheckout', async (note: string) => {
  // Simulate a network round-trip.
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { note, items: 'x'.repeat(2000) };
});

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    addByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCheckout.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.lastNote = action.payload.note;
      })
      .addCase(submitCheckout.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { increment, decrement, addByAmount } = counterSlice.actions;
export default counterSlice.reducer;
