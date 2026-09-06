export type MunicipalStatus =
    | 'PENDING'
    | 'VERIFIED'
    | 'ONGOING'
    | 'FIXED'
    | 'REJECTED';

export interface MunicipalOfficer {
    id: string;
    name: string;
    role: 'OFFICER' | 'MANAGER';
    activeCases?: number;
    email?: string;
    avatar?: string | null;
}

export interface MunicipalJurisdiction {
    id: string;
    name: string;
    municipalityId: string;
    boundary: {
        type: string;
        coordinates: number[][][] | number[][][][];
    };
}

export interface MunicipalityInfo {
    id: string;
    name: string;
    code?: string;
    headquarters?: string;
}

export interface TriagePotholeItem {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: MunicipalStatus;
    severity: number; // 1 - 5
    priorityScore: number; // 0 - 100
    city?: string | null;
    state?: string | null;
    imageUrl?: string | null;
    assignedOfficerId?: string | null;
    assignedOfficer?: {
        id: string;
        name: string;
    } | null;
    votes?: { id: string }[];
    votesCount?: number;
    comments?: { id: string }[];
    commentsCount?: number;
    createdAt: string;
}

export interface StateTransitionRule {
    allowedNext: MunicipalStatus[];
    requiresReason?: boolean;
    description: string;
}

export const CENTRALIZED_TRANSITION_POLICY: Record<MunicipalStatus, StateTransitionRule> = {
    PENDING: {
        allowedNext: ['VERIFIED', 'REJECTED'],
        requiresReason: false,
        description: 'New hazard report pending review. Verify after inspecting GPS/photo evidence, or reject if invalid.',
    },
    VERIFIED: {
        allowedNext: ['ONGOING', 'REJECTED'],
        requiresReason: false,
        description: 'Confirmed road hazard. Assign to municipal road crew or mark ongoing maintenance.',
    },
    ONGOING: {
        allowedNext: ['FIXED'],
        requiresReason: false,
        description: 'Active repair or contractor dispatch underway. Mark fixed once asphalt resurfacing completes.',
    },
    FIXED: {
        allowedNext: ['PENDING'],
        requiresReason: true,
        description: 'Repair completed. Can be reopened only with justified civic or municipal reason.',
    },
    REJECTED: {
        allowedNext: ['PENDING'],
        requiresReason: true,
        description: 'Defect dismissed or marked duplicate. Can be reopened for reconsideration with explanation.',
    },
};
