import Image from "next/image";

export function Brand() {
  return (
    <a
      href="#top"
      className="group inline-flex items-center gap-2.5"
      aria-label="CostCalc home"
    >
      <Image
        src="/logo.png"
        alt="CostCalc logo"
        width={140}
        height={36}
        priority
        className="h-60 w-auto"
      />
    </a>
  );
}
