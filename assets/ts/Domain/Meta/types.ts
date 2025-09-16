// Domain-specific types for Meta
// Move any Meta-specific interfaces, enums, or types here as you refactor.

export interface MetaTag {
  name: string;
  content: string;
}

// Link/meta tag attributes
export type LinkAttributes = {
    rel?: string;
    href?: string;
    sizes?: string;
    type?: string;
    media?: string;
    name?: string;
    content?: string;
    property?: string;
};
