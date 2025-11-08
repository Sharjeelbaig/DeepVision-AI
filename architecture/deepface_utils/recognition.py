from deepface import DeepFace
def recognizeFace(image_url1: str, image_url2: str):
    result = DeepFace.verify(image_url1, image_url2,
                             detector_backend="retinaface",
                             model_name="Facenet", threshold=0.5)
    return {
        "isMatch": result["verified"],
        "confidence": result["distance"]
    }