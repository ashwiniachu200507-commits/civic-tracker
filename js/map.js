/**
 * CivicTrack AI - Civic Map Controller (map.js)
 * High-performance map interface using Leaflet + OpenStreetMap (Zero API keys required).
 * Includes pure SVG/Canvas fallback.
 */

const MapController = {
  mapInstance: null,
  markersLayer: null,
  activeFilter: 'all',
  defaultCenter: [13.0827, 80.2707], // Chennai Center (Central Junction)

  init() {
    this.bindFilterButtons();
  },

  loadMap() {
    const container = document.getElementById('civic-leaflet-map');
    if (!container) return;

    // Check if Leaflet is loaded from CDN
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded from CDN, rendering custom vector map.');
      this.renderFallbackVectorMap();
      return;
    }

    if (!this.mapInstance) {
      this.mapInstance = L.map('civic-leaflet-map', {
        zoomControl: true,
        attributionControl: false
      }).setView(this.defaultCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}.png', {
        maxZoom: 19
      }).addTo(this.mapInstance);

      this.markersLayer = L.layerGroup().addTo(this.mapInstance);
    }

    this.renderMarkers();
    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 200);
  },

  bindFilterButtons() {
    document.querySelectorAll('.map-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter || 'all';
        this.renderMarkers();
      });
    });
  },

  renderMarkers() {
    if (!this.mapInstance || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    const complaints = StorageService.getComplaints();

    complaints.forEach(c => {
      // Apply map filters
      if (this.activeFilter === 'resolved' && !['RESOLVED', 'CITIZEN VERIFIED'].includes(c.status)) return;
      if (this.activeFilter === 'critical' && c.severity !== 'CRITICAL' && c.severity !== 'HIGH') return;
      if (['pothole', 'streetlight', 'garbage', 'drainage', 'traffic'].includes(this.activeFilter) && c.category !== this.activeFilter) return;

      const lat = c.coordinates?.lat || 13.0827;
      const lng = c.coordinates?.lng || 80.2707;

      const markerHtml = `
        <div class="custom-civic-marker ${c.category} ${c.status === 'CITIZEN VERIFIED' ? 'resolved' : ''}">
          ${c.categoryIcon}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'civic-marker-wrapper',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const statusBadge = `<span class="badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>`;

      const popupContent = `
        <div class="map-popup-card">
          <div class="map-popup-header">
            <span class="map-popup-id">${c.id}</span>
            ${statusBadge}
          </div>
          <div class="map-popup-title">${c.categoryIcon} ${c.title}</div>
          <div class="map-popup-location">📍 ${c.location}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            Priority Score: <strong>${c.priorityScore}/100</strong> | Severity: <strong>${c.severity}</strong>
          </div>
          <div class="map-popup-footer">
            <span style="font-size: 0.72rem; color: var(--text-muted);">${formatTimeAgo(new Date(c.createdAt))}</span>
            <button class="btn btn-sm btn-primary" onclick="AppRouter.navigate('details', {id: '${c.id}'})">
              Inspect Timeline &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markersLayer.addLayer(marker);
    });

    // Add User GPS Pulsing Dot
    const userGpsIcon = L.divIcon({
      html: '<div class="user-gps-pulse-marker" title="Your GPS Location"></div>',
      className: 'gps-pulse-wrapper',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([13.0850, 80.2101], { icon: userGpsIcon })
      .bindPopup('<strong>📍 Your Current Location</strong><br>Anna Nagar Sector, Chennai')
      .addTo(this.markersLayer);
  },

  renderFallbackVectorMap() {
    const container = document.getElementById('civic-leaflet-map');
    if (!container) return;

    const complaints = StorageService.getComplaints();
    container.innerHTML = `
      <div style="width: 100%; height: 100%; background: #0f172a; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 1000 600" width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
          <!-- Grid Lines -->
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
          </pattern>
          <rect width="1000" height="600" fill="url(#grid)" />
          
          <!-- Arterial Road Corridors -->
          <path d="M 100,300 Q 500,280 900,320" stroke="#334155" stroke-width="16" fill="none"/>
          <path d="M 300,50 Q 320,300 450,550" stroke="#334155" stroke-width="14" fill="none"/>
          <path d="M 650,80 Q 600,320 700,520" stroke="#334155" stroke-width="12" fill="none"/>
        </svg>

        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 600px; z-index: 5;">
          ${complaints.slice(0, 6).map(c => `
            <div class="card" style="padding: 0.75rem 1rem; cursor: pointer;" onclick="AppRouter.navigate('details', {id: '${c.id}'})">
              <div style="font-weight: 700; font-size: 0.85rem;">${c.categoryIcon} ${c.categoryName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${c.location}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
