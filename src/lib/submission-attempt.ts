export interface SubmissionAttempt {
  key: string;
  payload: string;
}

export const getSubmissionAttempt = (
  current: SubmissionAttempt | null,
  payload: string,
  createKey: () => string = () => crypto.randomUUID(),
): SubmissionAttempt => current?.payload === payload ? current : { key: createKey(), payload };
