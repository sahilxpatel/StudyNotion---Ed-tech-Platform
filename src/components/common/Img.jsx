import React, { useMemo, useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'

const createFallbackImage = (label) => {
    const safeLabel = (label || 'Course')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .slice(0, 36)

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${safeLabel}">
            <defs>
                <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#1d4ed8"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                </linearGradient>
                <linearGradient id="accent" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#facc15"/>
                    <stop offset="100%" stop-color="#fb7185"/>
                </linearGradient>
            </defs>
            <rect width="1200" height="675" rx="36" fill="url(#bg)" />
            <circle cx="980" cy="140" r="170" fill="url(#accent)" opacity="0.16" />
            <circle cx="150" cy="560" r="220" fill="#22c55e" opacity="0.14" />
            <rect x="74" y="74" width="1052" height="527" rx="30" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4" />
            <text x="92" y="250" fill="#e2e8f0" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">StudyNotion</text>
            <text x="92" y="355" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700">${safeLabel}</text>
            <text x="92" y="430" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="28">Demo course thumbnail</text>
            <rect x="92" y="485" width="260" height="20" rx="10" fill="#facc15" opacity="0.85" />
        </svg>
    `

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const Img = ({ src, className, alt, fallbackText }) => {
        const [hasError, setHasError] = useState(false)
        const fallbackSrc = useMemo(() => createFallbackImage(fallbackText || alt), [fallbackText, alt])
        const imageSrc = hasError || !src ? fallbackSrc : src

        return (
                <LazyLoadImage
                        className={`${className} `}
                        alt={alt || 'Image'}
                        effect='blur'
                        src={imageSrc}
                        onError={() => setHasError(true)}
                />
        )
}


export default Img