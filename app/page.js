import PortalLayout from '@/components/PortalLayout';

export const metadata = {
  title: 'Berkeley B Summer Staff Portal',
  description: 'Berkeley B Summer Staff Portal - Home',
  openGraph: {
    title: 'Berkeley B Summer Staff Portal',
    description: 'Berkeley B Summer Staff Portal - Home',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <PortalLayout
      activePage="home"
      heroTitle="Berkeley B Summer Staff Portal"
      heroSubtitle="Welcome to the staff portal"
      isHomepage
    >
      <div className="welcome-message">
        <p>Use the navigation menu to access different sections of the portal.</p>
      </div>
    </PortalLayout>
  );
}
