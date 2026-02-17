// Descriptions client-friendly pour chaque statut (affichees dans les tooltips)
export const STATUS_DESCRIPTIONS: Record<string, string> = {
  // Strategy statuses
  DRAFT: "Ce document est en cours de preparation par l'equipe.",
  PENDING_REVIEW: "En attente de votre avis — revisez et validez chaque element.",
  APPROVED: "Approuve — aucune action requise.",
  CHANGES_REQUESTED: "Des modifications ont ete demandees. L'equipe travaille dessus.",
  REVISED: "Le document a ete revise suite a vos retours — revisez les changements.",

  // Deliverable statuses
  IN_REVIEW: "En attente de votre validation — revisez et approuvez ou demandez des modifications.",
  DELIVERED: "Livre — le livrable est finalise et disponible.",

  // Strategy item statuses
  PENDING: "Cet element est en attente de votre decision.",
  REJECTED: "Cet element a ete rejete.",
  MODIFIED: "Cet element a ete modifie suite a vos retours.",

  // Event statuses
  PREPARATION: "L'evenement est en cours de preparation.",
  ACTIVE: "L'evenement est en cours.",
  REVIEW: "L'evenement est en phase de revision.",
  COMPLETED: "L'evenement est termine.",
  ARCHIVED: "L'evenement est archive.",
};

// Labels francais pour les types de livrables
export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  EMAIL_TEMPLATE: "Template email",
  LANDING_PAGE: "Page d'atterrissage",
  SOCIAL_POST: "Publication social media",
  SCRIPT: "Script",
  DOCUMENT: "Document",
  AD_CREATIVE: "Creation publicitaire",
  OTHER: "Autre",
};

export function getDeliverableTypeLabel(type: string): string {
  return DELIVERABLE_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

// Messages empty states guidants
export const EMPTY_STATES = {
  strategies: {
    title: "Aucune strategie pour le moment",
    description:
      "Les strategies apparaitront ici des que l'equipe les partagera pour revision. Vous recevrez une notification.",
  },
  deliverables: {
    title: "Aucun livrable pour le moment",
    description:
      "Les livrables apparaitront ici des que l'equipe les preparera. Vous recevrez une notification.",
  },
  timeline: {
    title: "Aucune activite pour le moment",
    description:
      "L'historique des actions sur vos strategies et livrables s'affichera ici au fil du projet.",
  },
  dashboard_todo: {
    title: "Tout est a jour",
    description: "Aucune action requise de votre part pour le moment.",
  },
} as const;
