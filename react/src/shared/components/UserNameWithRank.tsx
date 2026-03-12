import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getRankByRating } from '../../features/user/shared/utils/rankUtils';

interface Props {
    username: string;
    globalRating?: number;
    className?: string;
}

const UserNameWithRank: React.FC<Props> = ({ username, globalRating, className = '' }) => {
    const tier = getRankByRating(globalRating || 0);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const badgeRef = useRef<HTMLSpanElement>(null);

    const showTooltip = () => {
        if (badgeRef.current) {
            const rect = badgeRef.current.getBoundingClientRect();
            setTooltipPos({
                x: rect.left + rect.width / 2,
                y: rect.top - 8,
            });
        }
    };

    const hideTooltip = () => setTooltipPos(null);

    // Hiệu ứng glow qua inline style vì tailwind không hỗ trợ dynamic drop-shadow
    const iconStyle: React.CSSProperties = {
        filter: `drop-shadow(0 0 6px ${tier.glowColor}) drop-shadow(0 0 12px ${tier.glowColor})`,
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '16px',
        lineHeight: 1,
        cursor: 'default',
    };

    const tooltipContent = tooltipPos ? ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: 'translate(-50%, -100%)',
                zIndex: 99999,
                pointerEvents: 'none',
            }}
        >
            <div className={`px-2.5 py-1.5 ${tier.badgeBg} border border-slate-600 text-xs font-medium rounded-lg shadow-2xl whitespace-nowrap backdrop-blur-sm`}>
                <span className={tier.color}>
                    {tier.iconEmoji} {tier.name}
                </span>
                <span className="text-slate-400 ml-1">({globalRating || 0} đ)</span>
            </div>
            {/* Arrow */}
            <div className="mx-auto w-fit" style={{ marginTop: '-1px' }}>
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid rgba(100,116,139,0.6)` }} />
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="inline-flex items-center gap-1 relative">
            <span className={`font-semibold transition-colors duration-200 ${tier.color} ${className}`}>
                {username}
            </span>
            <span
                ref={badgeRef}
                style={iconStyle}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                aria-label={tier.name}
            >
                {tier.iconEmoji}
            </span>
            {tooltipContent}
        </div>
    );
};

export default UserNameWithRank;

