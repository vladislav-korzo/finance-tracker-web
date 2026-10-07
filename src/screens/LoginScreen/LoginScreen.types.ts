import type { UseFormReturn } from 'react-hook-form';

import type { LoginFormValues } from '@/screens/LoginScreen/LoginScreen.formConfig';

export type LoginScreenProps = {
  form: UseFormReturn<LoginFormValues>;
  onSubmit: () => void;
};
