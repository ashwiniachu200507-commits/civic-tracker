/**
 * CivicTrack AI - Report Issue Controller (report.js)
 * Implements the complete reporting workflow:
 * Image Upload / Camera -> AI Prototype Analysis -> Geolocation -> Duplicate Check -> Smart Summary -> Submit
 */

const ReportController = {
  selectedCategory: 'pothole',
  selectedCategoryName: 'Pothole',
  selectedCategoryIcon: '🕳️',
  currentImageSrc: null,
  currentCoordinates: { lat: 13.0850, lng: 80.2101 }, // Default Anna Nagar
  currentAddress: '12th Main Road, Anna Nagar, Chennai',
  aiAnalysisResult: null,
  mediaStream: null,

  init() {
    this.bindCategorySelectors();
    this.bindImageUpload();
    this.bindLocationHandlers();
    this.bindFormSubmission();
  },

  bindCategorySelectors() {
    document.querySelectorAll('.category-chip-label').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.category-chip-label').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        
        const radio = chip.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        this.selectedCategory = chip.dataset.category || 'pothole';
        this.selectedCategoryName = chip.dataset.name || 'Pothole';
        this.selectedCategoryIcon = chip.dataset.icon || '🕳️';

        // Re-run AI analysis if image is already uploaded
        if (this.currentImageSrc) {
          this.runAIScanner(this.currentImageSrc, this.selectedCategory);
        }

        // Trigger duplicate detection check
        this.checkDuplicates();
      });
    });
  },

  bindImageUpload() {
    const fileInput = document.getElementById('report-file-input');
    const dropzone = document.getElementById('image-dropzone');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.handleImageSelected(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.handleImageSelected(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Sample Image 1-Click Selectors
    document.querySelectorAll('.sample-image-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const imgPath = chip.dataset.src;
        const category = chip.dataset.category;

        // Auto select corresponding category
        if (category) {
          const catChip = document.querySelector(`.category-chip-label[data-category="${category}"]`);
          if (catChip) catChip.click();
        }

        this.handleImageSelected(imgPath);
      });
    });
  },

  handleImageSelected(imageSrc) {
    this.currentImageSrc = imageSrc;

    // Show scanner viewfinder
    const viewfinder = document.getElementById('ai-scanner-viewfinder');
    const previewImg = document.getElementById('scanner-image-preview');
    const dropzone = document.getElementById('image-dropzone');

    if (viewfinder && previewImg) {
      previewImg.src = imageSrc;
      viewfinder.classList.add('active');
    }

    if (dropzone) {
      dropzone.style.display = 'none';
    }

    const resetBtn = document.getElementById('reset-image-btn');
    if (resetBtn) resetBtn.style.display = 'inline-flex';

    // Execute AI vision scanner simulation
    this.runAIScanner(imageSrc, this.selectedCategory);
  },

  resetImage() {
    this.currentImageSrc = null;
    this.aiAnalysisResult = null;

    const viewfinder = document.getElementById('ai-scanner-viewfinder');
    const dropzone = document.getElementById('image-dropzone');
    const resultCard = document.getElementById('ai-analysis-result-card');
    const resetBtn = document.getElementById('reset-image-btn');

    if (viewfinder) viewfinder.classList.remove('active');
    if (resultCard) resultCard.classList.remove('active');
    if (dropzone) dropzone.style.display = 'block';
    if (resetBtn) resetBtn.style.display = 'none';

    const fileInput = document.getElementById('report-file-input');
    if (fileInput) fileInput.value = '';

    this.updateSmartSummary();
  },

  async runAIScanner(imageSrc, category) {
    const resultCard = document.getElementById('ai-analysis-result-card');
    const scannerStatus = document.getElementById('scanner-status-text');

    if (scannerStatus) scannerStatus.textContent = 'AI Vision Model Analyzing Image...';
    if (resultCard) resultCard.classList.remove('active');

    // Call AI vision simulation
    const analysis = await CivicAI.analyzeImage(imageSrc, category);
    this.aiAnalysisResult = analysis;

    if (scannerStatus) scannerStatus.textContent = 'Analysis Complete (92% Confidence)';

    // Update Result UI Card
    if (resultCard) {
      resultCard.classList.add('active');
      document.getElementById('ai-detected-title').textContent = analysis.detection;
      document.getElementById('ai-confidence-val').textContent = `${analysis.confidence}%`;
      document.getElementById('ai-confidence-bar').style.width = `${analysis.confidence}%`;
      
      const sevEl = document.getElementById('ai-severity-val');
      sevEl.textContent = analysis.severity;
      sevEl.className = `badge badge-${analysis.severity.toLowerCase()}`;
      if (analysis.severity === 'HIGH') sevEl.style.backgroundColor = '#ffedd5';
      if (analysis.severity === 'CRITICAL') sevEl.style.backgroundColor = '#fee2e2';

      document.getElementById('ai-department-val').textContent = analysis.department;
    }

    this.updatePriorityGauge();
    this.updateSmartSummary();
    this.checkDuplicates();
  },

  bindLocationHandlers() {
    const useGpsBtn = document.getElementById('btn-use-gps');
    const locationInput = document.getElementById('report-location-input');

    if (useGpsBtn) {
      useGpsBtn.addEventListener('click', () => {
        this.fetchGPSLocation();
      });
    }

    if (locationInput) {
      locationInput.addEventListener('input', (e) => {
        this.currentAddress = e.target.value;
        this.checkDuplicates();
        this.updateSmartSummary();
      });
    }

    // Quick Preset Locations
    document.querySelectorAll('.preset-loc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const address = btn.dataset.address;
        const lat = parseFloat(btn.dataset.lat);
        const lng = parseFloat(btn.dataset.lng);

        this.currentAddress = address;
        this.currentCoordinates = { lat, lng };

        if (locationInput) locationInput.value = address;
        this.updateLocationBadge(address, lat, lng);
        this.checkDuplicates();
        this.updateSmartSummary();
      });
    });
  },

  fetchGPSLocation() {
    const statusText = document.getElementById('location-status-text');
    if (!navigator.geolocation) {
      NotificationService.showToast({
        title: 'Geolocation Not Supported',
        message: 'Browser does not support Geolocation. Please enter address manually.',
        type: 'warning'
      });
      return;
    }

    if (statusText) statusText.textContent = 'Requesting GPS satellite lock...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        
        // Reverse geocoding simulation to realistic Chennai landmark
        const address = `Near Coordinates (${lat}, ${lng}), Anna Nagar Sector, Chennai`;
        this.currentCoordinates = { lat, lng };
        this.currentAddress = address;

        const locInput = document.getElementById('report-location-input');
        if (locInput) locInput.value = address;

        this.updateLocationBadge(address, lat, lng);
        if (statusText) statusText.textContent = '✓ High-Accuracy GPS Lock Acquired';

        NotificationService.showToast({
          title: 'GPS Coordinates Captured',
          message: `Latitude: ${lat}, Longitude: ${lng}`,
          type: 'success'
        });

        this.checkDuplicates();
        this.updateSmartSummary();
      },
      (error) => {
        console.warn('GPS Permission Denied or Timeout:', error.message);
        if (statusText) statusText.textContent = 'GPS permission denied. Using manual fallback location.';
        NotificationService.showToast({
          title: 'Location Permission Denied',
          message: 'Location permission is required for accurate civic reporting. Fallback manual location enabled.',
          type: 'warning'
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  },

  updateLocationBadge(address, lat, lng) {
    const badge = document.getElementById('current-coords-display');
    if (badge) {
      badge.textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
    }
  },

  checkDuplicates() {
    const allComplaints = StorageService.getComplaints();
    const result = CivicAI.detectDuplicate({
      category: this.selectedCategory,
      coordinates: this.currentCoordinates,
      location: this.currentAddress
    }, allComplaints);

    const alertBox = document.getElementById('duplicate-alert-box');
    if (alertBox) {
      if (result.isDuplicate) {
        alertBox.classList.add('active');
        document.getElementById('duplicate-count-text').textContent = 
          `We found ${result.duplicateCount} similar ${this.selectedCategoryName} complaint(s) reported within 350 meters.`;
        
        const existingBtn = document.getElementById('view-duplicate-complaint-btn');
        if (existingBtn && result.duplicates[0]) {
          existingBtn.onclick = () => {
            AppRouter.navigate('details', { id: result.duplicates[0].id });
          };
        }
      } else {
        alertBox.classList.remove('active');
      }
    }

    this.updatePriorityGauge(result.duplicateCount);
  },

  updatePriorityGauge(duplicateCount = 0) {
    const severity = this.aiAnalysisResult ? this.aiAnalysisResult.severity : 'MEDIUM';
    const score = CivicAI.calculatePriorityScore({
      severity,
      location: this.currentAddress,
      category: this.selectedCategory,
      duplicateCount
    });

    const scoreNum = document.getElementById('report-priority-score-num');
    const scoreBar = document.getElementById('report-priority-score-bar');

    if (scoreNum) scoreNum.textContent = `${score}/100`;
    if (scoreBar) scoreBar.style.width = `${score}%`;
  },

  updateSmartSummary() {
    const descInput = document.getElementById('report-desc-input');
    const desc = descInput ? descInput.value : '';

    const summary = CivicAI.generateSmartSummary({
      categoryName: this.selectedCategoryName,
      location: this.currentAddress,
      severity: this.aiAnalysisResult ? this.aiAnalysisResult.severity : 'HIGH',
      description: desc,
      aiDetection: this.aiAnalysisResult ? this.aiAnalysisResult.detection : null
    });

    const summaryBox = document.getElementById('smart-summary-content');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem;">
          <div><strong>Issue Detected:</strong> ${summary.issue}</div>
          <div><strong>Severity:</strong> <span class="badge badge-high">${summary.severity}</span></div>
          <div><strong>Location:</strong> ${summary.location}</div>
          <div><strong>Estimated Impact:</strong> ${summary.estimatedImpact}</div>
          <div><strong>Recommended Department:</strong> <span style="color: var(--brand-primary); font-weight: 700;">${summary.recommendedDepartment}</span></div>
        </div>
      `;
    }
  },

  // Live Camera Capture
  async openCameraModal() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video-feed');
    if (!modal || !video) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      video.srcObject = this.mediaStream;
      modal.classList.add('open');
    } catch (e) {
      NotificationService.showToast({
        title: 'Camera Access Unavailable',
        message: 'Camera permission denied or camera device not found. You can upload an image or choose a sample image.',
        type: 'warning'
      });
    }
  },

  captureCameraFrame() {
    const video = document.getElementById('camera-video-feed');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    this.closeCameraModal();
    this.handleImageSelected(dataUrl);
  },

  closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    if (modal) modal.classList.remove('open');
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  },

  bindFormSubmission() {
    const form = document.getElementById('civic-report-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('report-title-input');
      const descInput = document.getElementById('report-desc-input');
      const locationInput = document.getElementById('report-location-input');

      const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : 
        `${this.selectedCategoryName} reported at ${this.currentAddress}`;
      const description = descInput ? descInput.value.trim() : '';
      const location = locationInput && locationInput.value.trim() ? locationInput.value.trim() : this.currentAddress;

      const severity = this.aiAnalysisResult ? this.aiAnalysisResult.severity : 'HIGH';
      const department = this.aiAnalysisResult ? this.aiAnalysisResult.department : 'Greater Chennai Corporation';
      const impact = this.aiAnalysisResult ? this.aiAnalysisResult.estimatedImpact : 'Accident Hazard';

      const priorityScore = CivicAI.calculatePriorityScore({
        severity,
        location,
        category: this.selectedCategory
      });

      const submitBtn = document.getElementById('btn-submit-report');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting & Routing...';
      }

      const res = await ApiService.createComplaint({
        category: this.selectedCategory,
        categoryName: this.selectedCategoryName,
        categoryIcon: this.selectedCategoryIcon,
        title,
        description,
        location,
        coordinates: this.currentCoordinates,
        severity,
        priorityScore,
        estimatedImpact: impact,
        recommendedDepartment: department,
        imageUrl: this.currentImageSrc || 'assets/sample-pothole.svg',
        confidence: this.aiAnalysisResult ? this.aiAnalysisResult.confidence : 92
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Complaint';
      }

      if (res.success) {
        // Show Success Modal
        this.showSuccessModal(res.data);
      }
    });
  },

  showSuccessModal(complaint) {
    const modal = document.getElementById('submission-success-modal');
    if (!modal) return;

    document.getElementById('success-complaint-id').textContent = complaint.id;
    document.getElementById('success-category').textContent = `${complaint.categoryIcon} ${complaint.categoryName}`;
    document.getElementById('success-severity').textContent = complaint.severity;
    document.getElementById('success-location').textContent = complaint.location;
    document.getElementById('success-priority').textContent = `${complaint.priorityScore}/100`;

    const viewBtn = document.getElementById('success-view-details-btn');
    if (viewBtn) {
      viewBtn.onclick = () => {
        modal.classList.remove('open');
        AppRouter.navigate('details', { id: complaint.id });
      };
    }

    modal.classList.add('open');
  }
};
