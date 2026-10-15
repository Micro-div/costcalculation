"use client";

import React from "react";
import styled from "styled-components";

const StyledWrapper = styled.div`
  .share-wrap {
    height: 3.5em;
    width: 13em;
    border: none;
    border-radius: 40px;
    background-color: #1f2124; /* dark grey outer background */
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .share-wrap .label {
    z-index: 1;
    display: inline-block;
    background-color: #3f444a; /* slightly dark inner pill */
    height: 2.5em;
    width: 10em;
    border-radius: 25px;
    color: #ffffff;
    line-height: 40px;
    text-align: center;
    font-size: 14px;
    letter-spacing: 2px;
    font-weight: 500;
    transition: all 0.5s ease;
    text-transform: uppercase;
  }

  .share-wrap .container {
    z-index: -1;
    width: 0;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
  }

  /* The hover reveal: the pill collapses and the icon links slide in. */
  .share-wrap:hover .label,
  .share-wrap:focus-within .label {
    width: 0;
    opacity: 0;
  }

  .share-wrap:hover .container,
  .share-wrap:focus-within .container {
    z-index: 2;
    width: 100%;
  }

  .share-wrap .container a {
    display: grid;
    place-items: center;
    padding: 0 8px;
    color: #ffffff;
    opacity: 0;
    transform: scale(0.6);
    transition: all 0.3s ease;
  }

  .share-wrap .container svg {
    width: 22px;
    height: 22px;
  }

  /* Icons fade + pop in one after another. */
  .share-wrap:hover .container a,
  .share-wrap:focus-within .container a {
    opacity: 1;
    transform: scale(1);
  }

  .share-wrap .container a:nth-child(1) {
    transition-delay: 0.05s;
  }
  .share-wrap .container a:nth-child(2) {
    transition-delay: 0.15s;
  }
  .share-wrap .container a:nth-child(3) {
    transition-delay: 0.25s;
  }

  .share-wrap .container a:hover,
  .share-wrap .container a:focus-visible {
    color: #d9dbde;
    transform: scale(1.2) translateY(-2px);
  }

  .share-wrap .container a:focus-visible {
    outline: 2px solid #d9dbde;
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

/* Brand glyphs drawn inline so no icon package is needed. */
const GitHubIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
  </svg>
);

const VercelIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3 23 21H1L12 3Z" />
  </svg>
);

const XIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const links = [
  {
    label: "GitHub",
    href: "https://github.com/Micro-div/costcalculation",
    icon: GitHubIcon,
  },
  {
    label: "Vercel",
    href: "https://vercel.com/micro-div/costcalculation",
    icon: VercelIcon,
  },
  {
    label: "X (Twitter)",
    // Scrolls up to the hero section when clicked.
    href: "#top",
    icon: XIcon,
    scrollToTop: true,
  },
];

const scrollToHero = (event: React.MouseEvent<HTMLAnchorElement>) => {
  if (typeof window === "undefined") return;
  event.preventDefault();
  const hero =
    document.getElementById("top") ?? document.querySelector("main");
  if (hero) {
    hero.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // Keep the URL clean (avoid leaving "#top" in the address bar).
  window.history.replaceState(null, "", window.location.pathname);
};

export function ShareButton() {
  return (
    <StyledWrapper>
      <div className="share-wrap">
        <span className="label">Share</span>
        <div className="container">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.scrollToTop ? undefined : "_blank"}
              rel={link.scrollToTop ? undefined : "noopener noreferrer"}
              onClick={link.scrollToTop ? scrollToHero : undefined}
              aria-label={link.label}
              title={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </StyledWrapper>
  );
}
