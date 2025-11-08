# Deepface Utils Architecture
This document outlines the architecture of the Deepface Utils layer within the Deep Vision project. It has only one main module responsible for facial recognition functionality, it is `recognition`.

## Recognition Module
The recognition module is very simple, it contains only one main function:
- `recognizeFace(imageBase64, image_url)`: This function takes a base64 encoded image of a face and another image URL of other face, it compares both faces and returns whether they match or not along with a confidence score, as simple as that.
Here is a line by line breakdown of how the function works:
```python
from deepface import DeepFace
```
This line imports the DeepFace library, which is a popular library for facial recognition tasks.

Now, on the second line:
```python
def recognizeFace(image_url1: str, image_url2: str):
```
This line defines a function named `recognizeFace` that takes two parameters: `image_url1`, which is the URL of the first image, and `image_url2`, which is the URL of the second image.
Inside the function, the following line is executed which fetches the image from the provided URL and:
```python
from deepface import DeepFace
```
This line imports the DeepFace library, which is a popular library for facial recognition tasks.
```python
def recognizeFace(image_url1: str, image_url2: str):
    result = DeepFace.verify(image_url1, image_url2,
                             detector_backend="retinaface",
                             model_name="Facenet", threshold=0.5)
    return {
        "isMatch": result["verified"],
        "confidence": result["distance"]
    }
```
This line defines a function named `recognizeFace` that takes two parameters: `image_url
