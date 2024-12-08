"use client";
import { Fragment } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  Menu,
  Transition,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navigation = {
    products: [{ name: "All Products", href: "/products/all" }],

    community: [
      { name: "Forum", href: "/forum" },
      { name: "Inbox", href: "/inbox" },
    ],
  };

  return (
    <nav className="bg-white shadow dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              {/* <Link href="/main" className="font-bold text-xl"> */}
              {/*   Parfumelier */}
              {/* </Link> */}
              <Link href={"/main"}>
                <Image
                  src="/logo/Parfummelier_Logo.webp"
                  alt="Parfummelier Logo"
                  width={150}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Primary Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/quiz"
                className="text-gray-900 dark:text-white hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Take a quiz
              </Link>

              {/* Products Dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="text-gray-900 dark:text-white hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                  Products
                  <ChevronDown className="ml-1 h-4 w-4" />
                </MenuButton>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {navigation.products.map((item) => (
                      <MenuItem key={item.name}>
                        {({ focus }) => (
                          <Link
                            href={item.href}
                            className={`${
                              focus ? "bg-gray-100 dark:bg-gray-600" : ""
                            } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                          >
                            {item.name}
                          </Link>
                        )}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Transition>
              </Menu>

              {/* Community Dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="text-gray-900 dark:text-white hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                  Community
                  <ChevronDown className="ml-1 h-4 w-4" />
                </MenuButton>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {navigation.community.map((item) => (
                      <MenuItem key={item.name}>
                        {({ focus }) => (
                          <Link
                            href={item.href}
                            className={`${
                              focus ? "bg-gray-100 dark:bg-gray-600" : ""
                            } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                          >
                            {item.name}
                          </Link>
                        )}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* User menu */}
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-gray-500">
                <Image
                  src="/profile-picture/gender-neutral.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium">
                  Welcome, {user?.firstName || "Guest"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </MenuButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        href="/user-profile"
                        className={`${
                          focus ? "bg-gray-100 dark:bg-gray-600" : ""
                        } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                      >
                        Your Profile
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => logout()}
                        className={`${
                          focus ? "bg-gray-100 dark:bg-gray-600" : ""
                        } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                      >
                        Sign Out
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
