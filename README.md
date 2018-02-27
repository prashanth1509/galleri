# Gallery app
- An image gallery that displays list of images while preserving the aspect ratio and without wasting screen space. (linear partition algoritm / css columns)
- Provides a smooth transitions from list to detail view. (FLIP animations)
- Allows user to swipe (fast and slow swipes) between images in detail view.
- Follows web accessibility rules and semantics.
- Lazy loads images. (Intersection observer)
- Built as a progressive web app and works offline.

# Demo
- https://gallery-v1.firebaseapp.com

# Setup
- `npm install`
- `npm start`
- `http://localhost:8080`

# Codebase
- Components: **Index.js, Gallery.js, Modal.js, Loader.js**
- Utitlity: **Utils.js**
- Stylesheets: **gallery.css**
- Images, json: **assets/**
- Distribution: **production-stable/**