'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhotoIcon,
  Cog6ToothIcon,
  UsersIcon,
  BuildingLibraryIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon,
  QueueListIcon,
  CircleStackIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '@/store/hooks';
import { selectUserRole } from '@/store/slices/authSlice';
import { UserRole } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: UserRole[];
  children?: NavItem[];
}

// Helper to check if user role matches allowed roles (case-insensitive)
const roleMatches = (userRole: string | UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  const normalizedUserRole = String(userRole).toLowerCase();
  return allowedRoles.some(role => String(role).toLowerCase() === normalizedUserRole);
};

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Members',
    href: '/directory',
    icon: UsersIcon,
    roles: [UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: ClipboardDocumentCheckIcon,
    roles: [UserRole.STAFF, UserRole.ADMIN],
    children: [
      {
        name: 'Overview',
        href: '/attendance',
        icon: ChartBarIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Check-in',
        href: '/attendance/checkin',
        icon: ClipboardDocumentCheckIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Reports',
        href: '/attendance/reports',
        icon: DocumentChartBarIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
    ],
  },
  {
    name: 'Ministries',
    href: '/ministries',
    icon: UserGroupIcon,
    roles: [UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Services',
    href: '/services',
    icon: CalendarIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Sermons',
    href: '/sermons',
    icon: DocumentTextIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Media',
    href: '/media',
    icon: PhotoIcon,
    roles: [UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Email',
    href: '/staff/emails',
    icon: EnvelopeIcon,
    roles: [UserRole.STAFF, UserRole.ADMIN],
    children: [
      {
        name: 'Email Center',
        href: '/staff/emails',
        icon: EnvelopeIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Templates',
        href: '/staff/email-templates',
        icon: DocumentTextIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
    ],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    roles: [UserRole.STAFF, UserRole.ADMIN],
    children: [
      {
        name: 'Dashboard',
        href: '/analytics',
        icon: ChartBarIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: DocumentChartBarIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
    ],
  },
  {
    name: 'Staff Tools',
    href: '/staff',
    icon: Cog6ToothIcon,
    roles: [UserRole.STAFF, UserRole.ADMIN],
    children: [
      {
        name: 'Manage Ministries',
        href: '/staff/ministries',
        icon: UserGroupIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Manage Sermons',
        href: '/staff/sermons',
        icon: DocumentTextIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Manage Services',
        href: '/staff/services',
        icon: CalendarIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
      {
        name: 'Manage Media',
        href: '/staff/media',
        icon: PhotoIcon,
        roles: [UserRole.STAFF, UserRole.ADMIN],
      },
    ],
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Cog6ToothIcon,
    roles: [UserRole.ADMIN],
    children: [
      {
        name: 'User Management',
        href: '/admin/users',
        icon: UsersIcon,
        roles: [UserRole.ADMIN],
      },
      {
        name: 'Departments',
        href: '/admin/departments',
        icon: BuildingLibraryIcon,
        roles: [UserRole.ADMIN],
      },
      {
        name: 'Settings',
        href: '/admin/settings',
        icon: Cog6ToothIcon,
        roles: [UserRole.ADMIN],
      },
      {
        name: 'Queue Management',
        href: '/admin/queue',
        icon: QueueListIcon,
        roles: [UserRole.ADMIN],
      },
      {
        name: 'Cache Management',
        href: '/admin/cache',
        icon: CircleStackIcon,
        roles: [UserRole.ADMIN],
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const userRole = useAppSelector(selectUserRole);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNav = navigationItems.filter((item) =>
    roleMatches(userRole, item.roles)
  );

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/staff' || pathname === '/dashboard/admin';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return false;
  };

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <BuildingLibraryIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-xl font-bold">Church CMS</h1>
        </div>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          const active = isParentActive(item);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between px-6 py-3 transition-colors ${
                      active
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="bg-gray-950">
                      {item.children
                        ?.filter((child) => roleMatches(userRole, child.roles))
                        .map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center space-x-3 pl-12 pr-6 py-2.5 transition-colors ${
                                childActive
                                  ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span className="text-sm">{child.name}</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          Church Management System
        </p>
      </div>
    </div>
  );
};
