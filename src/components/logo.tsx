import { cn } from '@/src/lib/utils';

export const Logo = ({
    className,
    uniColor,
}: {
    className?: string;
    uniColor?: boolean;
}) => {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-8 w-auto', className)}
        >
            {/* Map Pin */}
            <path
                d="M60 10
           C35 10 20 30 20 50
           C20 78 60 110 60 110
           C60 110 100 78 100 50
           C100 30 85 10 60 10 Z"
                fill={uniColor ? 'currentColor' : '#FACC15'}
            />

            {/* Road */}
            <path
                d="M60 30 V85"
                stroke={uniColor ? 'currentColor' : '#1F2937'}
                strokeWidth="10"
                strokeLinecap="round"
            />

            {/* Road dashed line */}
            <path
                d="M60 30 V85"
                stroke={uniColor ? 'currentColor' : '#FACC15'}
                strokeWidth="4"
                strokeDasharray="8 8"
                strokeLinecap="round"
            />
        </svg>
    );
};
