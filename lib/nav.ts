export interface NavItem {
  href: string;
  label: string;
  children?: NavItem[];
}

export function getNavItems(year: number): NavItem[] {
  return [
    { href: "/", label: "Home" },
    {
      href: "/social-exchange",
      label: "Social Exchange dashboard",
      children: [{ href: "/social-exchange/new", label: "Log a Social Exchange" }],
    },
    { href: "/my-goals", label: "My Studio goals" },
  ];
}
