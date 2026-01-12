# SignQuest — Level 1 Prototype (YES/NO)

This folder is a **static prototype** that can be copied into any shared web server directory and loaded in a browser.

## Requirements

- Must be served from:
  - `https://...` **or**
  - `http://localhost` (special-cased by browsers)
- Camera access generally **will not work** from `file://` URLs.

## What this prototype includes

- Learn flow:
  - Learn **YES**
  - Learn **NO**
  - Short calibration quiz using YES/NO
- Live feedback for each attempt:
  - Handshape
  - Location
  - Orientation
  - Movement (implemented as a stability/hold meter for this prototype)

## Tech

- MediaPipe Hands via CDN (jsDelivr)
- `getUserMedia` camera capture
- Simple rule-based matching for YES/NO

## Notes

This is an early prototype intended to validate the core loop and UX. Thresholds and feature extraction will be iterated.
