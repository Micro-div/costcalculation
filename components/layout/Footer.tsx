import { Brand } from "./Brand";

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

const socials = [
  {
    label: "LinkedIn",
    href: "#",
    path: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 10H5.67v8h2.67v-8ZM7 5.99a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1ZM18.33 13.42c0-2.4-1.28-3.52-2.98-3.52a2.58 2.58 0 0 0-2.32 1.28V10h-2.66v8h2.66v-4.36c0-1.15.22-2.27 1.65-2.27 1.4 0 1.42 1.32 1.42 2.35V18h2.66l-.43-4.58Z",
  },
  {
    label: "X",
    href: "#",
    path: "M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.62L5.38 22H2.24l7.25-8.28L1.8 2h6.4l4.43 6.96L18.9 2Zm-1.1 18h1.73L7.27 3.88H5.42L17.8 20Z",
  },
  {
    label: "GitHub",
    href: "#",
    path: "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.98c.85 0 1.7.11 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.59c0 .27.18.58.69.48A10 10 0 0 0 12 2Z",
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
          <div className="grid grid-cols-2 items-start gap-x-6 gap-y-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-10">
            <div className="col-span-2 max-w-sm lg:col-span-1">
              <div className="[&_img]:h-[170px] [&_img]:w-auto [&_img]:brightness-0 [&_img]:invert">
                <Brand />
              </div>
              <p className="mt-2 text-sm leading-5 text-white/60">
                Get a clearer idea of what your project might cost.
              </p>
              <div className="mt-3 flex items-center gap-4">
                <a href="mailto:hello@costcalc.com" className={`inline-flex min-h-[44px] items-center text-sm ${linkClass}`}>
                  hello@costcalc.com
                </a>
                <span className="flex items-center gap-3">
                  {socials.map((item) => (
                    <a key={item.label} href={item.href} aria-label={item.label} className={`inline-flex min-h-[44px] items-center ${linkClass}`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d={item.path} />
                      </svg>
                    </a>
                  ))}
                </span>
              </div>
            </div>

            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-medium text-white">{column.title}</h2>
                <ul className="mt-3 space-y-2 text-sm">
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