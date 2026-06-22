"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

interface MenuItem {
  href: string;
  label: string;
}

interface SiteMenuProps {
  items: MenuItem[];
  label?: string;
  children?: React.ReactNode;
}

export default function SiteMenu({ items, label = "Open menu", children }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <span aria-hidden="true" className="text-lg leading-none">☰</span>
      </button>

      {open ? (
        <nav
          id={menuId}
          aria-label="Main navigation"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg z-20"
        >
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {children ? <li className="pt-1 border-t border-gray-100">{children}</li> : null}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}