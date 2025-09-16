// Domain-specific types for Material
// Move any Material-specific interfaces, enums, or types here as you refactor.

export interface MaterialComponent {
  name: string;
  version: string;
}

// Material enhancement options
export type Options = {
    selector?: string;
    rippleClass?: string;
    rippleColor?: string;
    keyboard?: boolean;
};
