export interface SSMParameter {
  Name: string;
  Value: string;
  Type: string;
  Version: number;
  LastModifiedDate: string;
  ARN?: string;
  Description?: string;
}

export interface SSMParameterHistory {
  Name: string;
  Value: string;
  Type: string;
  Version: number;
  LastModifiedDate: string;
  Description?: string;
}

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function fetchParameters(
  path: string,
  recursive: boolean = true
): Promise<SSMParameter[]> {
  const params = new URLSearchParams({ path, recursive: String(recursive) });
  const data = await request<{ parameters: SSMParameter[] }>(`/parameters?${params}`);
  return data.parameters;
}

export async function searchParameters(search: string): Promise<SSMParameter[]> {
  const params = new URLSearchParams({ search });
  const data = await request<{ parameters: SSMParameter[] }>(`/parameters?${params}`);
  return data.parameters;
}

export async function fetchParameterHistory(
  name: string
): Promise<SSMParameterHistory[]> {
  const params = new URLSearchParams({ name });
  const data = await request<{ history: SSMParameterHistory[] }>(`/parameters/history?${params}`);
  return data.history;
}

export async function createParameter(
  name: string,
  value: string,
  type: string = "String",
  description?: string
): Promise<{ success: boolean; version: number }> {
  return request("/parameters", {
    method: "POST",
    body: JSON.stringify({ name, value, type, description }),
  });
}

export async function updateParameter(
  name: string,
  value: string,
  type: string = "String",
  description?: string
): Promise<{ success: boolean; version: number }> {
  return request("/parameters", {
    method: "PUT",
    body: JSON.stringify({ name, value, type, description }),
  });
}

export async function bulkUpdateParameters(
  parameters: { name: string; value: string; type?: string; description?: string }[]
): Promise<{ results: { name: string; success: boolean; version?: number; error?: string }[] }> {
  return request("/parameters/bulk", {
    method: "PUT",
    body: JSON.stringify({ parameters }),
  });
}

export async function copyParameters(
  sourcePaths: string[],
  sourcePrefix: string,
  targetPrefix: string
): Promise<{ copied: string[]; failed: { name: string; error: string }[] }> {
  return request("/parameters/copy", {
    method: "POST",
    body: JSON.stringify({ sourcePaths, sourcePrefix, targetPrefix }),
  });
}

export async function deleteParametersApi(
  names: string[]
): Promise<{ deleted: string[]; failed: string[] }> {
  return request("/parameters", {
    method: "DELETE",
    body: JSON.stringify({ names }),
  });
}
