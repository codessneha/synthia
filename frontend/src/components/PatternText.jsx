import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPatternText = styled('p')(({ theme }) => ({
    position: 'relative',
    display: 'inline-block',
    fontSize: '7em',
    fontWeight: 700,
    margin: 0,
    textShadow: '0.02em 0.02em 0 #000',

    '&::after': {
        content: 'attr(data-shadow)',
        position: 'absolute',
        top: '8px',
        left: '8px',
        zIndex: -1,
        backgroundSize: '0.05em 0.05em',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        textShadow: 'none',
        backgroundImage: 'linear-gradient(45deg, transparent 45%, white 45%, white 55%, transparent 0)',
        animation: 'shadanim 15s linear infinite',
    },

    '@keyframes shadanim': {
        '0%': {
            backgroundPosition: '100% -100%',
        },
    },

    // Responsive font sizes
    '@media (max-width: 1200px)': {
        fontSize: '8em',
    },
    '@media (max-width: 900px)': {
        fontSize: '6em',
    },
    '@media (max-width: 600px)': {
        fontSize: '4em',
    },
}));

export default function PatternText({
    text = 'Text',
    sx = {},
    ...props
}) {
    return (
        <StyledPatternText
            data-shadow={text}
            sx={sx}
            {...props}
        >
            {text}
        </StyledPatternText>
    );
}