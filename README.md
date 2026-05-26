# AuraPet | Premium D2C Smart Pet Wellbeing Ecosystem

AuraPet is a showcase-quality premium D2C landing page prototype featuring the **AuraHub**—an AI-powered smart pet feeder and vital tracking ecosystem. This project demonstrates state-of-the-art web design aesthetics, premium typography, and advanced front-end interactive features.

## 🎨 Design & Aesthetics
AuraPet adopts a **minimalist, high-contrast light theme** designed to complement aesthetic home spaces.
- **Palette**: Clean white bases with alternating soft off-white (`#FAF9F6`) sections, deep charcoal (`#171717`) typography, and pastel highlights in Warm Peach (`#FFDDBF`) and Mint Green (`#A8E8E2`).
- **Typography**: Display headings set in `Outfit` (sans-serif) for a modern, editorial brand appearance; body copy in `Inter` for optimal reading metrics.
- **Form States**: Dynamic email input validation utilizing CSS `:user-invalid` styling for elegant error diagnostics.

---

## ⚙️ Core Interactive Features
1. **Interactive Product Anatomy**: A visual diagram of the AuraHub with pulsing hotspots. Clicking any hotspot updates a dynamic tech spec panel detailing internal mechanics.
2. **Onboarding & Plan Calculator**: A multi-step questionnaire that calculates custom daily pet caloric needs using resting metabolic formulas:
   $$\text{RER} = 70 \times (\text{Weight in kg})^{0.75}$$
   adjusted dynamically for age group, activity coefficients, and species (dog/cat). It then suggests a recommended subscription tier.
3. **Reviews Carousel**: A horizontal scroll-snapping track where cards scale up and gain shadow focus as they scroll to the center.
4. **Subscription Pricing Toggle**: Smooth transition between Monthly and Annual pricing with an integrated 20% discount.

---

## 🌀 Motion UI & Fallback Engineering
To guarantee performance and modern visuals, AuraPet leverages **CSS Scroll-Driven Animations** with **progressive JS fallbacks** for non-supporting viewports (e.g., Firefox):
- **Native Scroll Timelines**:
  - Hero Parallax: Hero copy and visual layers translate at offset rates relative to scroll position.
  - Review Cards: Slides transition scale (`0.92` to `1.02`) and opacity dynamically inside the horizontal scrollport.
- **Fallback Handlers**:
  - Automatically feature-detects scroll timelines. Falls back to a optimized `IntersectionObserver` scroll reveal and a scroll-position listener loop using `requestAnimationFrame`.

---

## 🚀 Running Locally
1. Clone the repository.
2. Spin up a local server inside the root directory:
   ```bash
   python3 -m http.server 8000
   ```
3. Visit `http://localhost:8000` in your web browser.
