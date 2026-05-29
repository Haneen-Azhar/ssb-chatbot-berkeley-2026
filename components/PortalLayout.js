import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';

const navItems = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/schedules', label: 'Schedules, Groups, & Lists', key: 'schedules' },
  { href: '/course-specific-info', label: 'Course-Specific Info', key: 'course-specific-info' },
  { href: '/important-resources', label: 'Important Resources', key: 'important-resources' },
  { href: '/cdamspa-resources', label: 'CD/AM/SPA Resources', key: 'cdamspa-resources' },
];

export default function PortalLayout({ children, activePage, heroTitle, heroSubtitle, isHomepage }) {
  const Wrapper = isHomepage ? 'div' : ({ children: c }) => c;

  return (
    <div className={isHomepage ? 'homepage' : undefined}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Berkeley B Summer Staff Portal</h2>
          <button className="sidebar-close" aria-label="Close navigation menu"></button>
        </div>
        <nav className="main-navigation">
          <ul className="nav-menu">
            {navItems.map((item) => (
              <li
                key={item.key}
                className={`nav-item${activePage === item.key ? ' active' : ''}`}
              >
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" aria-label="Toggle navigation menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Overlay */}
      <div className="mobile-overlay"></div>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="hero-title">{heroTitle}</h2>
            {heroSubtitle && <p className="hero-subtitle">{heroSubtitle}</p>}
          </div>
        </section>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-container">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-links">
              <a href="#" className="footer-link">Report abuse</a>
              <span className="footer-separator">|</span>
              <a href="#" className="footer-link">Page details</a>
            </div>
            <div className="footer-timestamp">
              <span>Page updated</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Menu Script (client component) */}
      <MobileMenu />
    </div>
  );
}
