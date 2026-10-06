// The existing 3:2 Atlas shell contains immutable artwork with its own aspect ratio.
// Mirrors object-fit: contain; normalized source coordinates never include letterboxing.
export function artworkFramePoint(x, y, frameWidth, frameHeight, artworkSize = [1536, 1024]) {
    const [width, height] = artworkSize;
    const scale = Math.min(frameWidth / width, frameHeight / height);
    const renderedWidth = width * scale, renderedHeight = height * scale;
    return {x: (frameWidth - renderedWidth) / 2 + x * renderedWidth,
        y: (frameHeight - renderedHeight) / 2 + y * renderedHeight};
}
