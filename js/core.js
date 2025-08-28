// Core application module
class PreschoolApp {
    constructor() {
        this.preschools = [];
        this.filteredPreschools = [];
        this.selectedPreschools = [];
        this.map = null;
        this.markers = null;
        this.userLocation = null;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Sveriges Förskolor App');
        
        try {
            // Load preschool data
            await this.loadData();
            
            // Initialize map
            this.initMap();
            
            // Initialize search
            this.initSearch();
            
            // Initialize filters
            this.initFilters();
            
            // Initialize comparison
            this.initComparison();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
        }
    }
    
    async loadData() {
        console.log('📊 Loading preschool data...');
        
        if (window.allSchoolsData) {
            this.preschools = window.allSchoolsData;
            this.filteredPreschools = [...this.preschools];
            console.log(`✅ Loaded ${this.preschools.length} preschools`);
        } else {
            console.warn('⚠️ No preschool data found');
        }
    }
    
    initMap() {
        console.log('🗺️ Initializing map...');
        
        // Initialize map centered on Sweden
        this.map = L.map('map', {
            center: [62.0, 15.0],
            zoom: 5,
            zoomControl: true,
            scrollWheelZoom: true
        });
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        // Initialize marker cluster group
        this.markers = L.markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 50
        });
        
        this.map.addLayer(this.markers);
        
        // Add markers for preschools
        this.updateMapMarkers();
        
        console.log('✅ Map initialized');
    }
    
    initSearch() {
        console.log('🔍 Initializing search...');
        
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        
        if (searchInput && searchButton) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.performSearch(e.target.value);
            }, 300));
            
            searchButton.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
        
        console.log('✅ Search initialized');
    }
    
    initFilters() {
        console.log('🔽 Initializing filters...');
        
        const filters = document.querySelectorAll('.filter-select');
        filters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });
        
        console.log('✅ Filters initialized');
    }
    
    initComparison() {
        console.log('⚖️ Initializing comparison...');
        // Comparison functionality will be added later
        console.log('✅ Comparison initialized');
    }
    
    performSearch(query) {
        console.log('🔍 Searching for:', query);
        
        if (!query.trim()) {
            this.filteredPreschools = [...this.preschools];
        } else {
            const searchTerm = query.toLowerCase().trim();
            this.filteredPreschools = this.preschools.filter(preschool => 
                preschool.Namn.toLowerCase().includes(searchTerm) ||
                preschool.Kommun.toLowerCase().includes(searchTerm) ||
                (preschool.Adress && preschool.Adress.toLowerCase().includes(searchTerm))
            );
        }
        
        this.applyFilters();
    }
    
    applyFilters() {
        console.log('🔽 Applying filters...');
        
        let filtered = [...this.filteredPreschools];
        
        // Municipality filter
        const municipalityFilter = document.getElementById('municipality-filter');
        if (municipalityFilter && municipalityFilter.value) {
            filtered = filtered.filter(p => p.Kommun === municipalityFilter.value);
        }
        
        // Type filter (Municipal/Private)
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter && typeFilter.value) {
            filtered = filtered.filter(p => p.Huvudman === typeFilter.value);
        }
        
        this.filteredPreschools = filtered;
        
        // Update display
        this.updateResults();
        this.updateMapMarkers();
        
        console.log(`✅ Filtered to ${filtered.length} preschools`);
    }
    
    updateResults() {
        const resultsList = document.getElementById('results-list');
        const resultsCount = document.getElementById('results-count');
        
        if (resultsCount) {
            resultsCount.textContent = `Visar ${this.filteredPreschools.length} förskolor`;
        }
        
        if (resultsList) {
            resultsList.innerHTML = '';
            
            this.filteredPreschools.slice(0, 50).forEach(preschool => {
                const card = this.createPreschoolCard(preschool);
                resultsList.appendChild(card);
            });
        }
    }
    
    createPreschoolCard(preschool) {
        const card = document.createElement('div');
        card.className = 'preschool-card';
        
        card.innerHTML = `
            <div class="preschool-name">${preschool.Namn}</div>
            <div class="preschool-info">${preschool.Huvudman} förskola • ${preschool.Kommun}</div>
            <div class="preschool-address">${preschool.Adress || 'Adress ej tillgänglig'}</div>
            <div class="preschool-stats">
                <div class="stat-item">
                    <div class="stat-value">${preschool['Antal barn'] || '—'}</div>
                    <div class="stat-label">Inskrivna barn</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${preschool.Personaltäthet ? preschool.Personaltäthet.toFixed(1) : '—'}</div>
                    <div class="stat-label">Barn per personal</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${preschool['Andel med förskollärarexamen'] ? preschool['Andel med förskollärarexamen'].toFixed(1) + '%' : '—'}</div>
                    <div class="stat-label">Förskollärarexamen</div>
                </div>
            </div>
            <button class="compare-button" onclick="app.addToComparison('${preschool.id}')">Jämför</button>
        `;
        
        return card;
    }
    
    updateMapMarkers() {
        if (!this.map || !this.markers) return;
        
        // Clear existing markers
        this.markers.clearLayers();
        
        // Add markers for filtered preschools
        this.filteredPreschools.forEach(preschool => {
            if (preschool.Latitud && preschool.Longitud) {
                const marker = L.marker([preschool.Latitud, preschool.Longitud]);
                
                const popupContent = `
                    <div class="popup-content">
                        <h3>${preschool.Namn}</h3>
                        <p><strong>${preschool.Huvudman}</strong> • ${preschool.Kommun}</p>
                        <p>${preschool.Adress || 'Adress ej tillgänglig'}</p>
                        <div class="popup-stats">
                            <span>Barn: ${preschool['Antal barn'] || '—'}</span>
                            <span>Personal: ${preschool.Personaltäthet ? preschool.Personaltäthet.toFixed(1) : '—'}</span>
                        </div>
                        <button onclick="app.addToComparison('${preschool.id}')">Jämför</button>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                this.markers.addLayer(marker);
            }
        });
        
        console.log(`🗺️ Updated map with ${this.markers.getLayers().length} markers`);
    }
    
    addToComparison(preschoolId) {
        const preschool = this.preschools.find(p => p.id === preschoolId);
        if (preschool && this.selectedPreschools.length < 5) {
            if (!this.selectedPreschools.find(p => p.id === preschoolId)) {
                this.selectedPreschools.push(preschool);
                this.updateComparisonPanel();
                console.log(`✅ Added ${preschool.Namn} to comparison`);
            }
        }
    }
    
    removeFromComparison(preschoolId) {
        this.selectedPreschools = this.selectedPreschools.filter(p => p.id !== preschoolId);
        this.updateComparisonPanel();
    }
    
    updateComparisonPanel() {
        const comparisonPanel = document.getElementById('comparison-panel');
        if (!comparisonPanel) return;
        
        if (this.selectedPreschools.length === 0) {
            comparisonPanel.style.display = 'none';
            return;
        }
        
        comparisonPanel.style.display = 'block';
        
        const comparisonList = document.getElementById('comparison-list');
        if (comparisonList) {
            comparisonList.innerHTML = this.selectedPreschools.map(preschool => `
                <div class="comparison-item">
                    <span>${preschool.Namn}</span>
                    <button onclick="app.removeFromComparison('${preschool.id}')" class="remove-button">×</button>
                </div>
            `).join('');
        }
    }
    
    // Utility function for debouncing search input
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Get user's current location
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.userLocation = location;
                    resolve(location);
                },
                error => reject(error),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
    
    // Calculate distance between two points
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PreschoolApp();
});