import type { UseFormReturn } from 'react-hook-form';

import type { RegisterFormValues } from '@/screens/RegisterScreen/RegisterScreen.formConfig';

export type RegisterScreenProps = {
  form: UseFormReturn<RegisterFormValues>;
  onSubmit: () => void;
};
