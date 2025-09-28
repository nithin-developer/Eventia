import { IconLayoutDashboard, IconShieldLock } from "@tabler/icons-react";
import {
  Users,
  Calendar,
  Activity,
  UserCog,
  Settings,
  
} from "lucide-react";

import { IconPalette, IconTool, IconLock } from "@tabler/icons-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    full_name: "Nithin Kumar K",
    email: "nithinkumark6364@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Eventia",
      logo: "/src/assets/vvce.png",
      plan: "Event Management System",
    },
  ],
  navGroups: [
    {
      title: "Eventia",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: IconLayoutDashboard,
        },
        { title: "Tasks", url: "/tasks", icon: Activity },
        { title: "Vendors", url: "/vendors", icon: Users },
        { title: "Resources", url: "/resources", icon: Calendar },
        { title: "Volunteers", url: "/volunteers", icon: Users },
        { title: "Speakers", url: "/speakers", icon: UserCog },
        { title: "Agenda", url: "/agenda", icon: Calendar },
        // { title: "Feedback", url: "/feedback", icon: Activity },
        { title: "Certificates", url: "/certificates", icon: IconShieldLock },
        // { title: "Gallery", url: "/gallery", icon: Calendar },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Settings",
          icon: Settings,
          roles: ["super_admin", "admin", "trainer"],
          items: [
            {
              title: "Account",
              url: "/settings/account",
              icon: IconTool,
              roles: ["super_admin", "admin", "trainer"],
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
              icon: IconPalette,
              roles: ["super_admin", "admin", "trainer"],
            },
            {
              title: "Security",
              url: "/settings/security",
              icon: IconLock,
              roles: ["super_admin", "admin", "trainer"],
            },
            {
              title: "2-FA Authentication",
              url: "/settings/two-factor-authentication",
              icon: IconShieldLock,
              roles: ["super_admin", "admin", "trainer"],
            },
          ],
        },
      ],
    },
  ],
};
