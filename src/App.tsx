import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Settings, 
  Plus, 
  Globe, 
  Sun, 
  Moon, 
  X, 
  Star, 
  RefreshCw, 
  Check 
} from 'lucide-react';

interface City {
  id: string;
  name: string;
  country: string;
  region: string;
  timezone: string;
}

// Extensive timezone database categorized by region
const CITY_DATABASE: City[] = [
  // Americas
  { id: 'sfo', name: 'San Francisco', country: 'United States', region: 'Americas', timezone: 'America/Los_Angeles' },
  { id: 'nyc', name: 'New York', country: 'United States', region: 'Americas', timezone: 'America/New_York' },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', region: 'Americas', timezone: 'America/Sao_Paulo' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', region: 'Americas', timezone: 'America/Toronto' },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', region: 'Americas', timezone: 'America/Mexico_City' },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', region: 'Americas', timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'chicago', name: 'Chicago', country: 'United States', region: 'Americas', timezone: 'America/Chicago' },
  { id: 'bogota', name: 'Bogotá', country: 'Colombia', region: 'Americas', timezone: 'America/Bogota' },
  { id: 'vancouver', name: 'Vancouver', country: 'Canada', region: 'Americas', timezone: 'America/Vancouver' },
  
  // Europe
  { id: 'london', name: 'London', country: 'United Kingdom', region: 'Europe', timezone: 'Europe/London' },
  { id: 'paris', name: 'Paris', country: 'France', region: 'Europe', timezone: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', country: 'Germany', region: 'Europe', timezone: 'Europe/Berlin' },
  { id: 'rome', name: 'Rome', country: 'Italy', region: 'Europe', timezone: 'Europe/Rome' },
  { id: 'madrid', name: 'Madrid', country: 'Spain', region: 'Europe', timezone: 'Europe/Madrid' },
  { id: 'moscow', name: 'Moscow', country: 'Russia', region: 'Europe', timezone: 'Europe/Moscow' },
  { id: 'kyiv', name: 'Kyiv', country: 'Ukraine', region: 'Europe', timezone: 'Europe/Kyiv' },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', region: 'Europe', timezone: 'Europe/Istanbul' },
  { id: 'athens', name: 'Athens', country: 'Greece', region: 'Europe', timezone: 'Europe/Athens' },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', region: 'Europe', timezone: 'Atlantic/Reykjavik' },
  
  // Asia
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'Asia', timezone: 'Asia/Tokyo' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', region: 'Asia', timezone: 'Asia/Dubai' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Asia', timezone: 'Asia/Singapore' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', region: 'Asia', timezone: 'Asia/Seoul' },
  { id: 'beijing', name: 'Beijing', country: 'China', region: 'Asia', timezone: 'Asia/Shanghai' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', region: 'Asia', timezone: 'Asia/Kolkata' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', region: 'Asia', timezone: 'Asia/Bangkok' },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', region: 'Asia', timezone: 'Asia/Jakarta' },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', region: 'Asia', timezone: 'Asia/Riyadh' },
  { id: 'manila', name: 'Manila', country: 'Philippines', region: 'Asia', timezone: 'Asia/Manila' },

  // Africa
  { id: 'cairo', name: 'Cairo', country: 'Egypt', region: 'Africa', timezone: 'Africa/Cairo' },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', region: 'Africa', timezone: 'Africa/Johannesburg' },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', region: 'Africa', timezone: 'Africa/Nairobi' },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', region: 'Africa', timezone: 'Africa/Lagos' },
  { id: 'casablanca', name: 'Casablanca', country: 'Morocco', region: 'Africa', timezone: 'Africa/Casablanca' },
  { id: 'accra', name: 'Accra', country: 'Ghana', region: 'Africa', timezone: 'Africa/Accra' },
  { id: 'dakar', name: 'Dakar', country: 'Senegal', region: 'Africa', timezone: 'Africa/Dakar' },
  { id: 'addis-ababa', name: 'Addis Ababa', country: 'Ethiopia', region: 'Africa', timezone: 'Africa/Addis_Ababa' },
  { id: 'algiers', name: 'Algiers', country: 'Algeria', region: 'Africa', timezone: 'Africa/Algiers' },

  // Oceania
  { id: 'sydney', name: 'Sydney', country: 'Australia', region: 'Oceania', timezone: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', region: 'Oceania', timezone: 'Pacific/Auckland' },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', region: 'Oceania', timezone: 'Australia/Melbourne' },
  { id: 'honolulu', name: 'Honolulu', country: 'United States', region: 'Oceania', timezone: 'Pacific/Honolulu' },
  { id: 'suva', name: 'Suva', country: 'Fiji', region: 'Oceania', timezone: 'Pacific/Fiji' },
  { id: 'perth', name: 'Perth', country: 'Australia', region: 'Oceania', timezone: 'Australia/Perth' },
  { id: 'brisbane', name: 'Brisbane', country: 'Australia', region: 'Oceania', timezone: 'Australia/Brisbane' },
];

const DEFAULT_GRID_IDS = ['nyc', 'london', 'tokyo', 'dubai', 'sydney', 'sao-paulo'];
const DEFAULT_FAVORITE_IDS = ['london', 'tokyo', 'dubai', 'sydney'];

const App = () => {
  // --- Persistent States (local storage) ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('zonify_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(() => {
    const saved = localStorage.getItem('zonify_format');
    return (saved as '12h' | '24h') || '12h';
  });

  const [showSeconds, setShowSeconds] = useState<boolean>(() => {
    const saved = localStorage.getItem('zonify_seconds');
    return saved ? saved === 'true' : false;
  });

  const [homeCity, setHomeCity] = useState<City>(() => {
    const saved = localStorage.getItem('zonify_home');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { /* fallback */ }
    }
    return CITY_DATABASE.find(c => c.id === 'sfo') || CITY_DATABASE[0];
  });

  const [gridCities, setGridCities] = useState<City[]>(() => {
    const saved = localStorage.getItem('zonify_grid');
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved) as string[];
        return parsedIds.map(id => CITY_DATABASE.find(c => c.id === id)).filter(Boolean) as City[];
      } catch (e) { /* fallback */ }
    }
    return DEFAULT_GRID_IDS.map(id => CITY_DATABASE.find(c => c.id === id)).filter(Boolean) as City[];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('zonify_favorites');
    if (saved) {
      try {
        return JSON.parse(saved) as string[];
      } catch (e) { /* fallback */ }
    }
    return DEFAULT_FAVORITE_IDS;
  });

  // --- UI & Application States ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrubbedHour, setScrubbedHour] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Popovers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalRegionTab, setModalRegionTab] = useState<string>('All');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const settingsRef = useRef<HTMLDivElement>(null);

  // Sync theme class to document body
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('zonify_theme', theme);
  }, [theme]);

  // Persistent stores sync
  useEffect(() => {
    localStorage.setItem('zonify_format', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    localStorage.setItem('zonify_seconds', String(showSeconds));
  }, [showSeconds]);

  useEffect(() => {
    localStorage.setItem('zonify_home', JSON.stringify(homeCity));
  }, [homeCity]);

  useEffect(() => {
    localStorage.setItem('zonify_grid', JSON.stringify(gridCities.map(c => c.id)));
  }, [gridCities]);

  useEffect(() => {
    localStorage.setItem('zonify_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Click outside listener to dismiss settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Sync Clock Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Dynamic Time Calculations (Core Logic) ---

  // Determine current active date (if time traveling, create modified offset Date)
  const getActiveDate = () => {
    if (scrubbedHour === null) return currentTime;

    // Find the current hour in home time zone
    const homeHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: homeCity.timezone,
      hour: 'numeric',
      hour12: false
    }).format(currentTime);
    
    const currentHomeHour = parseInt(homeHourStr, 10);
    const diffHours = scrubbedHour - currentHomeHour;

    // Add/subtract offset hours to current system date to time travel
    const travelDate = new Date(currentTime);
    travelDate.setHours(currentTime.getHours() + diffHours);
    travelDate.setMinutes(0);
    travelDate.setSeconds(0);
    return travelDate;
  };

  const activeDate = getActiveDate();

  // Offset calculator helper
  const getHourDifference = (timezone: string, baseTimezone: string) => {
    try {
      const date = currentTime; // Base difference on current live state to handle DST correctly
      const targetStr = date.toLocaleString('en-US', { timeZone: timezone });
      const baseStr = date.toLocaleString('en-US', { timeZone: baseTimezone });
      
      const targetDate = new Date(targetStr);
      const baseDate = new Date(baseStr);
      
      const diffMs = targetDate.getTime() - baseDate.getTime();
      return Math.round(diffMs / 3600000);
    } catch (e) {
      return 0;
    }
  };

  const formatOffsetLabel = (offset: number) => {
    if (offset === 0) return 'home';
    return offset > 0 ? `+${offset}h` : `${offset}h`;
  };

  // Standard string formatters
  const formatTime = (date: Date, timezone: string, secondsOption = false) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: secondsOption ? '2-digit' : undefined,
      hour12: timeFormat === '12h'
    }).format(date);
  };

  const formatDate = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getTimezoneAbbreviation = (date: Date, timezone: string) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      }).formatToParts(date);
      return parts.find(p => p.type === 'timeZoneName')?.value || '';
    } catch (e) {
      return '';
    }
  };

  const getUTCOffsetLabel = (date: Date, timezone: string) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      }).formatToParts(date);
      return parts.find(p => p.type === 'timeZoneName')?.value || '';
    } catch (e) {
      return '';
    }
  };

  // --- Grid Filtering ---
  const filteredGridCities = gridCities.filter(city => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      city.name.toLowerCase().includes(q) ||
      city.country.toLowerCase().includes(q) ||
      city.region.toLowerCase().includes(q)
    );
  });

  // --- Add Zone Modal Filtering ---
  const filteredAddableCities = CITY_DATABASE.filter(city => {
    // 1. Region Tab Filter
    if (modalRegionTab !== 'All' && city.region !== modalRegionTab) return false;
    
    // 2. Search Query Filter
    if (modalSearchQuery) {
      const q = modalSearchQuery.toLowerCase();
      return (
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q) ||
        city.timezone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // --- Sidebar Favorites Filtering ---
  // Favorites synced dynamically based on active favorites state
  const favoriteCities = favorites
    .map(id => CITY_DATABASE.find(c => c.id === id))
    .filter(Boolean) as City[];

  // --- Core Action Handlers ---
  const toggleFavorite = (cityId: string) => {
    setFavorites(prev => 
      prev.includes(cityId) 
        ? prev.filter(id => id !== cityId) 
        : [...prev, cityId]
    );
  };

  const handleAddCityToGrid = (city: City) => {
    if (gridCities.some(c => c.id === city.id)) {
      // Remove if already in grid
      setGridCities(prev => prev.filter(c => c.id !== city.id));
    } else {
      // Add to grid
      setGridCities(prev => [...prev, city]);
    }
  };

  const handleSetHomeCity = (city: City) => {
    setHomeCity(city);
    // Home city is always added to grid by default if selected
    if (!gridCities.some(c => c.id === city.id)) {
      setGridCities(prev => [...prev, city]);
    }
  };

  const handleResetDefaults = () => {
    setGridCities(DEFAULT_GRID_IDS.map(id => CITY_DATABASE.find(c => c.id === id)).filter(Boolean) as City[]);
    setFavorites(DEFAULT_FAVORITE_IDS);
    setHomeCity(CITY_DATABASE.find(c => c.id === 'sfo') || CITY_DATABASE[0]);
    setScrubbedHour(null);
    setIsSettingsOpen(false);
  };

  // Get current hour index in home timezone (0-23)
  const currentHomeHourIndex = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: homeCity.timezone,
      hour: 'numeric',
      hour12: false
    }).format(currentTime),
    10
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <Clock size={18} strokeWidth={2.5} />
          </div>
          Zonify
        </div>
        
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search active..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Local Time Card - Center Aligned perfectly (x and y axis) & dynamic */}
        <div className="local-time-card">
          <div className="local-time-header">
            <MapPin size={12} /> HOME TIME
          </div>
          <div className="local-city">{homeCity.name}, {homeCity.country}</div>
          <div className="local-time">
            {formatTime(activeDate, homeCity.timezone, showSeconds && scrubbedHour === null)}
          </div>
          <div className="local-date">
            {formatDate(activeDate, homeCity.timezone)} • {getTimezoneAbbreviation(activeDate, homeCity.timezone)}
          </div>
        </div>
        
        {/* Dynamic Sidebar Favorites */}
        <div className="favorites-section">
          <div className="favorites-title">FAVORITES</div>
          {favoriteCities.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px 0' }}>
              No favorites. Click the star on timezone cards to add!
            </div>
          ) : (
            favoriteCities.map(city => {
              const offset = getHourDifference(city.timezone, homeCity.timezone);
              return (
                <div 
                  key={city.id} 
                  className="favorite-item"
                  onClick={() => {
                    // Quick add/center action: bring city to focus or set as home
                    if (!gridCities.some(c => c.id === city.id)) {
                      setGridCities(prev => [city, ...prev]);
                    }
                  }}
                >
                  <span className="favorite-name">{city.name}</span>
                  <span className="favorite-time">
                    {formatTime(activeDate, city.timezone)} 
                    <span className="badge">{formatOffsetLabel(offset)}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>World Clock</h1>
            <p>Compare times across {gridCities.length} active zones</p>
          </div>
          <div className="actions">
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} /> Add Zone
            </button>

            {/* Theme Toggle Button */}
            <button 
              className="btn-icon" 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Settings Button */}
            <div className="settings-container" ref={settingsRef}>
              <button 
                className="btn-icon" 
                onClick={() => setIsSettingsOpen(prev => !prev)}
                title="Configuration Settings"
              >
                <Settings size={20} />
              </button>
              
              {isSettingsOpen && (
                <div className="settings-dropdown">
                  <div className="settings-title">SETTINGS</div>
                  
                  <div className="settings-option">
                    <span className="settings-label">24-Hour Format</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={timeFormat === '24h'}
                        onChange={(e) => setTimeFormat(e.target.checked ? '24h' : '12h')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="settings-option">
                    <span className="settings-label">Show Seconds</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={showSeconds}
                        onChange={(e) => setShowSeconds(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <button 
                    className="btn-primary" 
                    onClick={handleResetDefaults}
                    style={{ 
                      marginTop: '8px', 
                      width: '100%', 
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '0.8rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      boxShadow: 'none'
                    }}
                  >
                    <RefreshCw size={12} /> Reset to Defaults
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Timeline Scrubbing Time Travel Section */}
        <section className="timeline-section">
          <div className="timeline-header" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={16} /> 24-Hour Timeline (Base: {homeCity.name})
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Hover or click bars to travel in time
            </span>
          </div>

          <div className="timeline-graph-container">
            <div className="timeline-graph">
              {[...Array(24)].map((_, i) => {
                const isActive = i >= 8 && i <= 17; // Business overlap 8 AM - 5 PM
                const isLightActive = i >= 10 && i <= 15; // Golden hours overlap 10 AM - 3 PM
                const isCurrentHour = i === currentHomeHourIndex;
                const isSelected = i === scrubbedHour;
                
                let height = '30%';
                if (isActive) height = '70%';
                if (isLightActive) height = '100%';
                if (i === 8 || i === 17) height = '50%';
                
                let barClass = 'timeline-bar';
                if (isActive) barClass += ' active';
                if (isLightActive) barClass += ' active-light';
                if (isSelected) barClass += ' scrubbed-target';

                return (
                  <div 
                    key={i} 
                    className={barClass}
                    style={{ 
                      height,
                      border: isCurrentHour ? '2px solid var(--accent-blue)' : undefined,
                    }}
                    onClick={() => setScrubbedHour(i === scrubbedHour ? null : i)}
                    onMouseEnter={() => setScrubbedHour(i)}
                    title={`${i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`} in ${homeCity.name} ${isCurrentHour ? '(Current Hour)' : ''}`}
                  />
                );
              })}
            </div>
            <div className="timeline-labels">
              <span>12a</span>
              <span>3a</span>
              <span>6a</span>
              <span>9a</span>
              <span>12p</span>
              <span>3p</span>
              <span>6p</span>
              <span>9p</span>
            </div>
          </div>
        </section>

        {/* Time Travel active indicator banner */}
        {scrubbedHour !== null && (
          <div className="timeline-status-banner">
            <span>
              🕰️ <strong>Time Travel Mode</strong>: Showing times for <strong>{scrubbedHour === 0 ? '12 AM' : scrubbedHour === 12 ? '12 PM' : scrubbedHour > 12 ? `${scrubbedHour - 12} PM` : `${scrubbedHour} AM`}</strong> (Home)
            </span>
            <button className="btn-reset-time" onClick={() => setScrubbedHour(null)}>
              Reset to Live Time
            </button>
          </div>
        )}
        
        {/* Responsive Zones Grid */}
        <section className="zones-grid">
          {filteredGridCities.map(city => {
            const isFav = favorites.includes(city.id);
            const isHome = homeCity.id === city.id;
            const hourOffset = getHourDifference(city.timezone, homeCity.timezone);
            
            return (
              <div key={city.id} className="zone-card">
                <div className="zone-header">
                  <div className="zone-name">
                    <h3>{city.name}</h3>
                    <p>{city.country}</p>
                  </div>
                  
                  <div className="zone-card-actions">
                    {/* Make Favorite */}
                    <button 
                      className={`btn-card-action ${isFav ? 'favorite-active' : ''}`}
                      onClick={() => toggleFavorite(city.id)}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star size={16} fill={isFav ? "currentColor" : "none"} />
                    </button>

                    {/* Set as Home Timezone */}
                    <button 
                      className="btn-card-action"
                      style={{ color: isHome ? 'var(--accent-blue)' : undefined }}
                      onClick={() => handleSetHomeCity(city)}
                      title={isHome ? "This is your home city" : "Set as home city"}
                    >
                      <MapPin size={16} fill={isHome ? "currentColor" : "none"} />
                    </button>

                    {/* Remove from layout entirely */}
                    <button 
                      className="btn-card-action"
                      onClick={() => handleAddCityToGrid(city)}
                      title="Remove card"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="zone-time">
                  <h1>{formatTime(activeDate, city.timezone)}</h1>
                  <p>
                    <span className="badge" style={{ marginRight: '6px' }}>{formatOffsetLabel(hourOffset)}</span>
                    {getTimezoneAbbreviation(activeDate, city.timezone)} • {getUTCOffsetLabel(activeDate, city.timezone)}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredGridCities.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              No active timezone cards match your filter. Click <strong>Add Zone</strong> or clear your search query.
            </div>
          )}
        </section>
      </main>

      {/* Interactive Modal - Add Zone & Filter Regions */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add World Timezone</h2>
              <button className="btn-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Region Selector Tabs */}
              <div className="modal-tabs">
                {['All', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'].map(tab => (
                  <button 
                    key={tab}
                    className={`tab-btn ${modalRegionTab === tab ? 'active' : ''}`}
                    onClick={() => setModalRegionTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Search Container */}
              <div className="modal-search">
                <Search className="modal-search-icon" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by city, country, or zone name..." 
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Dynamic scrollable cities search list */}
              <div className="cities-list">
                {filteredAddableCities.map(city => {
                  const isAlreadyAdded = gridCities.some(c => c.id === city.id);
                  
                  return (
                    <div 
                      key={city.id} 
                      className="city-item"
                      onClick={() => handleAddCityToGrid(city)}
                    >
                      <div className="city-item-info">
                        <h4>{city.name}</h4>
                        <p>{city.country} • {city.region}</p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="city-item-timezone">
                          {getTimezoneAbbreviation(currentTime, city.timezone)}
                        </span>
                        
                        <button 
                          className="btn-primary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            backgroundColor: isAlreadyAdded ? 'rgba(59, 130, 246, 0.1)' : undefined,
                            color: isAlreadyAdded ? 'var(--accent-blue)' : undefined,
                            border: isAlreadyAdded ? '1px solid var(--accent-blue)' : 'none',
                            boxShadow: isAlreadyAdded ? 'none' : undefined
                          }}
                        >
                          {isAlreadyAdded ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} /> Active
                            </span>
                          ) : (
                            'Add Card'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredAddableCities.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No countries or cities found matching your filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
