// Geolocation functionality
class GeolocationService {
    constructor(app) {
        this.app = app;
        this.userLocation = null;
        this.watchId = null;
        
        this.initGeolocation();
    }
    
    initGeolocation() {
        const locationButton = document.getElementById('location-button');
        if (locationButton) {
            locationButton.addEventListener('click', () => {
                this.requestLocation();
            });
        }
    }
    
    async requestLocation() {
        console.log('📍 Requesting user location...');
        
        try {
            const position = await this.getCurrentPosition();
            this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            console.log('✅ Location acquired:', this.userLocation);
            
            // Center map on user location
            if (this.app.map) {
                this.app.map.setView([this.userLocation.lat, this.userLocation.lng], 12);
                
                // Add user location marker
                this.addUserMarker();
                
                // Find nearby preschools
                this.findNearbyPreschools();
            }
            
        } catch (error) {
            console.error('❌ Failed to get location:', error);
            this.showLocationError(error);
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation stöds inte i din webbläsare'));
                return;
            }
            
            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000 // 5 minutes
            };
            
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                options
            );
        });
    }
    
    addUserMarker() {
        if (!this.app.map || !this.userLocation) return;
        
        // Remove existing user marker
        if (this.userMarker) {
            this.app.map.removeLayer(this.userMarker);
        }
        
        // Create custom icon for user location
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-marker-dot"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        // Add user marker
        this.userMarker = L.marker(
            [this.userLocation.lat, this.userLocation.lng],
            { icon: userIcon }
        ).addTo(this.app.map);
        
        this.userMarker.bindPopup('📍 Din plats').openPopup();
    }
    
    findNearbyPreschools(radius = 10) {
        if (!this.userLocation || !this.app.preschools) return;
        
        console.log(`🔍 Finding preschools within ${radius}km...`);
        
        const nearby = this.app.preschools.filter(preschool => {
            if (!preschool.Latitud || !preschool.Longitud) return false;
            
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                preschool.Latitud,
                preschool.Longitud
            );
            
            preschool.distance = distance;
            return distance <= radius;
        });
        
        // Sort by distance
        nearby.sort((a, b) => a.distance - b.distance);
        
        console.log(`✅ Found ${nearby.length} nearby preschools`);
        
        // Update app with nearby preschools
        this.app.filteredPreschools = nearby;
        this.app.updateResults();
        this.app.updateMapMarkers();
        
        // Show nearby results panel
        this.showNearbyResults(nearby.slice(0, 10));
    }
    
    showNearbyResults(nearby) {
        const nearbyPanel = document.getElementById('nearby-panel');
        if (!nearbyPanel) return;
        
        nearbyPanel.style.display = 'block';
        
        const nearbyList = document.getElementById('nearby-list');
        if (nearbyList) {
            nearbyList.innerHTML = nearby.map(preschool => `
                <div class="nearby-item">
                    <div class="nearby-name">${preschool.Namn}</div>
                    <div class="nearby-distance">${preschool.distance.toFixed(1)} km bort</div>
                    <div class="nearby-info">${preschool.Kommun} • ${preschool.Huvudman}</div>
                </div>
            `).join('');
        }
    }
    
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
    
    showLocationError(error) {
        let message = 'Kunde inte hämta din plats.';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Platsåtkomst nekad. Aktivera platsåtkomst i webbläsaren.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Platsinformation är inte tillgänglig.';
                break;
            case error.TIMEOUT:
                message = 'Tidsgräns för platsförfrågan uppnådd.';
                break;
        }
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'location-error';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.search-section');
        if (container) {
            container.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }
    
    watchPosition() {
        if (!navigator.geolocation) return;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000 // 1 minute
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                this.addUserMarker();
            },
            (error) => console.warn('Location watch error:', error),
            options
        );
    }
    
    stopWatching() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}