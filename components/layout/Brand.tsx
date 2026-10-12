import Image from "next/image";

export function Brand() {
  return (
    <Image
      src="/logo.png"
      alt="CostCalc logo"
      width={276}
      height={88}
      priority
      className="h-10 w-auto sm:h-12"
    />
  );
}
