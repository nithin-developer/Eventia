import { apiClient } from "./http";

export interface Speaker {
  id: string;
  name: string;
  email?: string | null;
  bio?: string | null;
  expertise?: string | null;
  session_count?: number;
}

export interface CreateSpeakerInput {
  name: string;
  email?: string;
  bio?: string;
  expertise?: string;
}

export async function listSpeakers(): Promise<Speaker[]> {
  const res = await apiClient.get("/api/speakers");
  return res.data.items as Speaker[];
}

export async function createSpeaker(input: CreateSpeakerInput): Promise<Speaker> {
  const res = await apiClient.post("/api/speakers", input);
  return res.data.speaker as Speaker;
}

export async function updateSpeaker(id: string, patch: Partial<CreateSpeakerInput>): Promise<Speaker> {
  const res = await apiClient.put(`/api/speakers/${id}`, patch);
  return res.data.speaker as Speaker;
}

export async function deleteSpeaker(id: string): Promise<void> {
  await apiClient.delete(`/api/speakers/${id}`);
}

export interface CreateSessionInput {
  title: string;
  track?: string;
  type?: string;
  timeslot?: string;
}

export async function assignSessionToSpeaker(speakerId: string, input: CreateSessionInput) {
  const res = await apiClient.post(`/api/speakers/${speakerId}/sessions`, input);
  return res.data.session as {
    id: string; title: string; track?: string | null; type?: string | null; timeslot?: string | null; speaker_id?: string | null;
  };
}
