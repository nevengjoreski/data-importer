import React from 'react';
import { Search, Bell, Settings, Menu, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const Header: React.FC = () => {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5 text-gray-500" />
                </Button>

                <div className="flex items-center text-sm text-gray-500 gap-2">
                    <span className="hidden md:inline">Dashboard</span>
                    <span className="hidden md:inline">/</span>
                    <span className="font-medium text-gray-900">CMS</span>
                </div>

                <div className="max-w-md w-full ml-4 hidden md:block relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="ghost" size="icon" className="text-gray-500">
                    <Sun className="h-5 w-5" />
                </Button>

                <div className="relative">
                    <Button variant="ghost" size="icon" className="text-gray-500">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                        3
                    </span>
                </div>

                <Button variant="ghost" size="icon" className="text-gray-500">
                    <Settings className="h-5 w-5" />
                </Button>

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3 pl-1">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-900">John Doe</div>
                        <div className="text-xs text-gray-500">Administrator</div>
                    </div>
                </div>
            </div>
        </header>
    );
};
