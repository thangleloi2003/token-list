import React from 'react';
import CategoryButtons from '@/app/components/CategoryButtons';
import './globals.css';

export default function RootLayout() {
  return (
    <html lang="en">
      <body>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CategoryButtons />
        </React.Suspense>
      </body>
    </html>
  );
}
