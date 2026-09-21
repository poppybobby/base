import { useState } from 'react'

export function Gallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="gallery">
      <figure className="gallery-main">
        <img src={current} alt={alt} />
      </figure>
      {images.length > 1 ? (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === active ? 'thumb on' : 'thumb'}
              onClick={() => setActive(i)}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
