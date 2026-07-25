declare module "animejs" {
  interface AnimeParams {
    targets?: unknown;
    duration?: number;
    delay?: number | ((el: Element, i: number) => number);
    easing?: string;
    round?: number;
    loop?: boolean | number;
    direction?: "normal" | "reverse" | "alternate";
    autoplay?: boolean;
    update?: (anim: AnimeInstance) => void;
    complete?: (anim: AnimeInstance) => void;
    [prop: string]: unknown;
  }

  interface AnimeInstance {
    play(): void;
    pause(): void;
    restart(): void;
    seek(time: number): void;
    finished: Promise<void>;
  }

  function anime(params: AnimeParams): AnimeInstance;
  namespace anime {
    function timeline(params?: AnimeParams): AnimeInstance;
    function stagger(value: number | string, options?: object): (el: Element, i: number) => number;
    function remove(targets: unknown): void;
    const version: string;
  }

  export = anime;
}
