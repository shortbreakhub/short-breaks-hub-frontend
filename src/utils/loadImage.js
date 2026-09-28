

export function loadImages(name) {
    const images = import.meta.glob("../assets/*.jpg",{eager:true, import:"default"});
    const key = `../assets/${name.toLowerCase()}.jpg`;
    return images[key]
}

export function loadPngImages(name) {
    const images = import.meta.glob("../assets/*.png",{eager:true, import:"default"});
    const key = `../assets/${name.toLowerCase()}.png`;
    return images[key]
}

export function loadSubFolderImages(subFolderName,name) {
    const images = import.meta.glob(`../assets/**/*.jpg`,{eager:true, import:"default"});
    const key = `../assets/${subFolderName}/${name.toLowerCase()}.jpg`;
    return images[key]
}