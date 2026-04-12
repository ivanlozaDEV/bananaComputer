import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { StoreProvider } from '@/context/StoreContext';
import { SearchProvider } from '@/context/SearchContext';

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <SearchProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </SearchProvider>
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
