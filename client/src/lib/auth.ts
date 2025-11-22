export interface ProjectConfig {
  project_id: string;
  vf_api_key?: string;
  budget: number;
}

let cachedProjectId: string | null = null;

export async function login(projectId: string, vfApiKey?: string, budget?: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies in request
      body: JSON.stringify({
        project_id: projectId,
        vf_api_key: vfApiKey,
        budget: budget || 60,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Login] Failed:", error.error || "Login failed");
      return { success: false, error: error.error || "Login failed" };
    }

    const data = await response.json();
    cachedProjectId = data.project_id;
    
    // Verify session immediately after login
    await checkSession();
    
    return { success: true };
  } catch (error) {
    console.error("[Login] Error:", error instanceof Error ? error.message : "Network error");
    return { success: false, error: "Network error" };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // Include cookies in request
    });
    cachedProjectId = null;
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export async function checkSession(): Promise<{ authenticated: boolean; project_id?: string }> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include", // Include cookies in request
    });
    
    const data = await response.json();
    
    if (data.authenticated) {
      cachedProjectId = data.project_id;
    } else {
      cachedProjectId = null;
    }
    
    return data;
  } catch (error) {
    console.error("[Session Check] Error:", error instanceof Error ? error.message : "Network error");
    cachedProjectId = null;
    return { authenticated: false };
  }
}

export function getProjectId(): string | null {
  return cachedProjectId;
}

export async function isAuthenticated(): Promise<boolean> {
  if (cachedProjectId) {
    return true;
  }
  const session = await checkSession();
  return session.authenticated;
}
