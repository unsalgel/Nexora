import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ProductItem {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  image: string;
  category?: string;
}

interface FavoritesContextType {
  favorites: ProductItem[];
  toggleFavorite: (product: ProductItem) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('nexora_favorites');
    return saved ? JSON.parse(saved) : [
      {
        id: '4',
        title: 'Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı',
        price: 1249.50,
        oldPrice: 1699.00,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexora_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (product: ProductItem) => {
    setFavorites(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
