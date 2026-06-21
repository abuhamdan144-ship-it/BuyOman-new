import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  User, 
  X, 
  ChevronRight, 
  Info, 
  Sparkles, 
  Check, 
  Truck, 
  ShieldCheck, 
  Lock, 
  MessageSquare, 
  Send, 
  ArrowLeftRight, 
  Flame, 
  Calendar, 
  MapPin, 
  RotateCcw,
  Minus,
  Plus,
  PhoneCall,
  Menu,
  Activity,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from './data';
import { Product, CartItem, OrderTrack } from './types';

export default function App() {
  // Navigation & Category states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('Popularity');

  // Search input bound state
  const [searchInput, setSearchInput] = useState<string>('');

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Products state (loaded or locally verified)
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Comparison state
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Track Order state
  const [trackingId, setTrackingId] = useState<string>('');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<OrderTrack | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState<boolean>(false);

  // AI Chat Assistant state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Marhaban! 👋 Welcome to BuyOman. I am your AI assistant. Reach out if you need help looking up mobiles, cooling AC specs, refrigerators, freezers, or delivery tracking! How can I satisfy your home needs today?' }
  ]);
  const [isChatGenerating, setIsChatGenerating] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Cookie policy state
  const [cookieConsent, setCookieConsent] = useState<boolean>(true);

  // Checkout Form State
  const [fullname, setFullname] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [governorate, setGovernorate] = useState<string>('Muscat');
  const [city, setCity] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Muscat');
  const [extendedWarranty, setExtendedWarranty] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  // Fetch updated catalog on init
  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to resolve catalog API');
      })
      .then((data: Product[]) => {
        if (data && data.length > 0) {
          setAllProducts(data);
        }
      })
      .catch(err => {
        console.warn('Fallback to bundled static products data', err);
      });

    // Check cookie consent from localStorage
    const consent = localStorage.getItem('buyoman_cookie_consent');
    if (consent) {
      setCookieConsent(false);
    }
  }, []);

  // Sync scroll for chatbot stream
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatGenerating, isChatOpen]);

  // Execute Debounced Search filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Handle Cart Quick action helpers
  const handleAddToCart = (product: Product, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    // Check if item already exists in cart plus stock logic
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart; // limit stock
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, diff: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const nextQuantity = item.quantity + diff;
        const bounded = Math.max(1, Math.min(item.product.stock, nextQuantity));
        return { ...item, quantity: bounded };
      }
      return item;
    }));
  };

  const handleToggleWishlist = (productId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  // Comparisons toggler
  const handleToggleCompare = (product: Product, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setCompareList(prev => {
      const match = prev.find(item => item.id === product.id);
      if (match) {
        return prev.filter(item => item.id !== product.id);
      }
      if (prev.length >= 3) {
        // limit standard compare to 3 products
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  };

  const clearCompare = () => {
    setCompareList([]);
    setIsCompareOpen(false);
  };

  // Order Tracking trigger
  const handleTrackOrder = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const lookupId = customId || trackingId;
    if (!lookupId.trim()) return;

    setIsTrackingLoading(true);
    setTrackingError(null);
    setActiveTrackingOrder(null);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: lookupId })
      });
      if (!response.ok) {
        throw new Error('Order verification failed. Please try again.');
      }
      const data: OrderTrack = await response.json();
      setActiveTrackingOrder(data);
    } catch (err: any) {
      setTrackingError(err.message || 'Error communicating with tracker center');
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // AI Chat trigger with server-side proxy
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const nextUserMsg = { sender: 'user' as const, text: trimmed };
    setChatMessages(prev => [...prev, nextUserMsg]);
    setChatInput('');
    setIsChatGenerating(true);

    try {
      // Map system role strings
      const historyPayload = chatMessages.map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: historyPayload })
      });

      if (!res.ok) {
        throw new Error('Failed to reach AI support model');
      }

      const responseData = await res.json();
      setChatMessages(prev => [...prev, { sender: 'bot', text: responseData.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev, 
        { sender: 'bot', text: 'Error connecting to Omani AI server. I might be offline. Please try again or call our support line at +968 2455 1234.' }
      ]);
    } finally {
      setIsChatGenerating(false);
    }
  };

  // Handle Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !phone || !city || !shippingAddress) {
      alert("Please complete all checkout fields.");
      return;
    }

    const randomOrderId = `OM-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const warrantyCost = extendedWarranty ? Math.round(subtotal * 0.1) : 0;
    const shippingCost = subtotal >= 50 ? 0 : 5;
    const grandTotal = subtotal + warrantyCost + shippingCost;

    const receipt = {
      orderId: randomOrderId,
      customerName: fullname,
      phone: phone,
      governorate: governorate,
      city: city,
      address: shippingAddress,
      payment: paymentMethod,
      items: [...cart],
      warrantyCost,
      shippingCost,
      subtotal,
      total: grandTotal,
      timestamp: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setCheckoutSuccess(receipt);
    setCart([]); // Clear shopping basket
    setIsCheckoutOpen(false);
    // Autofill tracking for instant checkout tracking demonstration
    setTrackingId(randomOrderId);
  };

  // Accept cookies handler
  const handleAcceptCookies = () => {
    localStorage.setItem('buyoman_cookie_consent', 'true');
    setCookieConsent(false);
  };

  // Filter & Sort Logic
  const filteredProducts = allProducts.filter(p => {
    const categoryMatches = selectedCategory === 'All' || p.category === selectedCategory;
    const queryMatches = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const wishlistMatches = !showWishlistOnly || wishlist.includes(p.id);

    return categoryMatches && queryMatches && wishlistMatches;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'Price: Low to High') {
      return a.price - b.price;
    }
    if (sortOption === 'Price: High to Low') {
      return b.price - a.price;
    }
    // Default popularity is by stock (higher availability represents standard demand flow)
    return b.stock - a.stock;
  });

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const isFreeShipping = cartTotal >= 50;

  return (
    <div className="relative min-h-screen bg-[#fafafc] text-slate-900 selection:bg-brand-red selection:text-white">

      {/* ===== Header Bar ===== */}
      <header className="sticky top-0 z-50 bg-white/80 border-b border-slate-100 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-1.5 focus:outline-none">
            <span className="text-2xl font-extrabold tracking-tight text-brand-red">Buy<span className="text-slate-900 font-bold">Oman</span></span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#categories" className="hover:text-brand-red transition-colors">Categories</a>
            <a href="#products-showcase" className="hover:text-brand-red transition-colors" onClick={() => setSelectedCategory('All')}>Deals</a>
            <a href="#track-section" className="hover:text-brand-red transition-colors">Track Order</a>
            <a href="#support-section" className="hover:text-brand-red transition-colors">Support</a>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1 hover:text-brand-red transition-colors cursor-pointer text-slate-800"
            >
              <Sparkles className="w-4 h-4 text-brand-red animate-pulse" />
              <span>Ask AI AI Assistant</span>
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Live Search Bar */}
            <div className="relative hidden sm:block">
              <Search className="absolute top-2.5 left-3 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search specs, brands..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-48 xl:w-60 rounded-full bg-slate-100 py-1.5 pr-4 pl-9.5 text-sm focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-brand-red transition-all"
              />
              {searchInput && (
                <button 
                  onClick={() => setSearchInput('')}
                  className="absolute top-2.5 right-3 text-slate-400 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Favorites Filter Toggle */}
            <button 
              onClick={() => {
                setShowWishlistOnly(!showWishlistOnly);
                const target = document.getElementById('products-showcase');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`relative p-2 rounded-full transition-colors cursor-pointer ${showWishlistOnly ? 'bg-red-50 text-brand-red' : 'hover:bg-slate-100 text-slate-600'}`}
              title="View Wishlist"
            >
              <Heart className={`w-5 h-5 ${showWishlistOnly ? 'fill-brand-red' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
              title="Open Basket"
              id="cart-trigger-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {cart.reduce((s, c) => s + c.quantity, 0)}
                </span>
              )}
            </button>

            {/* Quick Profile Mock Tab */}
            <a 
              href="#track-section"
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors hidden sm:inline-block"
              title="Track Account Status"
            >
              <User className="w-5 h-5" />
            </a>

          </div>
        </div>
      </header>

      {/* ===== Hero Block ===== */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[580px] sm:min-h-[640px] flex items-center">
        {/* Abstract design nodes */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(226,35,26,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(15,23,42,0.8),transparent_70%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 flex flex-col md:flex-row items-center gap-12 w-full">
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3.5 py-1 text-xs font-semibold text-red-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sultanate-Wide Swift Express Delivery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.10]">
              Home Appliances & <br />
              <span className="text-brand-red">Mobiles</span> Delivered.
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-slate-300 mx-auto md:mx-0">
              Buy premium products from Apple, Samsung, LG, Hitachi and more with authentic 1-year brand warranty. Free delivery in Oman above OMR 50.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <a 
                href="#products-showcase" 
                className="rounded-full bg-brand-red px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-brand-red/20 hover:bg-red-600 transition-all cursor-pointer"
                onClick={() => setSelectedCategory('All')}
              >
                Shop Hot Deals
              </a>
              <a 
                href="#categories" 
                className="rounded-full border border-slate-700 bg-white/5 backdrop-blur px-6 py-3.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Browse Categories
              </a>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800 max-w-md mx-auto md:mx-0">
              <div>
                <p className="text-2xl font-extrabold text-white">100%</p>
                <p className="text-xs text-slate-400">Genuine Brand products</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">Oman-wide</p>
                <p className="text-xs text-slate-400">Doorstep delivery</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">AI-guided</p>
                <p className="text-xs text-slate-400">Shopping recommendations</p>
              </div>
            </div>

          </div>

          {/* Elegant Carousel showcase right side */}
          <div className="flex-1 w-full max-w-md md:max-w-none">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <div className="absolute -top-3 -right-3 rounded-full bg-brand-red text-[11px] font-bold text-white px-2.5 py-1 flex items-center gap-1 shadow-lg animate-bounce">
                <Flame className="w-3 h-3 fill-white" />
                <span>HOT SALE TODAY</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                    📱
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">TOP DEAL IN MOBILES</p>
                    <h3 className="font-bold text-lg text-white">Samsung Galaxy A55 5G</h3>
                  </div>
                </div>
                
                <p className="text-sm text-slate-300">
                  Secure massive storage with 256GB, beautiful Super AMOLED display and a state-of-the-art camera optimized for stunning Omani sunset scenery.
                </p>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <div>
                    <span className="text-2xl font-black text-white">OMR 119</span>
                    <span className="ml-2 text-xs text-slate-400 line-through">OMR 139</span>
                  </div>
                  <button 
                    onClick={() => {
                      const sampleProduct = PRODUCTS.find(p => p.id === 'p1');
                      if (sampleProduct) {
                        handleAddToCart(sampleProduct);
                        setIsCartOpen(true);
                      }
                    }}
                    className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-colors flex items-center gap-1 Cursor-pointer"
                  >
                    Add to Basket
                  </button>
                </div>
              </div>

              {/* Slider Dots indicators */}
              <div className="mt-5 flex justify-center gap-1.5 text-xs text-slate-600">
                <span className="h-1.5 w-6 rounded-full bg-brand-red" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== Category Grid Cards ===== */}
      <section className="py-16 bg-white" id="categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Shop by Category</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Explore premium collections carefully procured under genuine official warranties.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Mobiles', emoji: '📱', count: '120+ Products' },
              { label: 'Air Conditioners', emoji: '❄️', count: 'Complementary Installation' },
              { label: 'Fridges', emoji: '🧊', count: '45+ Products' },
              { label: 'Washing Machines', emoji: '🧺', count: '30+ Products' },
              { label: 'Cookers & Ovens', emoji: '🍳', count: '20+ Products' },
              { label: 'Small Appliances', emoji: '🔌', count: '80+ Products' }
            ].map((cat, idx) => (
              <a 
                key={idx}
                href="#products-showcase"
                onClick={() => {
                  setSelectedCategory(cat.label);
                  setShowWishlistOnly(false);
                }}
                className={`group flex flex-col justify-between rounded-xl border p-5 text-left transition-all ${
                  selectedCategory === cat.label 
                    ? 'border-brand-red bg-red-50/20 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <span className="text-3xl block filter drop-shadow mb-4 transform group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-red transition-colors">{cat.label}</h3>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block font-medium">{cat.count}</span>
              </a>
            ))}
          </div>

        </div>
      </section>

      {/* ===== Products list section (Deals Catalog) ===== */}
      <section className="py-16 bg-[#fafafc]" id="products-showcase">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          {/* Header row and category chips */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-6 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {showWishlistOnly ? 'My Wishlist Items' : `${selectedCategory} Collection`}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Showing {sortedProducts.length} authenticated product{sortedProducts.length !== 1 ? 's' : ''} available.
              </p>
            </div>

            {/* Controls panel: Sort & Active status */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Category selector chips */}
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Mobiles', 'Air Conditioners', 'Fridges', 'Washing Machines', 'Cookers & Ovens', 'Small Appliances'].map(opt => (
                  <button 
                    key={opt}
                    onClick={() => {
                      setSelectedCategory(opt);
                      setShowWishlistOnly(false);
                    }}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                      selectedCategory === opt && !showWishlistOnly
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Sort selector dropdown */}
              <div className="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 ml-auto lg:ml-0">
                <span className="font-medium text-slate-400">Sort:</span>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold text-slate-800 pr-1"
                >
                  <option>Popularity</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>

            </div>
          </div>

          {/* Grid Layout of products */}
          {sortedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 px-4 text-center">
              <ShoppingBag className="mx-auto w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-800 font-bold text-lg">No authentic products match your criteria</p>
              <p className="text-slate-500 text-xs mt-1">Try resetting category filters, cleaning search string, or adding items to favorites.</p>
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchInput('');
                  setShowWishlistOnly(false);
                }}
                className="mt-4 rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-bold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedProducts.map((p) => {
                const isItemInWishlist = wishlist.includes(p.id);
                const isItemInCompare = compareList.some(item => item.id === p.id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="group relative flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xl cursor-pointer"
                  >
                    
                    {/* Badge */}
                    {p.oldPrice && (
                      <span className="absolute top-3 left-3 z-10 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white tracking-wide">
                        SAVE OMR{p.oldPrice - p.price}
                      </span>
                    )}

                    {/* Stock status indicator */}
                    {p.stock <= 3 && p.stock > 0 && (
                      <span className="absolute top-3 right-12 z-10 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        Only {p.stock} left
                      </span>
                    )}

                    {/* Heart button */}
                    <button 
                      onClick={(e) => handleToggleWishlist(p.id, e)}
                      className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md bg-white/70 border border-slate-100 shadow transition-all cursor-pointer ${
                        isItemInWishlist ? 'text-brand-red' : 'text-slate-400 hover:text-brand-red'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isItemInWishlist ? 'fill-brand-red' : ''}`} />
                    </button>

                    <div>
                      {/* Product display */}
                      <div className="relative rounded-lg bg-slate-50 flex items-center justify-center p-8 text-6xl h-44 mb-4 select-none group-hover:scale-[1.02] transition-transform">
                        {p.imageEmoji}
                      </div>

                      {/* Brand & info details */}
                      <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{p.brand}</p>
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-red transition-colors text-sm line-clamp-2 mt-1 min-h-[40px]">
                        {p.name}
                      </h3>

                      {/* Technical Spec Chips preview */}
                      <div className="flex flex-wrap gap-1 mt-2.5 mb-3.5">
                        {Object.entries(p.specs).slice(0, 2).map(([key, value]) => (
                          <span key={key} className="inline-block rounded bg-slate-100 text-[10px] text-slate-500 px-1.5 py-0.5 font-medium">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      {/* Price layout */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-black text-slate-900">OMR {p.price}</span>
                        {p.oldPrice && (
                          <span className="text-xs text-slate-400 line-through">OMR {p.oldPrice}</span>
                        )}
                        <span className="text-[11px] text-slate-400 ml-auto">Excl. VAT</span>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex items-center gap-1.5 mt-auto">
                        
                        {/* Compare button toggle */}
                        <button 
                          onClick={(e) => {
                            handleToggleCompare(p, e);
                            setIsCompareOpen(true);
                          }}
                          className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            isItemInCompare 
                              ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-950'
                          }`}
                          title={isItemInCompare ? 'Remove Comparison' : 'Add to Comparison'}
                        >
                          <ArrowLeftRight className="w-4.5 h-4.5" />
                        </button>

                        {/* Add to Cart button */}
                        <button 
                          onClick={(e) => {
                            handleAddToCart(p, e);
                            // Highlight basket visual
                            const trigger = document.getElementById('cart-trigger-btn');
                            trigger?.classList.add('scale-110', 'bg-red-50');
                            setTimeout(() => trigger?.classList.remove('scale-110', 'bg-red-50'), 400);
                          }}
                          disabled={isOutOfStock}
                          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isOutOfStock 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-slate-900 hover:bg-brand-red text-white'
                          }`}
                        >
                          <ShoppingBag className="w-4.5 h-4.5" />
                          <span>{isOutOfStock ? 'Sold Out' : 'Add to Basket'}</span>
                        </button>

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ===== Tracking shipment ID Section ===== */}
      <section className="py-16 bg-white border-y border-slate-100" id="track-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Track Your Shipment</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Enter your unique order tracker code (e.g. OM-9821) to check delivery stages across Oman.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
            <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Order ID (e.g. OM-9821, OM-4701)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 px-4 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-brand-red focus:border-brand-red uppercase"
                />
              </div>
              <button 
                type="submit"
                disabled={isTrackingLoading}
                className="rounded-xl bg-slate-900 hover:bg-brand-red text-white py-3.5 px-8 text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTrackingLoading ? 'Retrieving...' : 'Track Package'}
              </button>
            </form>

            {/* Quick pre-fill codes */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium font-mono">Sample codes:</span>
              <button 
                onClick={() => {
                  setTrackingId('OM-9821');
                  handleTrackOrder(undefined, 'OM-9821');
                }}
                className="rounded-full bg-white border px-3 py-1 font-semibold text-slate-600 hover:border-slate-800 transition-colors cursor-pointer"
              >
                OM-9821 (Samsung A55 Shipment to Sohar Hub)
              </button>
              <button 
                onClick={() => {
                  setTrackingId('OM-4701');
                  handleTrackOrder(undefined, 'OM-4701');
                }}
                className="rounded-full bg-white border px-3 py-1 font-semibold text-slate-600 hover:border-slate-800 transition-colors cursor-pointer"
              >
                OM-4701 (Split AC Technical Preparation)
              </button>
            </div>

            {/* Tracking Output Window */}
            <AnimatePresence mode="wait">
              {activeTrackingOrder && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="mt-8 border-t border-slate-100 pt-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 font-medium font-mono uppercase">Tracking Code: {activeTrackingOrder.orderId}</p>
                      <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">{activeTrackingOrder.customerName}'s Order</h4>
                    </div>
                    <div className="text-right sm:text-left">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        activeTrackingOrder.status === 'Shipped' 
                          ? 'bg-blue-100 text-blue-700' 
                          : activeTrackingOrder.status === 'processing' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Current Status: {activeTrackingOrder.status}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">Located at: <span className="text-slate-800 font-bold">{activeTrackingOrder.location}</span></p>
                    </div>
                  </div>

                  {/* Shipment milestones timeline */}
                  <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activeTrackingOrder.steps.map((step, sIdx) => {
                      const isStepDone = step.done;
                      return (
                        <div key={sIdx} className="flex gap-4 items-start relative">
                          <div className={`relative z-10 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isStepDone 
                              ? 'bg-brand-red border-brand-red text-white' 
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {isStepDone ? (
                              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                            ) : (
                              <span className="text-[10px] font-bold font-mono">{sIdx + 1}</span>
                            )}
                          </div>
                          
                          <div>
                            <span className="text-[10px] font-mono text-slate-400">{step.time}</span>
                            <h5 className={`font-bold text-sm ${isStepDone ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.title}
                            </h5>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </motion.div>
              )}

              {trackingError && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-center text-red-700 text-xs font-semibold"
                >
                  {trackingError}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </section>

      {/* ===== Brand Strip and Core Corporate Highlights ===== */}
      <section className="py-12 bg-[#fafafc] border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-around gap-8 opacity-45">
            {['SAMSUNG', 'LG', 'HITACHI', 'BOSCH', 'PHILIPS', 'TOSHIBA'].map((brand, bIdx) => (
              <span key={bIdx} className="font-mono text-lg font-black tracking-widest text-slate-950">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Benefits Summary */}
      <section className="py-16 bg-white" id="support-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
            
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-brand-red text-2xl">
                <Truck className="w-6 h-6 shrink-0" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Oman-Wide Delivery</h4>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                Free shipping directly to your door anywhere in Oman for all orders above OMR 50. Flat OMR 5 shipping fee on other tasks.
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-brand-red text-2xl">
                <ShieldCheck className="w-6 h-6 shrink-0" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Genuine Local Warranty</h4>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                Every deal ships with automatic 1-year brand support. Option to procure dynamic premium 5-year coverage.
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-brand-red text-2xl">
                <Lock className="w-6 h-6 shrink-0" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Secure Muscat Online checkout</h4>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                SSL-secure payment processing for Bank Muscat accounts, Apple Pay, Visa and MasterCard checks.
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-brand-red text-2xl">
                <PhoneCall className="w-6 h-6 shrink-0" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">24/7 Sultanate Support Desk</h4>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                Instant answers to product requests via active AI chatbot, direct WhatsApp support, and our central voice line.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== Testimonials Section ===== */}
      <section className="py-16 bg-[#fafafc] border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">What Customers Say</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Feedback from households who purchased our certified electronics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: '"Ordered the LG 1.5 Ton Split AC on Sunday afternoon. By Tuesday morning, their crew had installed it seamlessly. Price was unbeatable compared to shopping centers."', name: 'Ahmed Al Balushi', loc: 'Muscat (Muttrah)' },
              { text: '"Double checked with their AI Chat helper on whether the refrigerator fits my kitchen measurements. It perfectly matched specifications. Speedy free delivery to Seeb!"', name: 'Fatma Al Hinai', loc: 'Seeb' },
              { text: '"Extremely satisfied with the Apple iPhone 15 buy. Received with official warranty papers verified. Checked parcel logistics route using track orders easily."', name: 'Salim Al Kindi', loc: 'Sohar' }
            ].map((test, tIdx) => (
              <div key={tIdx} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="text-brand-red text-sm mb-3">★★★★★</div>
                <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                  {test.text}
                </p>
                <div className="border-t border-slate-50 pt-3">
                  <p className="text-xs font-extrabold text-slate-900 font-sans">{test.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">{test.loc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===== Newsletter signup area ===== */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl bg-slate-950 p-8 md:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(226,35,26,0.14),transparent_50%)]" />
            
            <div className="relative space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">Get Weekly Omani Deals First</h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Receive curated special clearance promos on mobiles, ACs and fridge appliances. Absolutely zero spam. Unsubscribe with one click.
              </p>

              {newsletterSubscribed ? (
                <div className="rounded-full bg-brand-red/20 border border-brand-red/30 py-3 text-xs font-bold text-red-200">
                  Awesome! You have successfully subscribed to BuyOman promotions!
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail.trim()) {
                      setNewsletterSubscribed(true);
                    }
                  }} 
                  className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
                >
                  <input 
                    type="email"
                    placeholder="Your email address"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 rounded-full border-0 bg-white/10 px-5 py-3 text-xs font-medium placeholder:text-slate-400 text-white focus:outline-none focus:ring-1.5 focus:ring-brand-red text-center sm:text-left"
                  />
                  <button 
                    type="submit"
                    className="rounded-full bg-brand-red hover:bg-red-600 font-bold text-xs text-white py-3 px-6 cursor-pointer"
                  >
                    Subscribe Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-24 sm:pb-12 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 border-b border-slate-900 pb-12 mb-8">
            
            <div className="col-span-2 space-y-4">
              <span className="text-xl font-black text-brand-red">Buy<span className="text-white">Oman</span></span>
              <p className="text-[11px] leading-relaxed pr-6 text-slate-500">
                Your premier e-commerce store for mobiles and household appliances in the Sultanate of Oman. Combining official localized warranty with fast, secure delivery and 24/7 AI shopping assistance.
              </p>
              
              <div className="pt-2">
                <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Accepted Payment Systems:</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Bank Muscat Transfer', 'Visa', 'MasterCard', 'Apple Pay', 'Cash on Delivery'].map((pay, pIdx) => (
                    <span key={pIdx} className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                      {pay}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-[11px] uppercase tracking-wider">Catalog</h5>
              <ul className="space-y-1.5 text-slate-500 font-medium">
                <li><a href="#products-showcase" onClick={() => setSelectedCategory('Mobiles')} className="hover:text-white">Mobile Phones</a></li>
                <li><a href="#products-showcase" onClick={() => setSelectedCategory('Air Conditioners')} className="hover:text-white">Air Conditioners</a></li>
                <li><a href="#products-showcase" onClick={() => setSelectedCategory('Fridges')} className="hover:text-white">Fridges & Freezers</a></li>
                <li><a href="#products-showcase" onClick={() => setSelectedCategory('Washing Machines')} className="hover:text-white">Washing Machines</a></li>
                <li><a href="#products-showcase" onClick={() => setSelectedCategory('Small Appliances')} className="hover:text-white">Kitchen Appliances</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-[11px] uppercase tracking-wider">Client Support</h5>
              <ul className="space-y-1.5 text-slate-500 font-medium">
                <li><a href="#track-section" className="hover:text-white">Track Order</a></li>
                <li><a href="#support-section" className="hover:text-white font-bold text-brand-red">Complimentary installation</a></li>
                <li><a href="#support-section" className="hover:text-white">Warranty Extensions</a></li>
                <li><a href="#track-section" className="hover:text-white">Muscat pick-up point</a></li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 lg:col-span-1">
              <h5 className="font-extrabold text-white text-[11px] uppercase tracking-wider">Store Hotline</h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Contact Muscat Central office:<br />
                <span className="text-slate-200 font-bold block pt-1 font-mono hover:text-brand-red cursor-pointer">+968 2455 1234</span>
                Monday to Saturday 9:00 AM - 10:00 PM.
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[10px] text-slate-600 font-semibold font-sans">
            <span>© 2026 BuyOman Retail Store. All rights reserved. Oman registered company.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400">Terms of Use</a>
              <a href="#" className="hover:text-slate-400">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400">Merchant Policies</a>
            </div>
          </div>

        </div>
      </footer>

      {/* ===== Floating Mobile Bottom Bar ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 block sm:hidden bg-white border-t border-slate-100 shadow-xl py-2 Safe-Bottom-Padding">
        <div className="flex justify-around items-center px-4">
          <a href="#" className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-red transition-all">
            <span className="text-lg">🏠</span>
            <span className="text-[9px] font-bold">Home</span>
          </a>
          <a href="#categories" className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-red transition-all">
            <span className="text-lg">📂</span>
            <span className="text-[9px] font-bold">Categories</span>
          </a>
          <a 
            href="#products-showcase" 
            onClick={() => {
              setSelectedCategory('All');
              setShowWishlistOnly(false);
            }} 
            className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-red transition-all"
          >
            <span className="text-lg">🔥</span>
            <span className="text-[9px] font-bold">Deals</span>
          </a>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-red transition-all cursor-pointer"
          >
            <span className="text-lg text-brand-red animate-pulse">✨</span>
            <span className="text-[9px] font-bold text-brand-red">Ask AI</span>
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-red transition-all cursor-pointer"
          >
            <span className="text-lg relative">
              🛒
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-950 text-[8px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </span>
            <span className="text-[9px] font-bold">Cart</span>
          </button>
        </div>
      </nav>

      {/* ===== Interactive Shopping Cart Side Drawer ===== */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl p-6 flex flex-col justify-between"
            >
              
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-red" />
                  <h3 className="text-lg font-extrabold text-slate-900">Your Shopping Basket</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <span className="text-5xl block mb-2 font-mono">🛒</span>
                    <p className="font-bold text-slate-800">Your basket is currently empty</p>
                    <p className="text-slate-400 text-xs mt-1">Browse our electronics catalog or ask our AI assistant for deal recommendations!</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 rounded-full bg-slate-950 text-white px-5 py-2 text-xs font-bold"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Free shipping banner */}
                    <div className={`p-3 rounded-xl border flex gap-3 items-center ${isFreeShipping ? 'bg-green-50 border-green-200 text-green-950' : 'bg-slate-50 border-slate-200 text-slate-950'}`}>
                      <Truck className={`w-5 h-5 shrink-0 ${isFreeShipping ? 'text-green-600' : 'text-slate-400'}`} />
                      <div className="text-xs">
                        {isFreeShipping ? (
                          <p className="font-bold">🎉 Congratulations! Free Oman Delivery Unlocked.</p>
                        ) : (
                          <p className="font-medium">
                            Add <span className="font-extrabold text-brand-red">OMR {50 - cartTotal}</span> more to unlock <span className="font-extrabold">FREE home delivery</span> (OMR 5 saved).
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 justify-between">
                          <div className="text-3xl flex h-16 w-16 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
                            {item.product.imageEmoji}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate uppercase tracking-tight">{item.product.brand}</h4>
                            <p className="text-slate-900 text-sm font-bold truncate">{item.product.name}</p>
                            <span className="text-slate-950 font-extrabold text-xs block mt-1">OMR {item.product.price} each</span>
                          </div>

                          {/* Quantity control actions */}
                          <div className="flex flex-col justify-between items-end shrink-0">
                            <button 
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="text-slate-400 hover:text-brand-red transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 bg-white rounded-full border border-slate-200 p-0.5 shadow-sm text-xs mt-2">
                              <button 
                                onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-slate-900 px-1 font-mono tracking-tighter">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Basket Footer total calculations */}
              {cart.length > 0 && (
                <div className="border-t pt-4 space-y-4 bg-white">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-medium text-slate-500">
                      <span>Basket Subtotal</span>
                      <span>OMR {cartTotal}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-500">
                      <span>Oman Shipping Delivery Fee</span>
                      <span>{isFreeShipping ? 'FREE' : 'OMR 5'}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-950 text-base pt-2 border-t">
                      <span>Grand Total</span>
                      <span className="text-brand-red font-extrabold">OMR {cartTotal + (isFreeShipping ? 0 : 5)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setCart([])}
                      className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Empty Basket
                    </button>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className="rounded-xl bg-slate-950 hover:bg-brand-red py-3 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Checkout Form Overlaid drawer ===== */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl p-6 md:p-8 w-full max-w-2xl mx-auto"
            >
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Secure Checkout</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide Omani local shipping delivery details (OMR Express Delivery).</p>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700">Full Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ahmed Al Balushi"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-1.5 focus:ring-brand-red"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700">Oman Telephone Contacts</label>
                    <input 
                      type="tel"
                      required
                      placeholder="+968 9123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-1.5 focus:ring-brand-red font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700">Oman Governorate</label>
                    <select 
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 px-3 bg-white focus:outline-none focus:ring-1.5 focus:ring-brand-red font-bold"
                    >
                      {['Muscat', 'Al Batinah North', 'Al Batinah South', 'Dhofar', 'Ad Dakhiliyah', 'Ash Sharqiyah North', 'Ash Sharqiyah South', 'Ad Dhahirah', 'Al Buraimi', 'Al Wusta', 'Musandam'].map(gov => (
                        <option key={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700">City / District</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Seeb, Al Khuwair, Ruwi, Sohar, Salalah"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-1.5 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-extrabold text-slate-700">Detailed Shipping Street Address</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="e.g. Way 4012, House 154, Near Muscat Grand Mall"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-1.5 focus:ring-brand-red text-sm"
                  />
                </div>

                {/* Extended warranty selection option */}
                <div className="rounded-xl border border-red-100 bg-red-50/20 p-4 flex gap-3 items-start select-none">
                  <input 
                    type="checkbox"
                    id="extended-w"
                    checked={extendedWarranty}
                    onChange={(e) => setExtendedWarranty(e.target.checked)}
                    className="mt-0.5 accent-brand-red scale-110 shrink-0"
                  />
                  <label htmlFor="extended-w" className="cursor-pointer">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-brand-red shrink-0" />
                      Upgrade to "Safeguard Plus" 5-Year Extended Warranty Plan (+10% cost)
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Protect against unexpected voltage spikes and breakdowns with home service checks on ACs or fridges.</p>
                  </label>
                </div>

                {/* Payment channel select */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-extrabold text-slate-700">Payment Gateway Selection</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'Bank Muscat', label: 'Bank Muscat Transfer' },
                      { key: 'Apple Pay', label: 'Apple Pay' },
                      { key: 'Credit Card', label: 'Visa / MasterCard' },
                      { key: 'Cash', label: 'Cash on Delivery' }
                    ].map(pay => (
                      <div 
                        key={pay.key}
                        onClick={() => setPaymentMethod(pay.key)}
                        className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${
                          paymentMethod === pay.key 
                            ? 'border-brand-red bg-red-50/10 font-bold text-brand-red shadow-sm' 
                            : 'border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        <p className="text-xs">{pay.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button 
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="rounded-lg border border-slate-200 py-2.5 px-5 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="rounded-lg bg-slate-950 hover:bg-brand-red py-2.5 px-8 font-bold text-xs text-white transition-colors"
                  >
                    Submit Order (Secure POS)
                  </button>
                </div>
              </form>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Order Placement Receipt Modal ===== */}
      <AnimatePresence>
        {checkoutSuccess && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg rounded-2xl bg-white border shadow-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-brand-red" />
                
                <div className="text-center space-y-2 mb-6">
                  <span className="text-5xl block">🎉</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Order successfully Confirmed</p>
                  <h3 className="text-xl font-extrabold text-slate-900">Thank You for shopping with BuyOman!</h3>
                  <p className="text-xs text-slate-500">Your shipment is being processed by central warehouse logistics.</p>
                </div>

                {/* Printable Receipt layout */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono">ORDER TRACKING ID:</p>
                      <p className="font-black text-slate-950 text-sm font-mono tracking-tight">{checkoutSuccess.orderId}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-[9px] font-bold uppercase">
                        State: processing
                      </span>
                    </div>
                  </div>

                  {/* Customer summary */}
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <p className="font-bold text-slate-400 text-[10px]">RECIPIENT:</p>
                      <p className="font-extrabold text-slate-900">{checkoutSuccess.customerName}</p>
                      <p className="font-mono pt-1">{checkoutSuccess.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-400 text-[10px]">ADDRESS:</p>
                      <p className="font-extrabold text-slate-900">{checkoutSuccess.city}, {checkoutSuccess.governorate}</p>
                      <p className="truncate pt-1">{checkoutSuccess.address}</p>
                    </div>
                  </div>

                  {/* Products purchased loop */}
                  <div className="border-t pt-3 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-2">Basket details:</p>
                    {checkoutSuccess.items.map((item: any) => (
                      <div key={item.product.id} className="flex justify-between font-medium">
                        <span className="truncate">{item.product.brand} {item.product.name} <span className="font-bold text-slate-400">x{item.quantity}</span></span>
                        <span className="font-extrabold font-mono text-slate-900">OMR {item.product.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Checkout calculations */}
                  <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Basket Subtotal</span>
                      <span>OMR {checkoutSuccess.subtotal}</span>
                    </div>
                    {checkoutSuccess.warrantyCost > 0 && (
                      <div className="flex justify-between">
                        <span>Safeguard Plus Warranty</span>
                        <span>OMR {checkoutSuccess.warrantyCost}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping Delivery service</span>
                      <span>{checkoutSuccess.shippingCost === 0 ? 'FREE' : `OMR ${checkoutSuccess.shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-xs pt-1.5 border-t">
                      <span>Payment via {checkoutSuccess.payment}</span>
                      <span className="text-brand-red font-black font-mono">OMR {checkoutSuccess.total}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setCheckoutSuccess(null);
                      // Jump immediately to tracking system
                      const trackerSection = document.getElementById('track-section');
                      if (trackerSection) trackerSection.scrollIntoView({ behavior: 'smooth' });
                      handleTrackOrder(undefined, checkoutSuccess.orderId);
                    }}
                    className="w-full rounded-xl bg-slate-950 hover:bg-brand-red py-3 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Track This Shipment Status Live
                  </button>
                  <button 
                    onClick={() => setCheckoutSuccess(null)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Done (Close Receipt)
                  </button>
                </div>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Side-by-side Product Comparison Chart Modal ===== */}
      <AnimatePresence>
        {isCompareOpen && compareList.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 select-none">
            
            {/* Quick floating bar at the bottom */}
            <motion.div 
              layoutId="compare-floating-bar"
              className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white/95 backdrop-blur shadow-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-brand-red">
                  <ArrowLeftRight className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Comparing Items ({compareList.length}/3)</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    {compareList.map(item => (
                      <span key={item.id} className="rounded bg-slate-100 px-1.5 py-0.2 select-none truncate max-w-[80px]">
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={clearCompare}
                  className="rounded-lg hover:bg-slate-100 text-xs text-slate-500 py-1.5 px-3 font-semibold cursor-pointer"
                >
                  Clear Clear
                </button>
                <button 
                  onClick={() => setIsCompareOpen(true)}
                  className="rounded-lg bg-slate-950 text-xs font-bold text-white py-2 px-4 shadow-sm hover:bg-brand-red cursor-pointer"
                >
                  View Chart Side-by-Side
                </button>
              </div>
            </motion.div>

            {/* Backdrop for full side-by-side comparison chart overlay */}
            <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.96 }}
                animate={{ scale: 1 }}
                className="w-full max-w-4xl rounded-2xl bg-white border p-6 flex flex-col justify-between max-h-[88vh] overflow-y-auto relative"
              >
                <button 
                  onClick={() => setIsCompareOpen(false)}
                  className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1.5 border-b pb-4 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-brand-red shrink-0" />
                    Product Comparison Chart
                  </h3>
                  <p className="text-xs text-slate-400">Analyze prices, brands, and technical certifications side-by-side to align your needs.</p>
                </div>

                <div className="grid grid-cols-4 gap-4 divide-x divide-slate-100">
                  
                  {/* Column 0: specs list label column */}
                  <div className="col-span-1 space-y-4 pt-36">
                    <div className="h-10 text-[10px] uppercase font-bold text-slate-400 flex items-center">Category</div>
                    <div className="h-10 text-[10px] uppercase font-bold text-slate-400 flex items-center border-t">Retail Price</div>
                    <div className="h-10 text-[10px] uppercase font-bold text-slate-400 flex items-center border-t font-mono">Stock Level</div>
                    <div className="h-28 text-[10px] uppercase font-bold text-slate-400 flex items-center border-t">Technical Specifications</div>
                  </div>

                  {/* Column 1-3: Products loop */}
                  {Array.from({ length: 3 }).map((_, idx) => {
                    const product = compareList[idx];
                    if (!product) {
                      return (
                        <div key={idx} className="col-span-1 p-6 flex flex-col items-center justify-center text-center text-slate-300 border border-dashed border-slate-100 rounded-xl min-h-[300px]">
                          <span className="text-2xl block mb-2">✦</span>
                          <p className="text-xs font-semibold">Select {idx + 1 === 2 ? 'another' : 'a third'} product in the catalog to compare stats</p>
                          <button 
                            onClick={() => setIsCompareOpen(false)}
                            className="text-[10px] font-bold text-slate-500 underline mt-2"
                          >
                            Browse grid
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={product.id} className="col-span-1 px-4 flex flex-col justify-between">
                        
                        {/* Header details block */}
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{product.brand}</p>
                          <h4 className="font-sans font-black text-slate-900 text-sm mt-1 mb-2 line-clamp-2 h-10">{product.name}</h4>
                          <div className="text-5xl bg-slate-50 rounded-xl py-6 flex items-center justify-center mb-4">
                            {product.imageEmoji}
                          </div>
                        </div>

                        {/* Attribute rows matching specs checklist */}
                        <div className="space-y-4">
                          <div className="h-10 flex items-center text-xs font-semibold text-slate-700">
                            {product.category}
                          </div>
                          
                          <div className="h-10 flex items-center text-sm font-extrabold text-brand-red border-t">
                            OMR {product.price}
                          </div>

                          <div className="h-10 flex items-center text-xs text-slate-600 border-t">
                            {product.stock > 0 ? `${product.stock} units available` : 'Sold Out'}
                          </div>

                          <div className="h-28 text-xs text-slate-500 leading-relaxed border-t pt-2 space-y-1 font-sans">
                            {Object.entries(product.specs).map(([key, value]) => (
                              <p key={key} className="truncate">
                                <span className="font-extrabold text-slate-700">{key}:</span> {value}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Quick action basket buttons inside comparisons */}
                        <div className="pt-4 border-t mt-4 flex gap-1">
                          <button 
                            onClick={() => {
                              handleAddToCart(product);
                              setIsCompareOpen(false);
                            }}
                            className="flex-1 rounded-lg bg-slate-900 hover:bg-brand-red text-white py-2 text-[11px] font-bold"
                          >
                            Add to Basket
                          </button>
                          <button 
                            onClick={() => setCompareList(prev => prev.filter(item => item.id !== product.id))}
                            className="rounded-lg border border-slate-200 text-slate-500 hover:text-brand-red p-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}

                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setIsCompareOpen(false)}
                    className="rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold py-2.5 px-6 cursor-pointer"
                  >
                    Done (Close Chart View)
                  </button>
                </div>

              </motion.div>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* ===== Immersive Product Detailed modal info check ===== */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-2xl bg-white border shadow-2xl p-6 relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 rounded-full p-2 hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6 mt-4">
                
                {/* Image side */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="rounded-xl bg-slate-50 text-7xl p-8 flex items-center justify-center h-52 select-none border">
                    {selectedProduct.imageEmoji}
                  </div>
                  <span className="text-[10px] text-slate-400 text-center select-none mt-2 font-semibold">100% Authentic Brand Certificate Included</span>
                </div>

                {/* Details list */}
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="rounded bg-slate-100 text-[10px] font-bold text-slate-500 px-2 py-0.5">
                      {selectedProduct.category}
                    </span>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mt-2.5">{selectedProduct.brand}</p>
                    <h3 className="font-sans font-extrabold text-slate-900 text-lg leading-snug">{selectedProduct.name}</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="border-y py-3 text-xs space-y-1">
                    <p className="font-extrabold text-slate-800">Specifications checklist:</p>
                    {Object.entries(selectedProduct.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between font-medium">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-800 font-bold">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-950">OMR {selectedProduct.price}</span>
                    {selectedProduct.oldPrice && (
                      <span className="text-sm text-slate-400 line-through">OMR {selectedProduct.oldPrice}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                        setIsCartOpen(true);
                      }}
                      className="flex-1 rounded-xl bg-slate-950 hover:bg-brand-red text-white py-3 text-xs font-bold transition-all cursor-pointer"
                    >
                      Buy Instantly (Add with Drawer)
                    </button>
                    <button 
                      onClick={() => {
                        handleToggleWishlist(selectedProduct.id);
                      }}
                      className={`rounded-xl border p-3 flex justify-center items-center cursor-pointer ${
                        wishlist.includes(selectedProduct.id) ? 'border-red-200 text-brand-red bg-red-50/10' : 'border-slate-200 text-slate-400 hover:border-slate-400'
                      }`}
                      title="Add to Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${wishlist.includes(selectedProduct.id) ? 'fill-brand-red' : ''}`} />
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== AI Shopping Assistant Chatbot Drawer ===== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="fixed bottom-20 right-4 sm:right-6 max-w-[360px] w-[90vw] h-[480px] bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red text-base">
                  ✨
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">BuyOman AI Chatbot</h4>
                  <p className="text-[9px] text-red-300 font-bold uppercase tracking-wider">Online Assistant 24/7</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="rounded-full p-1 hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {chatMessages.map((msg, mIdx) => (
                <div 
                  key={mIdx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`rounded-2xl p-3 max-w-[85%] text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user' 
                      ? 'bg-brand-red text-white rounded-br-xs font-medium' 
                      : 'bg-white border text-slate-800 rounded-bl-xs'
                  }`}>
                    {/* Preserve markdown structure visually */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}

              {isChatGenerating && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white border p-3 max-w-[85%] text-xs shadow-xs rounded-bl-xs flex items-center gap-1.5 text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Custom search suggestion triggers within chat */}
            <div className="px-3 py-1.5 border-t border-slate-100 flex flex-wrap gap-1.5 bg-white shrink-0 scrollbar-none max-h-16 overflow-y-auto">
              {[
                'Do you carry split ACs?',
                'Which mobile is best under OMR 150?',
                'Warranty options in Oman?',
                'Free delivery status?'
              ].map((sugg, sIdx) => (
                <button 
                  key={sIdx}
                  onClick={() => {
                    setChatInput(sugg);
                  }}
                  className="rounded bg-slate-100 text-[10px] text-slate-600 px-2 py-0.5 font-sans font-semibold hover:bg-red-50 hover:text-brand-red shrink-0 cursor-pointer"
                >
                  {sugg}
                </button>
              ))}
            </div>

            {/* Chat form footer */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="Ask about products, measurements, or specs..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatGenerating}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-brand-red placeholder:text-slate-400"
              />
              <button 
                type="submit"
                disabled={isChatGenerating}
                className="h-8 w-8 rounded-full bg-slate-950 hover:bg-brand-red text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chatbot launcher fab */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-4 sm:right-6 h-14 w-14 rounded-full bg-slate-950 hover:bg-brand-red text-white flex items-center justify-center shadow-2xl z-40 transition-colors cursor-pointer"
        title="Open BuyOman Chatbot Assistant"
      >
        <MessageSquare className="w-6 h-6 shrink-0" />
      </button>

      {/* ===== Cookie Consent Banner ===== */}
      <AnimatePresence>
        {cookieConsent && (
          <motion.div 
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 25, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 max-w-sm sm:max-w-md mx-auto rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl p-4 z-50 flex flex-col sm:flex-row items-center gap-3 justify-between"
          >
            <div className="text-center sm:text-left text-xs text-slate-500">
              We use cookie security tags to remember items inside your shopping basket across shopping sessions. Accept to continue.
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleAcceptCookies}
                className="rounded-full bg-slate-950 hover:bg-brand-red text-white py-1 px-4 text-[10px] font-bold cursor-pointer"
              >
                Allow Cookies
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
