document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. BILLING TOGGLE INDEX SCENARIO
  // ==========================================
  const pricingToggle = document.getElementById('pricingToggle');
  const priceElements = document.querySelectorAll('.price');

  if (pricingToggle) {
    pricingToggle.addEventListener('change', () => {
      priceElements.forEach(priceEl => {
        const isAnnual = pricingToggle.checked;
        const monthlyVal = priceEl.getAttribute('data-monthly');
        const annualVal = priceEl.getAttribute('data-annual');
        
        // Format with commas if needed
        const valToSet = isAnnual ? annualVal : monthlyVal;
        priceEl.textContent = Number(valToSet).toLocaleString('en-IN');
      });
    });
  }

  // ==========================================
  // 2. INTERACTIVE HOTSPOTS (PRODUCT TOUR)
  // ==========================================
  const hotspots = document.querySelectorAll('.hotspot');
  const specPlaceholder = document.getElementById('specPlaceholder');
  const specContent = document.getElementById('specContent');
  const specTitle = document.getElementById('specTitle');
  const specDescription = document.getElementById('specDescription');

  hotspots.forEach(hotspot => {
    const trigger = hotspot.querySelector('.hotspot-trigger');
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Toggle active states
      const isActive = hotspot.classList.contains('active');
      
      hotspots.forEach(h => h.classList.remove('active'));
      
      if (!isActive) {
        hotspot.classList.add('active');
        
        // Load content
        const title = hotspot.getAttribute('data-title');
        const desc = hotspot.getAttribute('data-desc');
        
        specTitle.textContent = title;
        specDescription.textContent = desc;
        
        specPlaceholder.classList.add('hidden');
        specContent.classList.remove('hidden');
      } else {
        // Reset to placeholder
        specPlaceholder.classList.remove('hidden');
        specContent.classList.add('hidden');
      }
    });
  });

  // Close hotspots on clicking elsewhere
  document.addEventListener('click', () => {
    hotspots.forEach(h => h.classList.remove('active'));
    specPlaceholder.classList.remove('hidden');
    specContent.classList.add('hidden');
  });

  // ==========================================
  // 3. ONBOARDING & CALCULATION WIZARD
  // ==========================================
  const nextButtons = document.querySelectorAll('.next-step-btn');
  const prevButtons = document.querySelectorAll('.prev-step-btn');
  const steps = document.querySelectorAll('.quiz-step');
  const progressBarFill = document.getElementById('progressBarFill');
  const currentStepText = document.getElementById('currentStepText');
  const weightSlider = document.getElementById('petWeight');
  const weightValue = document.getElementById('weightValue');
  const calculatePlanBtn = document.getElementById('calculatePlanBtn');

  // Sync weight slider value
  if (weightSlider && weightValue) {
    weightSlider.addEventListener('input', () => {
      weightValue.textContent = weightSlider.value;
    });
  }

  // Step progression
  nextButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Prevent default submit behaviors if inside forms
      e.preventDefault();
      
      const nextStepId = btn.getAttribute('data-next');
      const targetStep = document.getElementById(`step${nextStepId}`);
      
      if (targetStep) {
        // Hide all steps
        steps.forEach(s => s.classList.remove('active'));
        // Show next step
        targetStep.classList.add('active');
        
        // Update progress bar
        const stepNum = parseInt(nextStepId);
        const progressPct = (stepNum / 4) * 100;
        progressBarFill.style.width = `${progressPct}%`;
        currentStepText.textContent = stepNum;
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const prevStepId = btn.getAttribute('data-prev');
      const targetStep = document.getElementById(`step${prevStepId}`);
      
      if (targetStep) {
        steps.forEach(s => s.classList.remove('active'));
        targetStep.classList.add('active');
        
        const stepNum = parseInt(prevStepId);
        const progressPct = (stepNum / 4) * 100;
        progressBarFill.style.width = `${progressPct}%`;
        currentStepText.textContent = stepNum;
      }
    });
  });

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://aurapet.onrender.com/api';

  // Calculate customized nutrition routine
  if (calculatePlanBtn) {
    calculatePlanBtn.addEventListener('click', async () => {
      const petType = document.querySelector('input[name="petType"]:checked').value;
      const petBreed = document.getElementById('petBreed').value || 'Companion';
      const petAge = document.getElementById('petAge').value;
      const petActivity = document.querySelector('input[name="petActivity"]:checked').value;
      const petWeight = parseFloat(weightSlider.value);

      // Perform API call to backend calculator (with local fallback if server is offline)
      try {
        const response = await fetch(`${API_URL}/pets/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: petType, ageGroup: petAge, activityLevel: petActivity, weight: petWeight })
        });

        const resData = await response.json();
        
        if (resData.success) {
          const metrics = resData.data;
          document.getElementById('rCalories').textContent = `${metrics.caloricTarget} kcal`;
          document.getElementById('rFeedings').textContent = `${metrics.dailyPortions} Meals`;
          document.getElementById('rMeal').textContent = metrics.recommendedMeal;
          document.getElementById('rPlanName').textContent = metrics.planName;
          document.getElementById('rPlanPrice').textContent = `₹${metrics.planPrice.toLocaleString('en-IN')}`;
          return;
        }
      } catch (err) {
        console.warn('Backend server offline. Performing local calculations fallback.', err);
      }

      // Local Calculation Fallback: Runs identical math client-side
      const baseRER = 70 * Math.pow(petWeight, 0.75);
      let activityMultiplier = 1.0;
      if (petType === 'cat') {
        activityMultiplier = petActivity === 'low' ? 1.0 : petActivity === 'moderate' ? 1.2 : 1.4;
      } else {
        activityMultiplier = petActivity === 'low' ? 1.2 : petActivity === 'moderate' ? 1.6 : 2.0;
      }
      if (petAge === 'puppy') activityMultiplier *= 1.5;
      if (petAge === 'senior') activityMultiplier *= 0.8;

      const calculatedCalories = Math.round(baseRER * activityMultiplier);
      let dailyPortions = 3;
      if (petWeight < 8) dailyPortions = 2;
      else if (petWeight >= 30) dailyPortions = 4;

      let planName = 'Aura Essential';
      let planPrice = 999;
      let recommendedMeal = 'Aura Fit-Mix';

      if (petType === 'cat') {
        recommendedMeal = 'Aura Salmon Purée';
        planName = 'Aura Essential (Feline)';
        planPrice = 999;
      } else {
        if (petWeight < 12) {
          planName = 'Aura Starter';
          planPrice = 1299;
          recommendedMeal = 'Aura Puppy/Small Breed Mix';
        } else if (petWeight >= 12 && petWeight < 30) {
          planName = 'Aura Vital';
          planPrice = 1999;
          recommendedMeal = 'Aura Active Turkey Blend';
        } else {
          planName = 'Aura Elite';
          planPrice = 3499;
          recommendedMeal = 'Aura Premium Beef Feast';
        }
      }

      document.getElementById('rCalories').textContent = `${calculatedCalories} kcal`;
      document.getElementById('rFeedings').textContent = `${dailyPortions} Meals`;
      document.getElementById('rMeal').textContent = recommendedMeal;
      document.getElementById('rPlanName').textContent = planName;
      document.getElementById('rPlanPrice').textContent = `₹${planPrice.toLocaleString('en-IN')}`;
    });
  }

  // Handle final registration & profile submission
  const claimPlanBtn = document.getElementById('claimPlanBtn');
  if (claimPlanBtn) {
    claimPlanBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const errorMsgContainer = document.getElementById('quizErrorMsg');
      errorMsgContainer.style.display = 'none';

      // Inputs from registration form
      const regName = document.getElementById('regName').value.trim();
      const regEmail = document.getElementById('regEmail').value.trim();
      const regPassword = document.getElementById('regPassword').value;

      // Inputs from pet form
      const petName = document.getElementById('petName').value.trim();
      const petType = document.querySelector('input[name="petType"]:checked').value;
      const petBreed = document.getElementById('petBreed').value.trim() || 'Companion';
      const petAge = document.getElementById('petAge').value;
      const petActivity = document.querySelector('input[name="petActivity"]:checked').value;
      const petWeight = parseFloat(weightSlider.value);

      // Client-side validations
      if (!petName) {
        errorMsgContainer.textContent = 'Please fill out your Pet\'s Name in Step 1.';
        errorMsgContainer.style.display = 'block';
        return;
      }
      if (!regName || !regEmail || !regPassword) {
        errorMsgContainer.textContent = 'Please provide your Name, Email, and Password.';
        errorMsgContainer.style.display = 'block';
        return;
      }
      if (regPassword.length < 6) {
        errorMsgContainer.textContent = 'Password must be at least 6 characters.';
        errorMsgContainer.style.display = 'block';
        return;
      }

      // Disable button during requests
      claimPlanBtn.disabled = true;
      claimPlanBtn.textContent = 'Creating Account...';

      try {
        // Step 1: Register User Account
        const regResponse = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
        });
        
        const regData = await regResponse.json();

        if (!regData.success) {
          throw new Error(regData.error || 'Registration failed.');
        }

        // Save token to session storage
        sessionStorage.setItem('token', regData.token);
        sessionStorage.setItem('userName', regData.user.name);

        claimPlanBtn.textContent = 'Saving Pet Profile...';

        // Step 2: Register Pet Profile
        const petResponse = await fetch(`${API_URL}/pets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${regData.token}`
          },
          body: JSON.stringify({
            name: petName,
            type: petType,
            breed: petBreed,
            ageGroup: petAge,
            activityLevel: petActivity,
            weight: petWeight
          })
        });

        const petData = await petResponse.json();

        if (!petData.success) {
          throw new Error(petData.error || 'Failed to save pet profile.');
        }

        // Save active pet ID
        sessionStorage.setItem('activePetId', petData.data._id);
        
        // Success redirect
        alert('Welcome to AuraPet! Redirecting to your dashboard...');
        window.location.href = 'dashboard.html';

      } catch (err) {
        console.error(err);
        errorMsgContainer.textContent = err.message || 'An error occurred during account creation. Please try again.';
        errorMsgContainer.style.display = 'block';
        claimPlanBtn.disabled = false;
        claimPlanBtn.textContent = 'Save Profile & Open Dashboard';
      }
    });
  }

  // ==========================================
  // 4. REVIEWS CAROUSEL SYNC & INDICATORS
  // ==========================================
  const reviewsScroller = document.getElementById('reviewsScroller');
  const indicatorBtns = document.querySelectorAll('.indicator-btn');

  if (reviewsScroller && indicatorBtns.length > 0) {
    reviewsScroller.addEventListener('scroll', () => {
      const scrollLeft = reviewsScroller.scrollLeft;
      const width = reviewsScroller.clientWidth;
      
      // Calculate active index
      const activeIndex = Math.round(scrollLeft / 380); // 350px card width + 30px gap
      
      indicatorBtns.forEach((btn, idx) => {
        if (idx === activeIndex) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });

    indicatorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'));
        const scrollTarget = index * 380;
        
        reviewsScroller.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        });
      });
    });
  }

  // ==========================================
  // 5. MOTION UI FALLBACKS FOR FIREFOX
  // ==========================================
  const isScrollDrivenSupported = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  if (!isScrollDrivenSupported) {
    console.log("Native CSS Scroll-driven animations unsupported. Loading performant fallback handlers.");

    // A. Reveal elements on scroll fallback (IntersectionObserver)
    const elementsToReveal = document.querySelectorAll(
      '.features-grid > *, .tour-container > *, .quiz-container > *, .pricing-grid > *'
    );

    // Initial setup: hide elements via class for JS transition
    elementsToReveal.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          // Unobserve to keep state once revealed
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12
    });

    elementsToReveal.forEach(el => revealObserver.observe(el));

    // B. Hero Parallax scroll fallback (simple requestAnimationFrame scroll handler)
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    const heroSection = document.querySelector('.hero-section');

    if (heroSection && heroContent && heroVisual) {
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const sectionHeight = heroSection.offsetHeight;
        
        if (scrollY <= sectionHeight) {
          const scrollPct = scrollY / sectionHeight;
          
          // Parallax text goes down slightly
          heroContent.style.transform = `translateY(${scrollPct * 60}px)`;
          // Parallax device scales and goes up/down slightly
          heroVisual.style.transform = `translateY(${-scrollPct * 30}px) scale(${1 + scrollPct * 0.03})`;
        }
      });
    }

    // C. Reviews Carousel slide focus fallback
    if (reviewsScroller) {
      const reviewCards = reviewsScroller.querySelectorAll('.review-card');
      
      const tick = () => {
        const scrollerRect = reviewsScroller.getBoundingClientRect();
        
        reviewCards.forEach(card => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
          
          const distanceFromCenter = Math.abs(cardCenter - scrollerCenter);
          const maxDistance = scrollerRect.width / 2 + cardRect.width / 2;
          const progress = Math.max(0, 1 - distanceFromCenter / maxDistance);
          
          // Mimic the CSS scroll-driven animation values
          const scale = 0.92 + progress * 0.10;
          const opacity = 0.65 + progress * 0.35;
          const shadowAlpha = progress * 0.18;
          
          card.style.transform = `scale(${scale})`;
          card.style.opacity = opacity;
          card.style.boxShadow = `0 10px 30px rgba(168, 232, 226, ${shadowAlpha})`;
        });
      };
      
      reviewsScroller.addEventListener('scroll', tick);
      // Trigger once initially
      tick();
      
      // Ensure layout changes or resizing updates it
      window.addEventListener('resize', tick);
    }
  }

});
