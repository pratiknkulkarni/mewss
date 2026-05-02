import {createAvatar} from "@dicebear/core";
import {pixelArtNeutral} from "@dicebear/collection"

const generateAvatarIcon = (email: string) => {
    return createAvatar(pixelArtNeutral, {
        size: 128,
        seed: email,
    }).toDataUri();
}

export default generateAvatarIcon;