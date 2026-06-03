export type RegistrationActionState<TData = unknown> = {
  ok: boolean;
  message: string;
  data?: TData;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type RegistrationRedirect = {
  redirectTo: string;
};
