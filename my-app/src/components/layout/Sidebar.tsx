'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectUserRole } from '@/store/slices/authSlice';
import { UserRole } from '@/types';

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  roles: UserRole[];
  children?: SubItem[];
}

// Helper to check if user role matches allowed roles (case-insensitive)
const roleMatches = (userRole: string | UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  const normalizedUserRole = String(userRole).toLowerCase();
  return allowedRoles.some(role => String(role).toLowerCase() === normalizedUserRole);
};

const navigationItems: NavItem[] = [
  {
    name: 'People',
    href: '/people',
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
    children: [
      { name: 'Check-in', href: '/people/checkin' },
      { name: 'History', href: '/people/history' },
    ],
  },
  {
    name: 'Message',
    href: '/message',
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
    children: [
      { name: 'Email', href: '/message/email' },
      { name: 'Text', href: '/message/text' },
    ],
  },
  {
    name: 'Notepad',
    href: '/notepad',
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
    children: [
      { name: 'Notes', href: '/notepad/notes' },
      { name: 'History', href: '/notepad/history' },
    ],
  },
  {
    name: 'Ministries',
    href: '/ministries',
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const userRole = useAppSelector(selectUserRole);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNav = navigationItems.filter((item) =>
    roleMatches(userRole, item.roles)
  );

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="w-64 bg-gray-800 min-h-screen text-white flex flex-col">
      {/* Dashboard Header Section */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-white tracking-wide">Dashboard</h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {filteredNav.map((item) => {
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);

          return (
            <div key={item.name} className="mb-1">
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full text-left block px-6 py-3.5 transition-colors ${
                      active
                        ? 'bg-blue-600/20 text-white border-l-4 border-blue-500'
                        : 'text-gray-300 hover:bg-gray-700/50 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="font-medium text-lg">{item.name}</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-6">
                      {item.children?.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-6 py-2.5 transition-colors ${
                              childActive
                                ? 'text-white bg-blue-600/30'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                            }`}
                          >
                            <span className="text-base">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`block px-6 py-3.5 transition-colors ${
                    active
                      ? 'bg-blue-600/20 text-white border-l-4 border-blue-500'
                      : 'text-gray-300 hover:bg-gray-700/50 border-l-4 border-transparent'
                  }`}
                >
                  <span className="font-medium text-lg">{item.name}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Church Management System
        </p>
      </div>
    </div>
  );
};
