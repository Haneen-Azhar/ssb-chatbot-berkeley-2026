import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import ChatbotWidget from '@/components/ChatbotWidget';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Berkeley B Summer Staff Portal',
  description: 'Berkeley B Summer Staff Portal - Your central hub for schedules, resources, and course information.',
  icons: {
    icon: '/images/cal-bear-avatar.webp',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}
