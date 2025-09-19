import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AffiliateLink, Category, FilterState, SortOption } from '../types';

// State interface
export interface AppState {
  // Data
  affiliateLinks: AffiliateLink[];
  categories: Category[];
  
  // UI State
  filters: FilterState;
  loading: boolean;
  error: string | null;
  
  // User preferences (persisted)
  preferences: {
    defaultSortBy: SortOption;
    defaultFilters: Partial<FilterState>;
    viewMode: 'grid' | 'list';
  };
}

// Action types
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'UPDATE_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT_BY'; payload: SortOption }
  | { type: 'SET_CATEGORY_FILTER'; payload: string[] }
  | { type: 'SET_COMMISSION_FILTER'; payload: { min?: number; max?: number } }
  | { type: 'SET_FEATURED_FILTER'; payload: boolean }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AppState['preferences']> }
  | { type: 'LOAD_PREFERENCES'; payload: AppState['preferences'] };

// Initial state
const initialState: AppState = {
  affiliateLinks: [],
  categories: [],
  filters: {
    categories: [],
    searchQuery: '',
    sortBy: 'popularity',
    featuredOnly: false,
  },
  loading: false,
  error: null,
  preferences: {
    defaultSortBy: 'popularity',
    defaultFilters: {},
    viewMode: 'grid',
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_AFFILIATE_LINKS':
      return {
        ...state,
        affiliateLinks: action.payload,
        loading: false,
        error: null,
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };

    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          categories: [],
          searchQuery: '',
          sortBy: state.preferences.defaultSortBy,
          featuredOnly: false,
          ...state.preferences.defaultFilters,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload,
        },
      };

    case 'SET_SORT_BY':
      return {
        ...state,
        filters: {
          ...state.filters,
          sortBy: action.payload,
        },
      };

    case 'SET_CATEGORY_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          categories: action.payload,
        },
      };

    case 'SET_COMMISSION_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          commissionRateMin: action.payload.min,
          commissionRateMax: action.payload.max,
        },
      };

    case 'SET_FEATURED_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          featuredOnly: action.payload,
        },
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    case 'LOAD_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
        filters: {
          ...state.filters,
          sortBy: action.payload.defaultSortBy,
          ...action.payload.defaultFilters,
        },
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('affiliateAggregatorPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'LOAD_PREFERENCES', payload: preferences });
      } catch (error) {
        console.warn('Failed to load preferences from localStorage:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem(
      'affiliateAggregatorPreferences',
      JSON.stringify(state.preferences)
    );
  }, [state.preferences]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}