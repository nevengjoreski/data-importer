import React from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Building2,
    FolderOpen,
    ShoppingBag,
    ShoppingCart,
    Users,
    Wallet,
    FileText,
    CreditCard,
    Settings,
    HelpCircle,
    ChevronDown,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
    activeTab: 'dashboard' | 'history';
    onTabChange: (tab: 'dashboard' | 'history') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const NavItem = ({
        icon: Icon,
        label,
        isActive = false,
        hasSubmenu = false,
        badge = null,
        onClick
    }: {
        icon: any,
        label: string,
        isActive?: boolean,
        hasSubmenu?: boolean,
        badge?: number | null,
        onClick?: () => void
    }) => (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1",
                isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {badge && (
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    )}>
                        {badge}
                    </span>
                )}
                {hasSubmenu && <ChevronDown className="h-3 w-3 text-gray-400" />}
            </div>
        </button>
    );

    const SectionHeader = ({ label }: { label: string }) => (
        <div className="px-3 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
        </div>
    );

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0">
            <div className="p-6 flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                    <Zap className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                <span className="font-bold text-lg text-gray-900">CMSFullForm</span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
                <SectionHeader label="Overview" />
                <NavItem
                    icon={LayoutDashboard}
                    label="Dashboard"
                    isActive={activeTab === 'dashboard'}
                    badge={3}
                    hasSubmenu
                    onClick={() => onTabChange('dashboard')}
                />
                <NavItem icon={BarChart3} label="Analytics" hasSubmenu />
                <NavItem icon={Building2} label="Organization" />
                <NavItem
                    icon={FolderOpen}
                    label="Projects"
                    badge={12}
                    isActive={activeTab === 'history'}
                    onClick={() => onTabChange('history')}
                />

                <SectionHeader label="E-Commerce" />
                <NavItem icon={ShoppingBag} label="Products" hasSubmenu />
                <NavItem icon={ShoppingCart} label="Orders" badge={5} hasSubmenu />
                <NavItem icon={Users} label="Customers" hasSubmenu />

                <SectionHeader label="Finance" />
                <NavItem icon={Wallet} label="Transactions" hasSubmenu />
                <NavItem icon={FileText} label="Invoices" badge={2} />
                <NavItem icon={CreditCard} label="Payments" hasSubmenu />
            </div>

            <div className="p-3 border-t border-gray-200">
                <NavItem icon={Settings} label="Settings" />
                <NavItem icon={HelpCircle} label="Help" />
            </div>
        </div>
    );
};
