// Domain-specific types for Speech
// Move any Speech-specific interfaces, enums, or types here as you refactor.

export interface SpeechSegment {
  text: string;
  start: number;
  end: number;
}
