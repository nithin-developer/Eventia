import { apiClient } from "./http";

export interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

export interface CreateVendorInput {
  name: string;
  category?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export async function listVendors(): Promise<Vendor[]> {
  const res = await apiClient.get("/api/vendors");
  return res.data.items as Vendor[];
}

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  const res = await apiClient.post("/api/vendors", input);
  return res.data.vendor as Vendor;
}

export async function updateVendor(id: string, patch: Partial<CreateVendorInput>): Promise<Vendor> {
  const res = await apiClient.put(`/api/vendors/${id}`, patch);
  return res.data.vendor as Vendor;
}

export async function deleteVendor(id: string): Promise<void> {
  await apiClient.delete(`/api/vendors/${id}`);
}
