// Domain-specific types for UX
// Move any UX-specific interfaces, enums, or types here as you refactor.

export interface UXEvent {
  type: string;
  payload?: any;
}

// UX Guard options
export type UXGuardOptions = {
    disableTextSelection?: boolean;
    disableContextMenu?: boolean;
};
