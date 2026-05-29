'use client';

import { useEffect } from 'react';

export default function MobileMenu() {
  useEffect(() => {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebarClose = document.querySelector('.sidebar-close');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');

    if (!menuToggle || !sidebar || !overlay) return;

    function toggleMenu() {
      menuToggle.classList.toggle('active');
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');

      if (sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    function handleMenuToggleClick() {
      toggleMenu();
    }

    function handleOverlayClick() {
      toggleMenu();
    }

    function handleSidebarCloseClick() {
      toggleMenu();
    }

    function handleNavLinkClick() {
      if (sidebar.classList.contains('open')) {
        toggleMenu();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        toggleMenu();
      }
    }

    menuToggle.addEventListener('click', handleMenuToggleClick);
    overlay.addEventListener('click', handleOverlayClick);
    if (sidebarClose) {
      sidebarClose.addEventListener('click', handleSidebarCloseClick);
    }

    const navLinks = document.querySelectorAll('.nav-item a');
    navLinks.forEach(link => {
      link.addEventListener('click', handleNavLinkClick);
    });

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      menuToggle.removeEventListener('click', handleMenuToggleClick);
      overlay.removeEventListener('click', handleOverlayClick);
      if (sidebarClose) {
        sidebarClose.removeEventListener('click', handleSidebarCloseClick);
      }
      navLinks.forEach(link => {
        link.removeEventListener('click', handleNavLinkClick);
      });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
