import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getRankByRating, RankType } from '../../features/user/shared/utils/rankUtils';

interface Props {
    username: string;
    globalRating?: number;
    type?: RankType;
    className?: string;
    onClick?: () => void;
}

const UserNameWithRank: React.FC<Props> = ({ username, globalRating, type = 'contest', className = '', onClick }) => {
    const tier = getRankByRating(globalRating || 0, type);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; placement: 'top' | 'bottom' } | null>(null);
    const badgeRef = useRef<HTMLSpanElement>(null);

    const showTooltip = () => {
        if (badgeRef.current) {
            const rect = badgeRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const placement = spaceAbove < 50 ? 'bottom' : 'top';
            
            setTooltipPos({
                x: rect.left + rect.width / 2,
                y: placement === 'top' ? rect.top - 8 : rect.bottom + 8,
                placement
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
                transform: tooltipPos.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                zIndex: 99999,
                pointerEvents: 'none',
            }}
        >
            {/* Arrow for bottom placement */}
            {tooltipPos.placement === 'bottom' && (
                <div className="mx-auto w-fit" style={{ marginBottom: '-1px' }}>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `5px solid rgba(100,116,139,0.8)` }} />
                </div>
            )}
            
            <div className={`px-2.5 py-1.5 ${tier.badgeBg} border border-slate-600 text-xs font-medium rounded-lg shadow-2xl whitespace-nowrap backdrop-blur-sm`}>
                <span className={tier.color}>
                    {tier.iconEmoji} {tier.name}
                </span>
                <span className="text-slate-400 ml-1">({globalRating || 0} đ)</span>
            </div>

            {/* Arrow for top placement */}
            {tooltipPos.placement === 'top' && (
                <div className="mx-auto w-fit" style={{ marginTop: '-1px' }}>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid rgba(100,116,139,0.8)` }} />
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div 
            className={`inline-flex items-center gap-1 relative ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
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

