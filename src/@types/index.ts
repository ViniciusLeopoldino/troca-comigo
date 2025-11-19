// ARQUIVO COMPLETO: src/@types/index.ts
export interface User {
  id: string;
  fullName: string; // Mapeia full_name do SQL
  email: string;
  bio?: string;
  avatarUrl?: string;
  timeCredits: number;
  userRole: 'ADMIN' | 'USER';
}

export interface Habilidade {
  id: string;
  name: string; // Mapeia name do SQL
  category: string;
  level: string;
  description?: string;
  isOffering: boolean; // Mapeia is_offering (1=true, 0=false)
  isSeeking: boolean;  // Mapeia is_seeking
  usuario?: User;      // Relacionamento ManyToOne
}

export interface Sessao {
  id: string;
  mentor: User;
  mentorado: User;
  habilidade: Habilidade;
  skillName: string;
  scheduledDate: string; // ISO Date
  status: 'AGENDADA' | 'CONFIRMADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  durationHours: number;
  meetingLink?: string;
}