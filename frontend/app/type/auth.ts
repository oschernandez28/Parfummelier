export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  favorite_accords: string[];
  favorite_products: string[];
  favorite_collections: string[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
