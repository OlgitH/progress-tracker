export interface NavItem {
  href: string;
  label: string;
  children?: NavItem[];
}

export function getNavItems(year: number): NavItem[] {
  return [
    {
      href: "/social-exchange",
      label: "Social Exchange dashboard",
      children: [{ href: "/social-exchange/new", label: "Log a Social Exchange" }],
    },
    {
      href: "/my-goals",
      label: "My Studio goals",
      children: [
        { href: "/goals", label: "Edit goals" },
        { href: "/new", label: "Post an update" },
        {
          href: `/progress/${year}`,
          label: `Progress graph (${year})`,
          children: [{ href: `/api/export/${year}`, label: `Open raw JSON (${year})` }],
        },
      ],
    },
  ];
}
