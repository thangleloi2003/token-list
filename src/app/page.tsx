import React, { Suspense } from 'react';
import CategoryButtons from '@/app/components/CategoryButtons';

export default function Page() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <CategoryButtons />
      </Suspense>
    </div>
  );
}
