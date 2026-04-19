import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ArrowRight, Menu, X } from 'lucide-react';

const PlatformNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About Us' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'careers', label: 'Careers' },
    { id: 'contact', label: 'Contact' },
  ];

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Only do scrollspy on the home page
      if (location.pathname === '/') {
        const sections = ['home', 'features', 'about', 'pricing', 'security', 'careers', 'contact'];
        for (const id of sections.reverse()) {
          const el = document.getElementById(`${id}-section`);
          if (el && window.scrollY >= el.offsetTop - 120) {
            setActiveSection(id);
            break;
          }
        }
      } else {
        // If we are on a specific page (like /pricing), set active section to match
        const path = location.pathname.replace('/', '');
        setActiveSection(path || 'home');
      }
    };
    window.addEventListener('scroll', handleScroll);
    // Initial call
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    if (['careers', 'pricing'].includes(id)) {
      navigate(`/${id}`);
    } else {
      if (location.pathname === '/') {
        setTimeout(() => {
          document.getElementById(`${id}-section`)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        navigate(`/?scrollTo=${id}`);
      }
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100' : 'bg-white/80 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center py-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-gray-900 leading-none tracking-tight">HireWix</div>
              <div className="text-[10px] text-orange-500 font-semibold tracking-widest uppercase leading-none">by TeleiocraftSolutions</div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeSection === link.id ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'}`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA buttons - desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-orange-600 font-semibold text-sm transition-colors px-3 py-2">
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
            >
              Register Company <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hamburger - mobile */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`lg:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === link.id ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="w-full text-center py-3 rounded-xl font-semibold text-gray-700 border border-gray-200 hover:border-orange-400 hover:text-orange-600 transition-all text-sm">
              Login
            </button>
            <button onClick={() => { setMenuOpen(false); navigate('/register'); }} className="w-full text-center py-3 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all text-sm shadow-lg shadow-orange-500/30">
              Register Company
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PlatformNavbar;
