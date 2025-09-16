// Simpler SpeechReader with clear function separation
class SpeechReader {
  private static instance: SpeechReader;
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private playingButton: HTMLElement | null = null;

  private constructor() {
    this.synthesis = window.speechSynthesis;
    document.addEventListener('click', (e) => this.handleClick(e as MouseEvent));
  }

  public static init() {
    if (!SpeechReader.instance) SpeechReader.instance = new SpeechReader();
    return SpeechReader.instance;
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as Element;
    const container = this.getSpeechButton(target);
    if (!container) return;
    e.preventDefault();

    const source = this.getSpeechSource(target, container);
    const { language, text } = this.extractLanguageAndText(source);
    if (!text) return;

    if (this.synthesis.speaking && this.playingButton === container) {
      this.stop();
      return;
    }
    this.play(text, container, source, language);
  }

  private getSpeechButton(target: Element): HTMLElement | null {
    return target.closest('.speech-reader-button') as HTMLElement | null;
  }

  private getSpeechSource(target: Element, container: HTMLElement): HTMLElement {
    return (target.closest('a') as HTMLElement | null) || (container.querySelector('a') as HTMLElement | null) || container;
  }

  private extractLanguageAndText(source: HTMLElement): { language: string, text: string | null } {
    const raw = this.extractText(source);
    if (raw && raw.includes(';')) {
      const [langPart, ...textParts] = raw.split(';');
      return {
        language: langPart.trim() || 'en-GB',
        text: textParts.join(';').trim()
      };
    }
    return {
      language: this.extractLanguage(source),
      text: raw
    };
  }

  private extractText(el: HTMLElement): string | null {
    const ds = el.getAttribute('data-speech');
    if (ds && ds.trim().length) return ds.trim();
    const al = el.getAttribute('aria-label');
    if (al && al.trim().length) return al.trim();
    const href = el.getAttribute && el.getAttribute('href');
    if (href && href.trim().length) {
      try {
        const decoded = href.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        if (decoded.indexOf('<') !== -1) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(decoded, 'text/html');
          const txt = doc.body.textContent || '';
          if (txt.trim().length) return txt.trim();
        }
      } catch (e) {}
      return href.trim();
    }
    const txt = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim())
      .filter(Boolean)
      .join(' ');
    return txt || null;
  }

  private extractLanguage(source: HTMLElement): string {
    return source.getAttribute('data-language') || 'en-GB';
  }

  private play(text: string, container: HTMLElement, source: HTMLElement, language: string) {
    this.stop();
    this.utterance = new SpeechSynthesisUtterance(text);
    const lang = source.getAttribute('data-speech-lang') || container.getAttribute('data-speech-lang');
    this.utterance.lang = lang || language;
    this.utterance.onend = () => this.onEnd();
    this.utterance.onerror = () => this.onEnd();
    this.synthesis.speak(this.utterance);
    this.playingButton = container;
    container.classList.add('is-speaking');
  }

  private stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    if (this.playingButton) {
      this.playingButton.classList.remove('is-speaking');
      this.playingButton = null;
    }
    this.utterance = null;
  }

  private onEnd() {
    if (this.playingButton) this.playingButton.classList.remove('is-speaking');
    this.playingButton = null;
    this.utterance = null;
  }
}

export default SpeechReader;
