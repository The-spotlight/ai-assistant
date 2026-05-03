const ONBOARDING_KEY = 'ai-assistant-onboarding-completed';

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  const value = localStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
}
