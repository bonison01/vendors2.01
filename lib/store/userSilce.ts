import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  user_id: string;
  name: string;
  email: string;
  address: string | null;
  phone: string | null;
  is_business_owner: boolean | null;
  business_name: string | null;
  business_address: string | null;
  business_type: string | null;
  product_service: string | null;
  business_experience: string | null;
  business_description: string | null;
  is_registered: boolean | null;
  isbusinessowner: boolean | null;
  photo: string | null;
  categories: string[];
  whatsapp: string | null;
  rating: string | null;
  vendor_id: number | null;
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;