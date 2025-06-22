"use client";

import React from "react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { HiOutlineMenuAlt4 } from "react-icons/hi";

function SideBarTrigger() {
  const { toggleSidebar } = useSidebar();
  return <HiOutlineMenuAlt4 onClick={toggleSidebar} className="h-6 w-6" />;
}

export default SideBarTrigger;
