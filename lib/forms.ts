export type FormState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  id?: number;
};

export const EMPTY_STATE: FormState = {};
