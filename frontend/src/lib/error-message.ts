export class ApiError extends Error {
  userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.userMessage = userMessage ?? message;
  }
}

export function getUserErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return normalizeErrorMessage(error.message);
  }

  return "Something went wrong. Please try again.";
}

export function normalizeErrorMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("invalid email or password") || normalized.includes("invalid credentials")) {
    return "Invalid credentials.";
  }

  if (normalized.includes("validation failed")) {
    return "Required fields are missing or invalid.";
  }

  if (normalized.includes("required")) {
    return "Required fields are missing or invalid.";
  }

  if (normalized.includes("quota exceeded") || normalized.includes("limit reach") || normalized.includes("limit reached")) {
    return "Sender limit reached.";
  }

  if (normalized.includes("remaining sender capacity") || normalized.includes("exceeds remaining sender capacity")) {
    return "Assigned limit exceeds the remaining capacity.";
  }

  if (normalized.includes("session has been terminated")) {
    return "Your session has been terminated. Please sign in again to continue.";
  }

  if (normalized.includes("session expired")) {
    return "Session expired. Please sign in again.";
  }

  if (normalized.includes("session is not active") || normalized.includes("invalid or expired token")) {
    return "Session expired. Please sign in again.";
  }

  if (normalized.includes("user account is not active")) {
    return "This account is not active.";
  }

  if (normalized.includes("no active sender accounts available")) {
    return "No active sender account is available.";
  }

  if (normalized.includes("provider daily capacity exceeded")) {
    return "Daily sending capacity has been reached.";
  }

  if (normalized.includes("internal server error")) {
    return "Something went wrong. Please try again.";
  }

  return message;
}
