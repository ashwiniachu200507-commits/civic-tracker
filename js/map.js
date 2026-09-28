/**
 * CivicTrack AI - Civic Map Controller (map.js)
 * Dual-Map Intelligence:
 * 1. Leaflet + OpenStreetMap for live civic issue markers and filters.
 * 2. Responsive Google Maps embed for geographic context and ward navigation.
 */

const MapController = {
  mapInstance: null,
  markersLayer: null,
  activeFilter: 'all',
  defaultCenter: [13.0827, 80.2707], // Chennai Center (Central Junction)

  init() {
    this.bindFilterButtons();

    window.addEventListener('resize', () => {
      if (this.mapInstance) {
        this.mapInstance.invalidateSize();
      }
    });
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

      // Use ESRI World Street Map (reliable, free, high-resolution street tiles, zero watermark)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri &mdash; Street Map'
      }).addTo(this.mapInstance);

      this.markersLayer = L.layerGroup().addTo(this.mapInstance);
    }

    this.renderMarkers();

    // Invalidate size to ensure crisp rendering on dynamic SPA tab switches
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.invalidateSize();
      }
    }, 250);
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

    let renderedCount = 0;

    complaints.forEach(c => {
      // Apply map filters
      if (this.activeFilter === 'resolved' && !['RESOLVED', 'CITIZEN VERIFIED'].includes(c.status)) return;
      if (this.activeFilter === 'reopened' && c.status !== 'REOPENED') return;
      if (this.activeFilter === 'critical' && c.severity !== 'CRITICAL' && c.severity !== 'HIGH') return;
      if (['pothole', 'streetlight', 'garbage', 'drainage', 'traffic'].includes(this.activeFilter) && c.category !== this.activeFilter) return;

      renderedCount++;
      const lat = c.coordinates?.lat || 13.0827;
      const lng = c.coordinates?.lng || 80.2707;

      let markerClasses = `custom-civic-marker ${c.category}`;
      if (c.status === 'CITIZEN VERIFIED') markerClasses += ' resolved';
      if (c.status === 'REOPENED') markerClasses += ' reopened';
      if (c.severity === 'CRITICAL') markerClasses += ' critical';

      const markerHtml = `
        <div class="${markerClasses}" title="${c.title} (${c.status})">
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
      const timeAgo = typeof formatTimeAgo === 'function' ? formatTimeAgo(new Date(c.createdAt)) : new Date(c.createdAt).toLocaleDateString();

      const popupContent = `
        <div class="map-popup-card">
          <div class="map-popup-header">
            <span class="map-popup-id">${c.id}</span>
            ${statusBadge}
          </div>
          <div class="map-popup-title">${c.categoryIcon} ${c.title}</div>
          <div class="map-popup-location">📍 ${c.location}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.6rem; background: var(--bg-tertiary); padding: 0.35rem 0.5rem; border-radius: var(--radius-sm);">
            Priority Score: <strong>${c.priorityScore}/100</strong> | Severity: <strong>${c.severity}</strong>
          </div>
          <div class="map-popup-footer">
            <span style="font-size: 0.72rem; color: var(--text-muted);">${timeAgo}</span>
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
      .bindPopup('<strong>📍 Your Current GPS Location</strong><br>Anna Nagar Sector (Zone 8), Chennai')
      .addTo(this.markersLayer);
  },

  renderFallbackVectorMap() {
    const container = document.getElementById('civic-leaflet-map');
    if (!container) return;

    const complaints = StorageService.getComplaints();
    container.innerHTML = `
      <div style="width: 100%; height: 100%; background: #0f172a; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 1000 600" width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
          </pattern>
          <rect width="1000" height="600" fill="url(#grid)" />
          
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

// Global aliases
window.MapController = MapController;
window.CivicMap = MapController;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapController;
}

