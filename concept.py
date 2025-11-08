from deepface import DeepFace
result = DeepFace.verify("person1.jpg", "gill.jpg", 
                         detector_backend="retinaface",
                         model_name="Facenet", threshold=0.5)
print("Are they the same person? ", result["verified"])
