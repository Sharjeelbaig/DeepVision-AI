from transformers import pipeline
import torch
from PIL import Image
import requests

detector = pipeline(
    task="zero-shot-object-detection",
    model="google/owlv2-base-patch16-ensemble",
)

# image = Image.open("knife.jpeg").convert("RGB")
# image = Image.open(requests.get("https://www.shutterstock.com/image-photo/bearded-man-holding-sharp-knife-260nw-1108925567.jpg", stream=True).raw).convert("RGB")

candidate_labels = [
    "person with weapon",
    "normal person",
    "person with knife",
    "explosive device",
    "fighting person",
]

def predict_safety_measure(image):
    predictions = detector(
    image,
    candidate_labels=candidate_labels,
    threshold=0.25
)
    results = []
    for p in predictions:
        # print(p["label"], p["score"], p["box"])
        # return p["label"], p["score"], p["box"]
        box = p.get("box", {})
        formatted_box = {k: int(box[k]) for k in ("xmin", "ymin", "xmax", "ymax") if k in box}
        results.append({
            "label": p["label"],
            "score": float(p["score"]),
            "box": formatted_box,
        })
    print(results)
    return results
    
    

# res = predict_safety_measure(detector, image, candidate_labels)
# print(res)

__all__ = ["predict_safety_measure"]
