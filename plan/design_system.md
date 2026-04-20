# Design System: "TinyTaps" (Toddler Learning Platform)

## 1. UX Principles for 1.5-Year-Olds
Design for this age group requires moving away from traditional "web" thinking. 18-month-olds use their whole hand (palmar grasp) rather than a single finger.

* **The "No-Miss" Rule:** Every interactive element should be at least 100x100px. There are no "missed" taps; if they hit the general area, the event should trigger.
* **Immediate Gratification:** The delay between a tap and a response (sound/animation) must be <100ms.
* **Zero-Text Navigation:** Use visual cues only. A 1.5-year-old cannot read "Back" or "Play." Use universal symbols like a giant 'X' or a 'House'.
* **Multi-Touch Shielding:** Toddlers often lean their palm on the screen while tapping with a finger. UX must prioritize the first touch or ignore simultaneous "mashing."

## 2. Visual Design System

### 2.1 Color Palette
Avoid neon colors which are overstimulating. Use high-contrast primary colors for objects and soft neutrals for backgrounds to focus the child's attention on the subject.

| Role | Color Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | Canvas Cream | `#FFF9E6` | Main page body; reduces blue-light strain. |
| **Primary** | Playful Red | `#FF4B4B` | High-energy animals (Lions, Fire Trucks). |
| **Secondary** | Sky Blue | `#4BA3FF` | Background UI elements or water animals. |
| **Accent** | Meadow Green | `#6BCB77` | Success states or plant life. |
| **Feedback** | Sun Yellow | `#FFD93D` | Active state "Glow" effect. |

### 2.2 Typography
Even though the child doesn't read, the parent does, and the child begins to recognize letter shapes.
* **Font-Family:** `Rounded` fonts feel friendlier and safer. 
    * *Suggestion:* 'Quicksand', 'Varela Round', or 'Nunito'.
* **Body Size:** `24pt` (Minimum for parents/accessibility).
* **Heading Size:** `48pt` (Uppercase only for object names).

### 2.3 Iconography & Imagery
* **Style:** Flat or "Soft 3D" (no complex textures).
* **Outline:** 4px solid dark-gray borders help the eye separate the object from the background.
* **Corners:** `border-radius: 24px;` (Everything should look "soft").

## 3. Component Specifications

### 3.1 The "Subject Card"
This is the core interactive element.
* **State: Idle:** A gentle "breathing" animation (scale 1.0 to 1.02).
* **State: Active (On Tap):** 1.  `transform: scale(0.9);` (Immediate visual "press").
    2.  `border: 8px solid #FFD93D;` (The "Sun Yellow" glow).
    3.  Trigger Sprite Animation (Wiggle/Jump).
    4.  Trigger Audio Context.

### 3.2 Audio Engine Behavior
* **Sound Stacking:** Disable stacking. If the user taps the Cow three times quickly, the "Moo" sound should restart from the beginning, not play three overlapping files.
* **Sequence:** * `Delay 0ms:` Play Animal Sound (e.g., "Woof!").
    * `Delay 800ms:` Play Voiceover (e.g., "Dog").

## 4. Technical Implementation Notes (UX Fixes)

### 4.1 Viewport Safety
Prevent the child from accidentally zooming or scrolling the page away.
```css
html, body {
  overflow: hidden; /* Prevent scrolling */
  touch-action: none; /* Disable browser gestures */
  user-select: none; /* Prevent text highlighting */
  -webkit-tap-highlight-color: transparent; /* Remove mobile blue tap box */
}
```
