"use client";

import React from "react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { Menu, SquareChevronRight } from "lucide-react";

function SideBarTrigger() {
  const { toggleSidebar, open } = useSidebar();
  return (
    <button onClick={toggleSidebar} className="transition-colors duration-200">
      <span className="relative block h-6 w-6">
        <Menu
          className={`absolute inset-0 h-6 w-6 transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
        />
        <SquareChevronRight
          className={`absolute inset-0 h-6 w-6 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
    </button>
  );
}

export default SideBarTrigger;
