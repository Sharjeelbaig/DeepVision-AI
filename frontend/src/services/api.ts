const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

interface RequestOptions extends RequestInit {
  skipJson?: boolean;
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipJson, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  });

  if (skipJson) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = typeof payload === "object" && payload !== null && "error" in payload
      ? (payload as { error?: string }).error ?? response.statusText
      : response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload as T;
}

export interface LoginResponse {
  success?: boolean;
  error?: string;
}

export interface RegisterResponse {
  success?: boolean;
  error?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  bio?: string;
}

export interface FaceRecognitionResponse {
  isMatch: boolean;
  confidence: number;
  error?: string;
}

export interface FaceAddResponse {
  success?: boolean;
  error?: string;
}

export interface UserProfileResponse {
  data?: Record<string, unknown> | null;
  error?: string;
}

export interface ResetPasswordResponse {
  success?: boolean;
  error?: string;
}

export interface SendResetLinkResponse {
  success?: boolean;
  error?: string;
}

export async function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register({ email, password, name, bio }: RegisterPayload) {
  return request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      profile: {
        name,
        bio: bio ?? "",
      },
    }),
  });
}

export async function recognizeFace(email: string, imageData: string) {
  return request<FaceRecognitionResponse>("/face/recognize", {
    method: "POST",
    body: JSON.stringify({ email, image_data: imageData }),
  });
}

export async function addFace(email: string, imageData: string) {
  return request<FaceAddResponse>("/face/add", {
    method: "POST",
    body: JSON.stringify({ email, image_data: imageData }),
  });
}

export async function getUserProfile(userId: string) {
  return request<UserProfileResponse>(`/users/${userId}/profile`, {
    method: "GET",
  });
}

export async function getUserProfileByEmail(email: string) {
  const query = new URLSearchParams({ email });
  return request<UserProfileResponse>(`/users/profile?${query.toString()}`);
}

export async function resetPassword(userId: string, newPassword: string) {
  return request<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, new_password: newPassword }),
  });
}

export async function sendResetLink(email: string, redirectTo?: string) {
  return request<SendResetLinkResponse>("/auth/send-reset-link", {
    method: "POST",
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
}

export { API_BASE_URL };
