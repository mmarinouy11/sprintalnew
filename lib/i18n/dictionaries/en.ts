/**
 * English dictionary (source of truth for keys).
 * Every user-visible string in the app must have a key here (rule #6).
 * es.ts and pt.ts mirror this shape via the `Dictionary` type.
 */
export const en = {
  common: {
    appName: "Sprintal",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
  },
  nav: {
    portfolio: "Portfolio",
    bets: "Bets",
    signals: "Signals",
    settings: "Settings",
  },
  org: {
    levelBadge: "L{level}",
    readOnly: "Read-only",
    roles: {
      owner: "Owner",
      admin: "Admin",
      editor: "Editor",
      viewer: "Viewer",
    },
    topbar: {
      switcher: "Switch area",
      newArea: "New Area",
      parent: "Parent",
      siblings: "Siblings",
      children: "Areas",
      thisOrg: "Current",
    },
    newSub: {
      title: "New sub-area",
      subtitle: "Create an area nested under {parent}.",
      nameLabel: "Area name",
      submit: "Create area",
      cancel: "Cancel",
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      rateLimited: "Too many requests. Please wait a moment and try again.",
      nameRequired: "Enter an area name.",
      parentNotFound: "That parent area could not be found.",
      notOwner: "Only an owner can create areas.",
      depthLimit: "Your plan doesn’t allow areas this deep. Upgrade to nest further.",
      subAreaLimit: "You’ve reached the area limit for your plan. Upgrade to add more.",
    },
  },
  auth: {
    common: {
      email: "Email",
      password: "Password",
      or: "or",
      continue: "Continue",
    },
    login: {
      title: "Sign in to Sprintal",
      subtitle: "Welcome back.",
      submit: "Sign in",
      google: "Continue with Google",
      forgotPassword: "Forgot password?",
      noAccount: "Don’t have an account?",
      signUpLink: "Create one",
    },
    signup: {
      title: "Create your workspace",
      subtitle: "Start your 30-day trial. No card required.",
      orgNameLabel: "Organization name",
      submit: "Create account",
      google: "Sign up with Google",
      haveAccount: "Already have an account?",
      loginLink: "Sign in",
      checkEmail:
        "Almost there — check your email to confirm your account, then sign in.",
    },
    forgot: {
      title: "Reset your password",
      subtitle: "Enter your email and we’ll send you a reset link.",
      submit: "Send reset link",
      backToLogin: "Back to sign in",
      sent: "If an account exists for that email, a reset link is on its way.",
    },
    setPassword: {
      title: "Set your password",
      subtitle: "Choose a password to finish setting up your account.",
      submit: "Save password",
      success: "Password saved. Redirecting…",
    },
    invite: {
      title: "You’ve been invited",
      validating: "Checking your invitation…",
      joinPrompt: "You’re invited to join {org} as {role}.",
      accept: "Accept invitation",
      signInPrompt: "Sign in as {email} to accept.",
      signInLink: "Sign in",
      createPrompt: "Create an account for {email} to accept.",
      createLink: "Create account",
      wrongAccount:
        "You’re signed in as a different account. Sign in as {email} to accept this invite.",
      invalidTitle: "This invitation isn’t valid",
      invalidBody: "The invitation link is invalid or has already been used.",
      expiredBody: "This invitation has expired. Ask an admin to resend it.",
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      missingFields: "Please fill in all fields.",
      invalidEmail: "Enter a valid email address.",
      passwordTooShort: "Password must be at least 8 characters.",
      orgNameRequired: "Enter an organization name.",
      invalidCredentials: "Invalid email or password.",
      emailNotConfirmed: "Please confirm your email before signing in.",
      rateLimited: "Too many attempts. Please wait a moment and try again.",
      inviteInvalid: "This invitation is invalid or has already been used.",
      inviteExpired: "This invitation has expired.",
      inviteEmailMismatch:
        "This invitation was sent to a different email address.",
    },
  },
};

// Leaves are inferred as `string` (no `as const`), so es/pt only have to match
// the shape, not the exact English literals.
export type Dictionary = typeof en;
export default en;
