import { apiClient } from "./http";

export interface Volunteer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

export interface CreateVolunteerInput {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export async function listVolunteers(): Promise<Volunteer[]> {
  const res = await apiClient.get("/api/volunteers");
  return res.data.items as Volunteer[];
}

export async function createVolunteer(input: CreateVolunteerInput): Promise<Volunteer> {
  const res = await apiClient.post("/api/volunteers", input);
  return res.data.volunteer as Volunteer;
}

export async function updateVolunteer(id: string, patch: Partial<CreateVolunteerInput>): Promise<Volunteer> {
  const res = await apiClient.put(`/api/volunteers/${id}`, patch);
  return res.data.volunteer as Volunteer;
}

export async function deleteVolunteer(id: string): Promise<void> {
  await apiClient.delete(`/api/volunteers/${id}`);
}
