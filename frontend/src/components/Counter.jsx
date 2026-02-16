import React, { useEffect, useRef } from 'react';
import { useInView, animate } from 'framer-motion';
import { Typography } from '@mui/material';

export const Counter = ({
    value,
    suffix = '',
    duration = 2,
    sx = {}
}) => {
    const nodeRef = useRef();
    const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            const node = nodeRef.current;
            const controls = animate(0, value, {
                duration,
                onUpdate(value) {
                    node.textContent = Math.round(value).toLocaleString() + suffix;
                },
                ease: "easeOut"
            });

            return () => controls.stop();
        }
    }, [isInView, value, suffix, duration]);

    return (
        <Typography
            ref={nodeRef}
            variant="h3"
            fontWeight={800}
            sx={{
                color: '#f3bfec',
                mb: 1,
                textShadow: '0 0 20px rgba(243, 191, 236, 0.5)',
                ...sx
            }}
        >
            0{suffix}
        </Typography>
    );
};

export default Counter;
