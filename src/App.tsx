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
  Check,
  Users,
  CalendarDays,
  MoreHorizontal
} from 'lucide-react';
import PlanningWorkspace from './PlanningWorkspace';
import { zoneAbbreviation as getTimezoneAbbreviation } from './meeting';
import './WorldClock.css';

export interface City {
  id: string;
  name: string;
  country: string;
  region: string;
  timezone: string;
}

export interface Person {
  id: string;
  name: string;
  cityId: string;
  workStart?: string;
  workEnd?: string;
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
  { id: 'lima', name: 'Lima', country: 'Peru', region: 'Americas', timezone: 'America/Lima' },
  { id: 'santiago', name: 'Santiago', country: 'Chile', region: 'Americas', timezone: 'America/Santiago' },
  { id: 'denver', name: 'Denver', country: 'United States', region: 'Americas', timezone: 'America/Denver' },
  { id: 'phoenix', name: 'Phoenix', country: 'United States', region: 'Americas', timezone: 'America/Phoenix' },
  { id: 'anchorage', name: 'Anchorage', country: 'United States', region: 'Americas', timezone: 'America/Anchorage' },
  { id: 'miami', name: 'Miami', country: 'United States', region: 'Americas', timezone: 'America/New_York' },
  { id: 'montevideo', name: 'Montevideo', country: 'Uruguay', region: 'Americas', timezone: 'America/Montevideo' },
  { id: 'caracas', name: 'Caracas', country: 'Venezuela', region: 'Americas', timezone: 'America/Caracas' },
  { id: 'panama', name: 'Panama City', country: 'Panama', region: 'Americas', timezone: 'America/Panama' },
  { id: 'san-jose', name: 'San José', country: 'Costa Rica', region: 'Americas', timezone: 'America/Costa_Rica' },
  { id: 'havana', name: 'Havana', country: 'Cuba', region: 'Americas', timezone: 'America/Havana' },
  
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
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', region: 'Europe', timezone: 'Europe/Amsterdam' },
  { id: 'stockholm', name: 'Stockholm', country: 'Sweden', region: 'Europe', timezone: 'Europe/Stockholm' },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', region: 'Europe', timezone: 'Europe/Copenhagen' },
  { id: 'oslo', name: 'Oslo', country: 'Norway', region: 'Europe', timezone: 'Europe/Oslo' },
  { id: 'helsinki', name: 'Helsinki', country: 'Finland', region: 'Europe', timezone: 'Europe/Helsinki' },
  { id: 'dublin', name: 'Dublin', country: 'Ireland', region: 'Europe', timezone: 'Europe/Dublin' },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', region: 'Europe', timezone: 'Europe/Lisbon' },
  { id: 'vienna', name: 'Vienna', country: 'Austria', region: 'Europe', timezone: 'Europe/Vienna' },
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', region: 'Europe', timezone: 'Europe/Warsaw' },
  { id: 'prague', name: 'Prague', country: 'Czech Republic', region: 'Europe', timezone: 'Europe/Prague' },
  { id: 'budapest', name: 'Budapest', country: 'Hungary', region: 'Europe', timezone: 'Europe/Budapest' },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', region: 'Europe', timezone: 'Europe/Zurich' },
  { id: 'brussels', name: 'Brussels', country: 'Belgium', region: 'Europe', timezone: 'Europe/Brussels' },
  { id: 'bucharest', name: 'Bucharest', country: 'Romania', region: 'Europe', timezone: 'Europe/Bucharest' },
  { id: 'belgrade', name: 'Belgrade', country: 'Serbia', region: 'Europe', timezone: 'Europe/Belgrade' },
  { id: 'sofia', name: 'Sofia', country: 'Bulgaria', region: 'Europe', timezone: 'Europe/Sofia' },
  { id: 'zagreb', name: 'Zagreb', country: 'Croatia', region: 'Europe', timezone: 'Europe/Zagreb' },
  
  // Asia
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'Asia', timezone: 'Asia/Tokyo' },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', region: 'Asia', timezone: 'Asia/Hong_Kong' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', region: 'Asia', timezone: 'Asia/Dubai' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Asia', timezone: 'Asia/Singapore' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', region: 'Asia', timezone: 'Asia/Seoul' },
  { id: 'beijing', name: 'Beijing', country: 'China', region: 'Asia', timezone: 'Asia/Shanghai' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', region: 'Asia', timezone: 'Asia/Kolkata' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', region: 'Asia', timezone: 'Asia/Bangkok' },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', region: 'Asia', timezone: 'Asia/Jakarta' },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', region: 'Asia', timezone: 'Asia/Riyadh' },
  { id: 'manila', name: 'Manila', country: 'Philippines', region: 'Asia', timezone: 'Asia/Manila' },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia', timezone: 'Asia/Kuala_Lumpur' },
  { id: 'taipei', name: 'Taipei', country: 'Taiwan', region: 'Asia', timezone: 'Asia/Taipei' },
  { id: 'tel-aviv', name: 'Tel Aviv', country: 'Israel', region: 'Asia', timezone: 'Asia/Jerusalem' },
  { id: 'doha', name: 'Doha', country: 'Qatar', region: 'Asia', timezone: 'Asia/Qatar' },
  { id: 'karachi', name: 'Karachi', country: 'Pakistan', region: 'Asia', timezone: 'Asia/Karachi' },
  { id: 'dhaka', name: 'Dhaka', country: 'Bangladesh', region: 'Asia', timezone: 'Asia/Dhaka' },
  { id: 'ho-chi-minh', name: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'colombo', name: 'Colombo', country: 'Sri Lanka', region: 'Asia', timezone: 'Asia/Colombo' },

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
  { id: 'tunis', name: 'Tunis', country: 'Tunisia', region: 'Africa', timezone: 'Africa/Tunis' },
  { id: 'khartoum', name: 'Khartoum', country: 'Sudan', region: 'Africa', timezone: 'Africa/Khartoum' },
  { id: 'kampala', name: 'Kampala', country: 'Uganda', region: 'Africa', timezone: 'Africa/Kampala' },
  { id: 'dar-es-salaam', name: 'Dar es Salaam', country: 'Tanzania', region: 'Africa', timezone: 'Africa/Dar_es_Salaam' },
  { id: 'luanda', name: 'Luanda', country: 'Angola', region: 'Africa', timezone: 'Africa/Luanda' },
  { id: 'maputo', name: 'Maputo', country: 'Mozambique', region: 'Africa', timezone: 'Africa/Maputo' },
  { id: 'harare', name: 'Harare', country: 'Zimbabwe', region: 'Africa', timezone: 'Africa/Harare' },
  { id: 'antalya', name: 'Antananarivo', country: 'Madagascar', region: 'Africa', timezone: 'Indian/Antananarivo' },
  { id: 'port-louis', name: 'Port Louis', country: 'Mauritius', region: 'Africa', timezone: 'Indian/Mauritius' },
  { id: 'kigali', name: 'Kigali', country: 'Rwanda', region: 'Africa', timezone: 'Africa/Kigali' },
  { id: 'abidjan', name: 'Abidjan', country: "Côte d'Ivoire", region: 'Africa', timezone: 'Africa/Abidjan' },
  { id: 'bamako', name: 'Bamako', country: 'Mali', region: 'Africa', timezone: 'Africa/Bamako' },
  { id: 'lusaka', name: 'Lusaka', country: 'Zambia', region: 'Africa', timezone: 'Africa/Lusaka' },

  // Oceania
  { id: 'sydney', name: 'Sydney', country: 'Australia', region: 'Oceania', timezone: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', region: 'Oceania', timezone: 'Pacific/Auckland' },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', region: 'Oceania', timezone: 'Australia/Melbourne' },
  { id: 'honolulu', name: 'Honolulu', country: 'United States', region: 'Oceania', timezone: 'Pacific/Honolulu' },
  { id: 'suva', name: 'Suva', country: 'Fiji', region: 'Oceania', timezone: 'Pacific/Fiji' },
  { id: 'perth', name: 'Perth', country: 'Australia', region: 'Oceania', timezone: 'Australia/Perth' },
  { id: 'brisbane', name: 'Brisbane', country: 'Australia', region: 'Oceania', timezone: 'Australia/Brisbane' },
  { id: 'adelaide', name: 'Adelaide', country: 'Australia', region: 'Oceania', timezone: 'Australia/Adelaide' },
  { id: 'darwin', name: 'Darwin', country: 'Australia', region: 'Oceania', timezone: 'Australia/Darwin' },
  { id: 'hobart', name: 'Hobart', country: 'Australia', region: 'Oceania', timezone: 'Australia/Hobart' },
  { id: 'port-moresby', name: 'Port Moresby', country: 'Papua New Guinea', region: 'Oceania', timezone: 'Pacific/Port_Moresby' },
  { id: 'noumea', name: 'Nouméa', country: 'New Caledonia', region: 'Oceania', timezone: 'Pacific/Noumea' },
  { id: 'apia', name: 'Apia', country: 'Samoa', region: 'Oceania', timezone: 'Pacific/Apia' },
];

const DEFAULT_GRID_IDS = ['nyc', 'london', 'tokyo', 'dubai', 'sydney', 'sao-paulo'];
const DEFAULT_FAVORITE_IDS = ['london', 'tokyo', 'dubai', 'sydney'];

const App = () => {
  const [activeView, setActiveView] = useState<'clock' | 'people' | 'plan' | 'proposal'>('clock');
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

  const [homeWorkStart, setHomeWorkStart] = useState(() => localStorage.getItem('zonify_home_work_start') || '09:00');
  const [homeWorkEnd, setHomeWorkEnd] = useState(() => localStorage.getItem('zonify_home_work_end') || '17:00');

  const [homeCity, setHomeCity] = useState<City>(() => {
    const saved = localStorage.getItem('zonify_home');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* fallback */ }
    }
    return CITY_DATABASE.find(c => c.id === 'sydney') || CITY_DATABASE[0];
  });

  const [gridCities, setGridCities] = useState<City[]>(() => {
    const saved = localStorage.getItem('zonify_grid');
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved) as string[];
        return parsedIds.map(id => CITY_DATABASE.find(c => c.id === id)).filter(Boolean) as City[];
      } catch { /* fallback */ }
    }
    return DEFAULT_GRID_IDS.map(id => CITY_DATABASE.find(c => c.id === id)).filter(Boolean) as City[];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('zonify_favorites');
    if (saved) {
      try {
        return JSON.parse(saved) as string[];
      } catch { /* fallback */ }
    }
    return DEFAULT_FAVORITE_IDS;
  });

  const [autoTheme, setAutoTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('zonify_auto_theme');
    return saved ? saved === 'true' : true;
  });

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('zonify_people');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return [];
  });


  const removePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const saveWorkspacePerson = (person: Person) => {
    setPeople(prev => prev.some(item => item.id === person.id)
      ? prev.map(item => item.id === person.id ? person : item)
      : [...prev, person]);
  };

  const getPeopleForCity = (cityId: string) => people.filter(p => p.cityId === cityId);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);


  // --- UI & Application States ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrubbedHour, setScrubbedHour] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [openMobileCityActions, setOpenMobileCityActions] = useState<string | null>(null);
  
  // Modals & Popovers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalRegionTab, setModalRegionTab] = useState<string>('All');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const settingsRef = useRef<HTMLDivElement>(null);
  const mobileSettingsSheetRef = useRef<HTMLElement>(null);

  const homeHour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: homeCity.timezone, hour: 'numeric', hourCycle: 'h23',
  }).format(currentTime));
  const resolvedTheme = autoTheme ? (homeHour >= 6 && homeHour < 18 ? 'light' : 'dark') : theme;

  // Sync theme class to document body
  useEffect(() => {
    document.body.className = resolvedTheme === 'light' ? 'light-theme' : '';
    localStorage.setItem('zonify_theme', theme);
  }, [theme, resolvedTheme]);

  // Persistent stores sync
  useEffect(() => {
    localStorage.setItem('zonify_format', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    localStorage.setItem('zonify_seconds', String(showSeconds));
  }, [showSeconds]);

  useEffect(() => {
    localStorage.setItem('zonify_home_work_start', homeWorkStart);
    localStorage.setItem('zonify_home_work_end', homeWorkEnd);
  }, [homeWorkStart, homeWorkEnd]);

  useEffect(() => {
    localStorage.setItem('zonify_home', JSON.stringify(homeCity));
  }, [homeCity]);

  useEffect(() => {
    localStorage.setItem('zonify_grid', JSON.stringify(gridCities.map(c => c.id)));
  }, [gridCities]);

  useEffect(() => {
    localStorage.setItem('zonify_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('zonify_auto_theme', String(autoTheme));
  }, [autoTheme]);

  useEffect(() => {
    localStorage.setItem('zonify_people', JSON.stringify(people));
  }, [people]);

  // Click outside listener to dismiss settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inside = [settingsRef, mobileSettingsSheetRef]
        .some(ref => ref.current?.contains(target));
      if (!inside) setIsSettingsOpen(false);
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
      hourCycle: 'h23'
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
      return Math.round(diffMs / 900000) / 4;
    } catch {
      return 0;
    }
  };

  const formatOffsetLabel = (offset: number) => {
    return offset > 0 ? `+${offset}h` : offset < 0 ? `${offset}h` : '+0h';
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

  // --- Grid Filtering ---
  const filteredGridCities = gridCities.filter(city => {
    if (showFavoritesOnly && !favorites.includes(city.id)) return false;
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
    setHomeCity(CITY_DATABASE.find(c => c.id === 'sydney') || CITY_DATABASE[0]);
    setAutoTheme(true);
    setHomeWorkStart('09:00');
    setHomeWorkEnd('17:00');
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
    <div className={`app-container workspace-mode ${activeView === 'clock' ? 'clock-view' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-top-row">
            <div className="logo">
              <div className="logo-icon">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              Zonify
            </div>

            <div className="sidebar-actions mobile-only">
              <button 
                className="btn-icon" 
                onClick={() => {
                  setAutoTheme(false);
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                }}
                title={autoTheme ? `Auto (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})` : resolvedTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
          
        </div>

        <nav className="workspace-nav" aria-label="Workspace">
          <span className="workspace-nav-title">WORKSPACE</span>
          <button className={activeView === 'clock' ? 'active' : ''} onClick={() => setActiveView('clock')}><Globe size={17} /> World clock</button>
          <button className={activeView === 'plan' || activeView === 'proposal' ? 'active' : ''} onClick={() => setActiveView('plan')}><CalendarDays size={17} /> Plan a time</button>
          <button className={activeView === 'people' ? 'active' : ''} onClick={() => setActiveView('people')}><Users size={17} /> People &amp; places</button>
        </nav>
        
        {/* Local Time Card */}
        <div className="local-time-card">
          <div className="local-time-header">
            <MapPin size={12} /> HOME TIME
          </div>
          <div className="local-city" title={`${homeCity.name}, ${homeCity.country}`}>{homeCity.name}, {homeCity.country}</div>
          <div className="local-time">
            {formatTime(activeDate, homeCity.timezone, showSeconds && scrubbedHour === null)}
          </div>
          <div className="local-date">
            {formatDate(activeDate, homeCity.timezone)} • {getTimezoneAbbreviation(activeDate, homeCity.timezone)}
          </div>
        </div>
        
        <div className="workspace-sidebar-footer">
          <button onClick={() => { setAutoTheme(false); setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); }}>
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main-content">
        {activeView === 'clock' ? <>
        <div className="mobile-clock-screen">
          <header className="mobile-clock-header"><div><h1>World clock</h1><p>Compare your saved cities.</p></div><button className="mobile-clock-add" aria-label="Add city" onClick={() => setIsAddModalOpen(true)}><Plus size={21} /></button></header>
          <div className="mobile-clock-search"><Search size={17} /><input aria-label="Search saved cities" placeholder="Search cities" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} /></div>
          <section className="mobile-clock-timeline workspace-panel" aria-label="Compare hour">
            <div className="clock-timeline-heading"><span><Clock size={16} /> Compare hour</span>{scrubbedHour === null ? <small>• Live</small> : <button onClick={() => setScrubbedHour(null)}><RefreshCw size={13} /> Back to live</button>}</div>
            <div className="mobile-clock-bars">{Array.from({ length: 24 }, (_, hour) => <button key={hour} type="button" className={hour === (scrubbedHour ?? currentHomeHourIndex) ? 'selected' : hour * 60 < Number(homeWorkEnd.slice(0, 2)) * 60 + Number(homeWorkEnd.slice(3)) && (hour + 1) * 60 > Number(homeWorkStart.slice(0, 2)) * 60 + Number(homeWorkStart.slice(3)) ? 'working' : ''} aria-label={hour + ':00 in ' + homeCity.name} aria-pressed={scrubbedHour === hour} onClick={() => setScrubbedHour(scrubbedHour === hour ? null : hour)} />)}</div>
            <div className="mobile-clock-labels"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span></div>
            {scrubbedHour !== null && <p className="clock-time-travel-note">Showing {scrubbedHour === 0 ? '12 AM' : scrubbedHour === 12 ? '12 PM' : scrubbedHour > 12 ? (scrubbedHour - 12) + ' PM' : scrubbedHour + ' AM'} in {homeCity.name}</p>}
          </section>
          <div className="clock-section-heading"><h2>Saved cities</h2><div className="clock-heading-actions"><span>{filteredGridCities.length} {filteredGridCities.length === 1 ? 'city' : 'cities'}</span><button className={showFavoritesOnly ? 'clock-favorites-filter active' : 'clock-favorites-filter'} aria-pressed={showFavoritesOnly} onClick={() => setShowFavoritesOnly(previous => !previous)}><Star size={14} /> Favorites</button></div></div>
          <div className="mobile-clock-list">
            {[...filteredGridCities].sort((a, b) => Number(b.id === homeCity.id) - Number(a.id === homeCity.id)).map(city => <article className="mobile-clock-row" key={city.id}>
              <div className="mobile-clock-city"><h3>{city.name} <span>{homeCity.id === city.id ? 'Home' : formatOffsetLabel(getHourDifference(city.timezone, homeCity.timezone))}</span></h3><p>{city.country}</p></div>
              <div className="mobile-clock-time"><strong>{formatTime(activeDate, city.timezone)}</strong><small>{formatDate(activeDate, city.timezone)} · {getTimezoneAbbreviation(activeDate, city.timezone)}</small></div>
              <button className={favorites.includes(city.id) ? 'mobile-clock-favorite active' : 'mobile-clock-favorite'} aria-label={favorites.includes(city.id) ? 'Remove ' + city.name + ' from favorites' : 'Add ' + city.name + ' to favorites'} onClick={() => toggleFavorite(city.id)}><Star size={16} fill={favorites.includes(city.id) ? 'currentColor' : 'none'} /></button>
              <button className="mobile-clock-more" aria-label={'More actions for ' + city.name} aria-expanded={openMobileCityActions === city.id} onClick={() => setOpenMobileCityActions(openMobileCityActions === city.id ? null : city.id)}><MoreHorizontal size={18} /></button>
              {openMobileCityActions === city.id && <div className="mobile-clock-actions"><button onClick={() => { handleSetHomeCity(city); setOpenMobileCityActions(null); }}><MapPin size={14} /> Set as home</button><button onClick={() => { handleAddCityToGrid(city); setOpenMobileCityActions(null); }}><X size={14} /> Remove city</button></div>}
              {getPeopleForCity(city.id).length > 0 && <div className="mobile-clock-people">{getPeopleForCity(city.id).map(person => <span key={person.id}>{getInitials(person.name)} · {person.name}</span>)}</div>}
            </article>)}
            {filteredGridCities.length === 0 && <p className="mobile-clock-empty">{showFavoritesOnly ? 'No favorites match. Star a city or show all cities.' : 'No saved cities match your search. Try another name or add a city.'}</p>}
          </div>
        </div>
        <div className="clock-desktop-content">
        <header className="header">
          <div>
            <h1>World clock</h1>
            <p>Compare local times across your saved cities.</p>
          </div>
          <div className="actions">
            <button className="btn-primary desktop-only" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} /> Add city
            </button>

            <button 
              className="btn-icon desktop-only" 
              onClick={() => {
                setAutoTheme(false);
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
              }}
              title={autoTheme ? `Auto (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})` : resolvedTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="settings-container" ref={settingsRef}>
              <button 
                className="btn-icon desktop-only" 
                onClick={() => setIsSettingsOpen(prev => !prev)}
                title="Configuration Settings"
              >
                <Settings size={20} />
              </button>
              
              {isSettingsOpen && (
                <div className="settings-dropdown">
                  <div className="settings-title">Settings</div>
                  
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

                  <div className="settings-option">
                    <span className="settings-label">Automatic theme</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={autoTheme}
                        onChange={(e) => setAutoTheme(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="settings-home-hours">
                    <span className="settings-label">Your working hours · Mon–Fri</span>
                    <div><input aria-label="Your work starts" type="time" value={homeWorkStart} onChange={event => setHomeWorkStart(event.target.value)} /><span>to</span><input aria-label="Your work ends" type="time" value={homeWorkEnd} onChange={event => setHomeWorkEnd(event.target.value)} /></div>
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
        <div className="clock-toolbar">
          <div className="clock-search"><Search size={16} /><input aria-label="Search saved cities" placeholder="Search saved cities" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} /></div>
          <div className="clock-heading-actions"><span>{searchQuery.trim() ? `${filteredGridCities.length} matching cities` : `${filteredGridCities.length} cities · ${gridCities.filter(city => favorites.includes(city.id)).length} favorites`}</span><button className={showFavoritesOnly ? 'clock-favorites-filter active' : 'clock-favorites-filter'} aria-pressed={showFavoritesOnly} onClick={() => setShowFavoritesOnly(previous => !previous)}><Star size={14} /> Favorites</button></div>
        </div>

        {/* Timeline Scrubbing Time Travel Section */}
        <section className="timeline-section">
          <div className="timeline-header">
            <div><strong><Clock size={16} /> Compare another hour</strong><p>Choose an hour in {homeCity.name} to preview each city’s local time.</p></div>
            {scrubbedHour === null ? <span className="clock-live-status">• Live now</span> : <button className="clock-live-status" onClick={() => setScrubbedHour(null)}><RefreshCw size={13} /> Back to live</button>}
          </div>

          <div className="timeline-graph-container">
            <div className="timeline-graph">
              {[...Array(24)].map((_, i) => {
                const startMinutes = Number(homeWorkStart.slice(0, 2)) * 60 + Number(homeWorkStart.slice(3));
                const endMinutes = Number(homeWorkEnd.slice(0, 2)) * 60 + Number(homeWorkEnd.slice(3));
                const isActive = i * 60 < endMinutes && (i + 1) * 60 > startMinutes;
                const isCurrentHour = i === currentHomeHourIndex;
                const isSelected = i === scrubbedHour;
                
                let barClass = 'timeline-bar';
                if (isActive) barClass += ' active';
                if (isSelected) barClass += ' scrubbed-target';

                return (
                  <button
                    type="button"
                    key={i} 
                    className={barClass}
                    style={{ border: isCurrentHour && scrubbedHour === null ? '2px solid var(--workspace-blue)' : undefined }}
                    onClick={() => setScrubbedHour(i === scrubbedHour ? null : i)}
                    aria-label={i + ':00 in ' + homeCity.name}
                    aria-pressed={isSelected}
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
              <Clock size={14} /> Showing <strong>{scrubbedHour === 0 ? '12 AM' : scrubbedHour === 12 ? '12 PM' : scrubbedHour > 12 ? `${scrubbedHour - 12} PM` : `${scrubbedHour} AM`}</strong> in {homeCity.name} across your saved cities
            </span>
            <button className="btn-reset-time" onClick={() => setScrubbedHour(null)}>
              Back to live
            </button>
          </div>
        )}
        
        <div className="clock-section-heading"><h2>Saved cities</h2><span>Star a favorite, set your home city, or remove a card</span></div>
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
                  <span className="zone-offset">{isHome ? 'Home' : formatOffsetLabel(hourOffset)}</span>
                  
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
                    {formatDate(activeDate, city.timezone)} · {getTimezoneAbbreviation(activeDate, city.timezone)}
                  </p>
                  {getPeopleForCity(city.id).length > 0 && (
                    <div className="card-people">
                      {getPeopleForCity(city.id).map(person => (
                        <div key={person.id} className="card-person" title={person.name}>
                          <div className="person-avatar small">{getInitials(person.name)}</div>
                          <span className="card-person-name">{person.name}</span>
                          <button className="card-person-remove" onClick={() => removePerson(person.id)}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredGridCities.length === 0 && (
            <div className="clock-empty workspace-panel">
              <Search size={24} />
              <h3>{showFavoritesOnly ? 'No favorites found' : 'No saved cities found'}</h3>
              <p>{showFavoritesOnly ? 'Star a saved city or turn off the favorites filter.' : 'Try another search or add a city to your world clock.'}</p>
              {showFavoritesOnly && <button className="workspace-secondary" onClick={() => setShowFavoritesOnly(false)}>Show all cities</button>}
              <button className="workspace-primary" onClick={() => setIsAddModalOpen(true)}><Plus size={16} /> Add city</button>
            </div>
          )}
        </section>
        </div>
        </> : <PlanningWorkspace
          view={activeView}
          onViewChange={setActiveView}
          cities={CITY_DATABASE}
          homeCity={homeCity}
          people={people}
          homeWorkStart={homeWorkStart}
          homeWorkEnd={homeWorkEnd}
          currentTime={currentTime}
          onSavePerson={saveWorkspacePerson}
          onRemovePerson={removePerson}
        />}
      </main>

      {/* Interactive Modal - Add Zone & Filter Regions */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add a city</h2>
              <button className="btn-close" aria-label="Close add city" onClick={() => setIsAddModalOpen(false)}>
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
                    <button
                      type="button"
                      key={city.id} 
                      className="city-item"
                      onClick={() => handleAddCityToGrid(city)}
                      aria-pressed={isAlreadyAdded}
                    >
                      <div className="city-item-info">
                        <h4>{city.name}</h4>
                        <p>{city.country} • {city.region}</p>
                      </div>
                      
                      <div className="city-item-controls">
                        <span className="city-item-timezone">
                          {getTimezoneAbbreviation(currentTime, city.timezone)}
                        </span>
                        
                        <span className={isAlreadyAdded ? 'city-item-action added' : 'city-item-action'}>
                          {isAlreadyAdded ? (
                            <span className="city-item-added-label">
                              <Check size={12} /> Added
                            </span>
                          ) : (
                            <><Plus size={12} /> Add</>
                          )}
                        </span>
                      </div>
                    </button>
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

      <nav className="workspace-mobile-nav" aria-label="Mobile navigation">
        <button className={activeView === 'clock' ? 'active' : ''} onClick={() => setActiveView('clock')}><Clock size={19} />Clock</button>
        <button className={activeView === 'plan' || activeView === 'proposal' ? 'active' : ''} onClick={() => setActiveView('plan')}><CalendarDays size={19} />Plan</button>
        <button className={activeView === 'people' ? 'active' : ''} onClick={() => setActiveView('people')}><Users size={19} />People</button>
        <button className={isSettingsOpen ? 'active' : ''} onClick={() => setIsSettingsOpen(previous => !previous)}><Settings size={19} />Settings</button>
      </nav>
      {isSettingsOpen && <div className="mobile-settings-backdrop" onClick={() => setIsSettingsOpen(false)}>
        <section className="mobile-settings-sheet" ref={mobileSettingsSheetRef} role="dialog" aria-modal="true" aria-label="Settings" onClick={event => event.stopPropagation()}>
          <div className="mobile-settings-heading"><h2>Settings</h2><button aria-label="Close settings" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button></div>
          <label>Light mode <input type="checkbox" checked={resolvedTheme === 'light'} onChange={() => { setAutoTheme(false); setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); }} /></label>
          <label>Automatic theme <input type="checkbox" checked={autoTheme} onChange={event => setAutoTheme(event.target.checked)} /></label>
          <label>24-hour format <input type="checkbox" checked={timeFormat === '24h'} onChange={event => setTimeFormat(event.target.checked ? '24h' : '12h')} /></label>
          <label>Show seconds <input type="checkbox" checked={showSeconds} onChange={event => setShowSeconds(event.target.checked)} /></label>
          <div className="mobile-home-hours"><span>Your working hours (Mon–Fri)</span><div><input aria-label="Your work starts" type="time" value={homeWorkStart} onChange={event => setHomeWorkStart(event.target.value)} /><span>to</span><input aria-label="Your work ends" type="time" value={homeWorkEnd} onChange={event => setHomeWorkEnd(event.target.value)} /></div></div>
          <button className="workspace-secondary" onClick={handleResetDefaults}><RefreshCw size={15} /> Reset to defaults</button>
        </section>
      </div>}
    </div>
  );
};

export default App;
