import base64
from io import BytesIO
from PIL import Image
def base64_to_image(b64_string: str):
    # Remove "data:image/..." header if present
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]

    image_bytes = base64.b64decode(b64_string)
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    print("Converted base64 string to image: ", image)
    return image

__all__ = ["base64_to_image"]