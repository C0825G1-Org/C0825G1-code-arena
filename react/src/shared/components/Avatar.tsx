import React from 'react';

interface AvatarProps {
    src?: string | null;
    userId?: number | string;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
    className?: string;
    borderColor?: string;
    showOnlineStatus?: boolean;
    onClick?: (e: React.MouseEvent) => void;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    userId,
    alt = 'Avatar',
    size = 'md',
    className = '',
    borderColor = 'border-blue-500/50',
    showOnlineStatus = false,
    onClick
}) => {
    // Definining standard sizes
    const sizeMap: Record<string, string> = {
        'xs': 'w-6 h-6',
        'sm': 'w-8 h-8',
        'md': 'w-10 h-10',
        'lg': 'w-16 h-16',
        'xl': 'w-20 h-20',
        '2xl': 'w-28 h-28',
    };

    const sizeClass = typeof size === 'string' ? (sizeMap[size] || sizeMap['md']) : '';
    const customStyle = typeof size === 'number' ? { width: size, height: size } : {};

    const fallbackUrl = `https://i.pravatar.cc/150?u=${userId || 1}`;
    const imageSrc = src || fallbackUrl;

    return (
        <div
            className={`relative flex-shrink-0 rounded-full ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all' : ''} ${className}`}
            onClick={onClick}
            style={customStyle}
        >
            <img
                src={imageSrc}
                alt={alt}
                className={`${sizeClass} rounded-full object-cover border-2 ${borderColor} shadow-sm`}
                style={customStyle}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                    }
                }}
            />
            {showOnlineStatus && (
                <span
                    className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"
                    title="Online"
                ></span>
            )}
        </div>
    );
};
