import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/navigation/router';

export function App() {
  return <RouterProvider router={router} />;
}
