# Deep Vision Architecture Plan
This document outlines the architecture plan for the Deep Vision project, detailing the key components, their interactions, and the overall system design.

## Layers
We will structure the Deep Vision architecture into several layers to ensure modularity and scalability:

- supabase
- deepface

the layer names are self-explanatory, each layer will encapsulate specific functionalities related to its domain.

### Supabase Layer
The Supabase layer will handle all database interactions, user authentication, and real-time data synchronization. Key modules include:
- Authentication module `supabase/auth`
- DB module `supabase/db`
- Storage module `supabase/storage`

### Deepface Layer
The Deepface layer will be responsible for all functionalities related to facial recognition and image processing. Key module is:
- Face Recognition module `deepface/recognition`