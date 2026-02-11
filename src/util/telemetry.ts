export type OnboardingEvent =
  | "onboarding_entry"
  | "onboarding_path_selected"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "onboarding_error"
  | "onboarding_edge_case"
  | "post_first_after_onboarding"

const fire = (event: OnboardingEvent, props: Record<string, any> = {}) => {
  if (typeof window === "undefined") return
  const plausible = (window as any).plausible as undefined | ((event: string, opts?: any) => void)
  if (typeof plausible !== "function") return
  plausible(event, {props})
}

export const trackOnboarding = (event: OnboardingEvent, props: Record<string, any> = {}) => {
  fire(event, props)
}

export const trackOnboardingEdge = (
  type: string,
  recovered: boolean,
  extras: Record<string, any> = {},
) => {
  fire("onboarding_edge_case", {type, recovered, ...extras})
}

export const trackOnboardingError = (type: string, extras: Record<string, any> = {}) => {
  fire("onboarding_error", {type, ...extras})
}
