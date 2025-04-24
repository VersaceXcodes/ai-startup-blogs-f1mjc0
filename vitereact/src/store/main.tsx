import { configureStore, combineReducers, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Define interfaces for our global state
interface AuthState {
  is_authenticated: boolean;
  auth_token: string;
  user: {
    uid?: string;
    name?: string;
    email?: string;
    is_admin?: boolean;
    profile_image?: string;
    bio?: string;
    social_links?: Record<string, string>;
  };
}

interface AppNotification {
  type: string;
  message: string;
  timestamp: number;
}

interface ErrorState {
  errorCode?: number;
  errorMessage?: string;
}

interface GlobalState {
  auth_state: AuthState;
  app_notifications: AppNotification[];
  global_loading: boolean;
  error_state: ErrorState;
}

// Initial state following the provided schemas and defaults
const initial_state: GlobalState = {
  auth_state: {
    is_authenticated: false,
    auth_token: "",
    user: {}
  },
  app_notifications: [],
  global_loading: false,
  error_state: {}
};

// Create a slice for global state management
const global_slice = createSlice({
  name: 'global',
  initialState: initial_state,
  reducers: {
    set_auth_state(state, action: PayloadAction<AuthState>) {
      state.auth_state = action.payload;
    },
    clear_auth_state(state) {
      state.auth_state = { is_authenticated: false, auth_token: "", user: {} };
    },
    add_app_notification(state, action: PayloadAction<AppNotification>) {
      state.app_notifications.push(action.payload);
    },
    remove_app_notification(state, action: PayloadAction<number>) {
      state.app_notifications.splice(action.payload, 1);
    },
    clear_app_notifications(state) {
      state.app_notifications = [];
    },
    set_global_loading(state, action: PayloadAction<boolean>) {
      state.global_loading = action.payload;
    },
    set_error_state(state, action: PayloadAction<ErrorState>) {
      state.error_state = action.payload;
    },
    clear_error_state(state) {
      state.error_state = {};
    }
  }
});

// Extract actions for use in the application
export const {
  set_auth_state,
  clear_auth_state,
  add_app_notification,
  remove_app_notification,
  clear_app_notifications,
  set_global_loading,
  set_error_state,
  clear_error_state
} = global_slice.actions;

// Combine reducers (if there were more slices, they would be combined here)
const root_reducer = combineReducers({
  global: global_slice.reducer
});

// Setup persist configuration to use localStorage
const persist_config = {
  key: 'root',
  storage,
  whitelist: ['global'] // persist the global slice
};

const persisted_reducer = persistReducer(persist_config, root_reducer);

// Create the Redux store with middleware adjustments for redux-persist actions
const store = configureStore({
  reducer: persisted_reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

// Initialize redux-persist persistor
export const persistor = persistStore(store);

// Setup realtime subscriptions using socket.io-client if VITE_SOCKET_URL is provided
let socket: Socket | null = null;
if (import.meta.env.VITE_SOCKET_URL) {
  socket = io(import.meta.env.VITE_SOCKET_URL as string);
  socket.on('notification', async (data: AppNotification) => {
    // Using async/await in case further asynchronous processes are added
    await store.dispatch(add_app_notification(data));
  });
}

// Export types for use in the application
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Create typed hooks for use in functional components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export default store for integration with the Provider in the app root component
export default store;