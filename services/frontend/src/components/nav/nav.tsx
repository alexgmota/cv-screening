'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/chat', label: 'CV Screening Chat' },
  { href: '/cvs', label: 'CV Database' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-6 h-14">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                active
                  ? 'text-blue-600 border-b-2 border-blue-600 h-full flex items-center'
                  : 'text-gray-600 hover:text-gray-900 h-full flex items-center border-b-2 border-transparent'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
