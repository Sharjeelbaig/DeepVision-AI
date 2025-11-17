import React from 'react'
import '../styles/components/card.css'

export interface CardProps {
  title?: string
  description?: string
  imageSrc?: string
  imageAlt?: string
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}

/**
 * Simple Card component used in the app.
 * - `title` and `description` render as text blocks.
 * - `imageSrc` renders at the top if provided.
 * - `children` can be used to pass custom actions (buttons, links).
 * Example: <Card title="Hello" description="World" imageSrc="/assets/foo.png"/>
 */
export default function Card({
  title,
  description,
  imageSrc,
  imageAlt,
  className = '',
  onClick,
  children,
}: CardProps) {
  return (
    <div className={`card-container ${className}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt={imageAlt ?? title ?? 'card-image'} className="card-image" />
      ) : null}

      {title ? <div className="card-title">{title}</div> : null}

      {description ? <div className="card-description">{description}</div> : null}

      {children}
    </div>
  )
}
