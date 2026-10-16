declare module "sheryjs" {
  interface MakeMagnetOptions {
    ease?: string;
    duration?: number;
  }

  interface Shery {
    makeMagnet(element: string, opts?: MakeMagnetOptions): void;
  }

  const Shery: Shery;
  export default Shery;
}
