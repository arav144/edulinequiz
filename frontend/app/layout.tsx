import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eduline Quiz Portal',
  description: 'Student examination and assessment platform.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="student-bg min-h-screen text-slate-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
