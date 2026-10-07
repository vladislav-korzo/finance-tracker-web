import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';

import { LoginScreen } from '@/screens/LoginScreen/LoginScreen';
import type { LoginFormValues } from '@/screens/LoginScreen/LoginScreen.formConfig';

function Harness() {
  const form = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });
  return <LoginScreen form={form} onSubmit={() => undefined} />;
}

describe('LoginScreen', () => {
  it('renders sign in heading', () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Электронная почта')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });
});
