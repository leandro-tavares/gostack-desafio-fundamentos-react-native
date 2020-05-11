import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.removeItem('@GoMarketplace:products'); // limpar o localstorage
      const result = await AsyncStorage.getItem('@GoMarketplace:products');
      if (result) {
        setProducts(JSON.parse(result));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);

      if (productIndex === -1) {
        if (products.length > 0) {
          setProducts([...products, { ...product, quantity: 1 }]);
        } else {
          setProducts([{ ...product, quantity: 1 }]);
        }
      } else {
        const newProducts: Product[] = products;
        newProducts[productIndex].quantity += 1;

        setProducts([...newProducts]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const quantity = products
        .filter(item => item.id === id)
        .map(item => item.quantity)
        .reduce((prev, curr) => (prev || 0) + curr, 0);

      const product = products.map(item => {
        if (item.id === id) {
          return { ...item, quantity: quantity + 1 };
        }
        return item;
      });

      setProducts(product);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const quantity = products
        .filter(item => item.id === id)
        .map(item => item.quantity)
        .reduce((prev, curr) => (prev || 0) + curr, 0);

      let newProducts: Product[] = [];
      if (quantity > 1) {
        newProducts = products.map(item => {
          if (item.id === id) {
            return { ...item, quantity: quantity - 1 };
          }
          return item;
        });
      } else {
        newProducts = products.filter(item => item.id !== id);
      }

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
