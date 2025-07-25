import { Toaster } from 'react-hot-toast';

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'color-mix(in oklab, var(--color-neutral-900) 70%, transparent)',
          borderStyle: 'var(--tw-border-style)',
          borderWidth: '1px',
          borderColor: 'var(--color-neutral-700)',
          color: 'white',
        },
      }}
    />
  );
}