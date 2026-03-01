'use client';

import { useState } from 'react';

export function useHeaderState() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return {
    isSearchOpen,
    isMenuOpen,
    openSearch: () => setIsSearchOpen(true),
    closeSearch: () => setIsSearchOpen(false),
    toggleMenu: () => setIsMenuOpen((v) => !v),
    closeMenu: () => setIsMenuOpen(false),
  };
}
