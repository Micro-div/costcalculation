import { Brand } from "./Brand";
import { ShareButton } from "@/components/ui/ShareButton";

const linkClass = "text-white/60 transition-colors duration-200 hover:text-white";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Services", href: "#services" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Why CostCalc", href: "#why-costcalc" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help", href: "#" },{ label: "Privacy", href: "#" },  { label: "Terms", href: "#" },
      
    
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-white">
      <style>{`
        @keyframes wave-move { from { transform: translateX(0); } to { transform: translateX(-120px); } }
        @keyframes drop-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
        @keyframes ball-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        /* Speed matched to 2sstore.com.pk footer waves: 10s / 8s / 6s */
      `}</style>

      <svg viewBox="0 0 120 28" className="-mb-px block w-full" aria-hidden="true">
        <defs>
          <path
            id="wave"
            d="M 0,10 C 30,10 30,15 60,15 90,15 90,10 120,10 150,10 150,15 180,15 210,15 210,10 240,10 v 28 h -240 z"
          />
        </defs>

        <use href="#wave" x="0" y="-2" className="fill-black/35 animate-[wave-move_10s_linear_infinite] will-change-transform motion-reduce:animate-none" />
        <use href="#wave" x="0" y="0" className="fill-black/60 animate-[wave-move_8s_linear_infinite_reverse] will-change-transform motion-reduce:animate-none" />
        <g>
          <circle cx="20" cy="2" r="1.8" className="fill-black animate-[drop-float_3s_ease-in-out_infinite] will-change-transform motion-reduce:animate-none" />
          <circle cx="25" cy="2.5" r="1.5" className="fill-black/60 animate-[drop-float_3s_ease-in-out_infinite] [animation-delay:-1.3s] will-change-transform motion-reduce:animate-none" />
          <circle cx="16" cy="2.8" r="1.2" className="fill-black/35 animate-[drop-float_3s_ease-in-out_infinite] [animation-delay:-2.6s] will-change-transform motion-reduce:animate-none" />
          <use href="#wave" x="0" y="1" className="fill-black animate-[wave-move_6s_linear_infinite] will-change-transform motion-reduce:animate-none" />
        </g>
      </svg>

      <div className="bg-black text-white">
        <div className="mx-auto max-w-[1200px] px-5 pb-6 sm:px-7">
          <div className="grid grid-cols-3 items-start gap-x-3 gap-y-6 sm:gap-x-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-10">
            <div className="col-span-3 max-w-sm lg:col-span-1">
              <div className="mb-3 [&_img]:h-12 [&_img]:w-auto [&_img]:brightness-0 [&_img]:invert sm:[&_img]:h-14 lg:[&_img]:h-16">
                <Brand />
              </div>
              <p className="mt-2 text-sm leading-5 text-white/60">
                Get a clearer idea of what your project might cost.
              </p>
              <div className="mt-3 flex flex-col items-start gap-3">
                {/* <a href="mailto:hello@costcalc.com" className={`inline-flex min-h-[44px] items-center text-sm ${linkClass}`}>
                  hello@costcalc.com
                </a> */}
                <ShareButton />
              </div>
            </div>

            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-medium text-white sm:text-sm">{column.title}</h2>
                <ul className="mt-3 space-y-2 break-words text-xs sm:text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className={`inline-flex min-h-[44px] items-center ${linkClass}`}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-1 border-t border-white/15 pt-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 CostCalc. All rights reserved.</p>
            <p>Estimates are approximate and not a final quotation.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}