import { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import { navbarLinks } from "../constants";
import { cn } from "../utils/cn";
import PropTypes from "prop-types";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-[100] flex h-full flex-col overflow-x-hidden bg-slate-900 border-r border-slate-800 [transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1)]",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0",
            )}
        >
            <div className="flex gap-x-3 p-4 items-center border-b border-slate-800">
                {!collapsed && (
                    <h2 className="text-xl font-bold text-white">Fitness Tracker</h2>
                )}
            </div>
            <div className="flex w-full flex-col gap-y-1 overflow-y-auto overflow-x-hidden p-2 [scrollbar-width:_thin]">
                {navbarLinks.map((navbarLink) => (
                    <nav
                        key={navbarLink.title}
                        className={cn("sidebar-group", collapsed && "md:items-center")}
                    >
                        {!collapsed && (
                            <p className="sidebar-group-title text-slate-400 text-xs uppercase tracking-wider mt-4 mb-2 px-3">
                                {navbarLink.title}
                            </p>
                        )}
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={({ isActive }) => cn(
                                    "sidebar-item px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
                                    isActive && "bg-slate-800 text-white",
                                    collapsed && "md:w-[50px] md:justify-center"
                                )}
                            >
                                <link.icon
                                    size={20}
                                    className="flex-shrink-0"
                                />
                                {!collapsed && (
                                    <p className="whitespace-nowrap ml-3">
                                        {link.label}
                                    </p>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};

export default Sidebar;