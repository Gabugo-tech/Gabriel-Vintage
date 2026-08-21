import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import VintageGrid from "./components/VintageGrid";
import MarketDirectory from "./components/MarketDirectory";
import LookbookShowcase from "./components/LookbookShowcase";
import SellForm from "./components/SellForm";
import ClosetHub from "./components/ClosetHub";
import ItemDetailModal from "./components/ItemDetailModal";
import AdminDashboard from "./components/AdminDashboard";
import AuthModal from "./components/AuthModal";
import VendorProfile from "./components/VendorProfile";
import FeedbackModal, { VendorReview } from "./components/FeedbackModal";
import { emailNotificationService } from "./lib/emailNotificationService";
import { safeLocalStorage } from "./lib/storage";

import { VintageItem, MarketBooth, BidRecord, Lookbook } from "./types";
import { INITIAL_BOOTHS, INITIAL_ITEMS, INITIAL_LOOKBOOKS } from "./data";
import { Star, Shield, HelpCircle, Heart, Instagram, ShoppingBag, User } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("browse");
  const [items, setItems] = useState<VintageItem[]>([]);
  const [booths, setBooths] = useState<MarketBooth[]>([]);
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  
  // Real-time local state bidding and checkout lists
  const [bidLogs, setBidLogs] = useState<BidRecord[]>([]);
  const [purchasedItemIds, setPurchasedItemIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<VintageItem | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Vendor profiles detailing and review states
  const [selectedBoothIdForProfile, setSelectedBoothIdForProfile] = useState<string | null>(null);
  const [feedbackVendorId, setFeedbackVendorId] = useState<string | null>(null);
  const [feedbackItemTitle, setFeedbackItemTitle] = useState<string>("");
  const [allReviews, setAllReviews] = useState<VendorReview[]>([]);

  // Gabriel Vintage account security states
  const [userEmail, setUserEmail] = useState<string>(() => {
    return safeLocalStorage.getItem("user_email") || "guest@fitcheck.com";
  });
  const [userName, setUserName] = useState<string>(() => {
    return safeLocalStorage.getItem("user_name") || "Guest Customer";
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    return safeLocalStorage.getItem("user_phone") || "";
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Premium Light / Dark Mode Toggle system
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return safeLocalStorage.getItem("vintage_dark_mode") === "true";
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      safeLocalStorage.setItem("vintage_dark_mode", next ? "true" : "false");
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const isAdmin = userEmail.trim().toLowerCase() === "darcywon644@gmail.com" || userEmail.trim().toLowerCase() === "darcywon664@gmail.com";

  useEffect(() => {
    const stored = safeLocalStorage.getItem("vintage_dark_mode") === "true";
    if (stored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    try {
      const storedReviews = safeLocalStorage.getItem("vintage_vendor_reviews_list");
      if (storedReviews) {
        setAllReviews(JSON.parse(storedReviews));
      } else {
        setAllReviews([]);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    }
  }, []);

  const handleSetUserEmail = (email: string) => {
    setUserEmail(email);
    safeLocalStorage.setItem("user_email", email);
    
    // Automatically match curator names for darcy admin accounts
    if (email.trim().toLowerCase() === "darcywon644@gmail.com" || email.trim().toLowerCase() === "darcywon664@gmail.com") {
      setUserName("Darcy");
      safeLocalStorage.setItem("user_name", "Darcy");
    }
  };

  const handleLogout = () => {
    safeLocalStorage.removeItem("user_email");
    safeLocalStorage.removeItem("user_name");
    safeLocalStorage.removeItem("user_phone");
    setUserEmail("guest@fitcheck.com");
    setUserName("Guest Customer");
    setUserPhone("");
    setCurrentTab("browse");
    setSelectedItem(null);
  };

  const handleAuthSuccess = (email: string, phone: string, name: string) => {
    setUserEmail(email);
    setUserName(name);
    setUserPhone(phone);
    safeLocalStorage.setItem("user_email", email);
    safeLocalStorage.setItem("user_name", name);
    safeLocalStorage.setItem("user_phone", phone);
  };

  // Toggle wishlist handler
  const handleToggleWishlist = (itemId: string) => {
    setWishlist((prev) => {
      const isAlreadyIn = prev.includes(itemId);
      const updatedWishlist = isAlreadyIn
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      safeLocalStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      return updatedWishlist;
    });
  };

  // Load from localStorage on mount or fall back to mock seeds
  useEffect(() => {
    try {
      const storedItems = safeLocalStorage.getItem("vintage_items_list");
      const storedBooths = safeLocalStorage.getItem("vintage_booths_list");
      const storedBids = safeLocalStorage.getItem("vintage_bidlogs_list");
      const storedPurchases = safeLocalStorage.getItem("vintage_purchased_ids");

      if (storedItems) {
        const parsed: VintageItem[] = JSON.parse(storedItems);
        const enriched = parsed.map((item) => {
          const matched = INITIAL_ITEMS.find((i) => i.id === item.id);
          if (matched) {
            return {
              ...item,
              bidDropped: matched.bidDropped,
              bidDroppedReason: matched.bidDroppedReason,
              biddingEndsAt: matched.biddingEndsAt, // keep ends date refreshed
            };
          }
          return item;
        });
        setItems(enriched);
      } else {
        setItems(INITIAL_ITEMS);
        safeLocalStorage.setItem("vintage_items_list", JSON.stringify(INITIAL_ITEMS));
      }

      if (storedBooths) {
        setBooths(JSON.parse(storedBooths));
      } else {
        setBooths(INITIAL_BOOTHS);
        safeLocalStorage.setItem("vintage_booths_list", JSON.stringify(INITIAL_BOOTHS));
      }

      setLookbooks(INITIAL_LOOKBOOKS);

      if (storedBids) {
        setBidLogs(JSON.parse(storedBids));
      } else {
        // Initialize with standard historical starting bids 
        const dummyBids: BidRecord[] = [
          {
            id: "b-1",
            itemId: "item-1",
            itemTitle: "1978 Schott Perfecto Leather Motorcycle Jacket",
            bidderName: "David Lee",
            amount: 220,
            timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString()
          },
          {
            id: "b-2",
            itemId: "item-1",
            itemTitle: "1978 Schott Perfecto Leather Motorcycle Jacket",
            bidderName: "Alex J.",
            amount: 245,
            timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString()
          },
          {
            id: "b-3",
            itemId: "item-2",
            itemTitle: "1984 Kyoto Cranes embroidered Sukajan",
            bidderName: "Kenji S.",
            amount: 320,
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
          }
        ];
        setBidLogs(dummyBids);
        safeLocalStorage.setItem("vintage_bidlogs_list", JSON.stringify(dummyBids));
      }

      if (storedPurchases) {
        setPurchasedItemIds(JSON.parse(storedPurchases));
      }

      const storedWishlist = safeLocalStorage.getItem("wishlist");
      if (storedWishlist) {
        setWishlist(JSON.parse(storedWishlist));
      }
    } catch (e) {
      console.error("Local storage sync error: ", e);
      // Fallback
      setItems(INITIAL_ITEMS);
      setBooths(INITIAL_BOOTHS);
      setLookbooks(INITIAL_LOOKBOOKS);
    }
  }, []);

  // Multi-tab real-time state synchronization
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "vintage_items_list" && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synchronised items:", err);
        }
      }
      if (e.key === "vintage_bidlogs_list" && e.newValue) {
        try {
          setBidLogs(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synchronised bid logs:", err);
        }
      }
      if (e.key === "vintage_purchased_ids" && e.newValue) {
        try {
          setPurchasedItemIds(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synchronised purchases:", err);
        }
      }
      if (e.key === "wishlist" && e.newValue) {
        try {
          setWishlist(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synchronised wishlist:", err);
        }
      }
      if (e.key === "vintage_vendor_reviews_list" && e.newValue) {
        try {
          setAllReviews(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synchronised reviews:", err);
        }
      }
      if (e.key === "user_email" && e.newValue) {
        setUserEmail(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  // Save changes automatically
  const persistState = (newItems: VintageItem[], newBooths: MarketBooth[], newBids: BidRecord[], newPurchases: string[]) => {
    safeLocalStorage.setItem("vintage_items_list", JSON.stringify(newItems));
    safeLocalStorage.setItem("vintage_booths_list", JSON.stringify(newBooths));
    safeLocalStorage.setItem("vintage_bidlogs_list", JSON.stringify(newBids));
    safeLocalStorage.setItem("vintage_purchased_ids", JSON.stringify(newPurchases));
  };

  // Add Bid Placement
  const handlePlaceBid = (itemId: string, amount: number, bidderName: string) => {
    const matchedItem = items.find(i => i.id === itemId);
    const prevHighestBidder = matchedItem?.highestBidder;

    if (prevHighestBidder && prevHighestBidder !== bidderName && matchedItem) {
      const prevBidderEmail = prevHighestBidder === userName ? userEmail : `${prevHighestBidder.toLowerCase().replace(/\s+/g, "")}@fitcheck.com`;
      emailNotificationService.notifyOutbid(prevBidderEmail, bidderName, matchedItem.title, amount);
    }

    const updatedBids: BidRecord[] = [
      ...bidLogs,
      {
        id: `bid-${Date.now()}`,
        itemId,
        itemTitle: matchedItem?.title || "Vintage Piece",
        bidderName,
        amount,
        timestamp: new Date().toISOString()
      }
    ];

    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          currentBid: amount,
          bidsCount: item.bidsCount + 1,
          highestBidder: bidderName
        };
      }
      return item;
    });

    setBidLogs(updatedBids);
    setItems(updatedItems);
    persistState(updatedItems, booths, updatedBids, purchasedItemIds);

    // Sync active modal focus if open
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({
        ...selectedItem,
        currentBid: amount,
        bidsCount: selectedItem.bidsCount + 1,
        highestBidder: bidderName
      });
    }
  };

  // Instant Checkout buy now
  const handleBuyNow = (itemId: string, buyerName: string) => {
    const updatedPurchased = [...purchasedItemIds, itemId];
    const purchasedItem = items.find(i => i.id === itemId);
    
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          isSold: true,
          highestBidder: buyerName
        };
      }
      return item;
    });

    setPurchasedItemIds(updatedPurchased);
    setItems(updatedItems);
    persistState(updatedItems, booths, bidLogs, updatedPurchased);

    if (purchasedItem) {
      // Finalize order with simulation email transmission log
      emailNotificationService.notifyPurchaseFinalized(
        userEmail || "customer@fitcheck.com",
        buyerName,
        purchasedItem.title,
        purchasedItem.buyPrice || purchasedItem.currentBid,
        `TXN-GAB-${Date.now()}`
      );

      setTimeout(() => {
        setFeedbackVendorId(purchasedItem.sellerId);
        setFeedbackItemTitle(purchasedItem.title);
      }, 2605); // Triggers feedback modal following successful checkout packaging
    }
  };

  // Reset vault purchases
  const handleClearPurchases = () => {
    if (!window.confirm("Reset all vault purchases? Items will be restored to active listings.")) return;
    const cleared: string[] = [];
    const restoredItems = items.map((item) => {
      if (purchasedItemIds.includes(item.id)) {
        return { ...item, isSold: false, highestBidder: null };
      }
      return item;
    });
    setPurchasedItemIds(cleared);
    setItems(restoredItems);
    persistState(restoredItems, booths, bidLogs, cleared);
    if (selectedItem && purchasedItemIds.includes(selectedItem.id)) {
      setSelectedItem(null);
    }
  };

  // Add new Vintage Piece & Stall
  const handleAddListing = (newItem: VintageItem, newBooth?: MarketBooth) => {
    const updatedItems = [newItem, ...items];
    let updatedBooths = [...booths];

    if (newBooth) {
      updatedBooths = [newBooth, ...booths];
      setBooths(updatedBooths);
    }

    setItems(updatedItems);
    persistState(updatedItems, updatedBooths, bidLogs, purchasedItemIds);
    
    // Broadcast to other tabs
    window.dispatchEvent(new Event("storage"));
    
    // Auto shift focus back to collection page so they can see their live listed piece
    setCurrentTab("browse");
    setSelectedBoothId(null);
  };

  // Filter triggers from Booth Directory
  const handleSelectBoothFilter = (boothId: string) => {
    setSelectedBoothId(boothId);
    setCurrentTab("browse"); // shift focus back to collection listing with active badge filter
  };

  // Counts of stock items categorized by vendor booth
  const computeItemCounts = () => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.sellerId] = (counts[item.sellerId] || 0) + 1;
    });
    return counts;
  };

  const activeBidCount = bidLogs.filter(b => b.bidderName.toLowerCase() === userName.toLowerCase() && b.bidderName !== "").length;

  // Jumia-style real-time search filtering helper
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.era.toLowerCase().includes(query) ||
      item.condition.toLowerCase().includes(query) ||
      item.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const isGated = !userEmail || userEmail === "guest@fitcheck.com" || userEmail.trim().toLowerCase().includes("guest");

  if (isGated) {
    return (
      <div className="min-h-screen bg-[#0F0E0C] text-[#FAF9F5] font-sans relative overflow-x-hidden" id="gated_visitor_auth_showroom">

        {/* ── AMBIENT BACKGROUND LAYERS ── */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/6 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#2a2820_1px,transparent_1px)] [background-size:28px_28px] opacity-30"></div>
        </div>

        {/* ── NAVBAR ── */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/6 bg-[#0F0E0C]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-jumia-orange text-white px-3 py-1.5 rounded-lg font-black text-xl flex items-center">
                Fit<span className="font-serif italic font-bold">Check</span>
              </div>
              <span className="hidden sm:block text-[9px] font-mono text-stone-500 uppercase tracking-widest border border-stone-800 px-2 py-0.5 rounded">
                Verified Vintage
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-bold text-stone-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-jumia-orange hover:bg-[#E07A13] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO SECTION ── */}
        <section className="relative z-10 pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">

              {/* Left — Copy */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[11px] font-mono uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                  Live Auction — 6 Items Active Now
                </div>

                <div className="space-y-4">
                  <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
                    Vintage fashion,<br />
                    <span className="text-jumia-orange italic">authenticated.</span>
                  </h1>
                  <p className="text-stone-400 text-base sm:text-lg leading-relaxed max-w-lg">
                    FitCheck is a curated marketplace for rare vintage garments sourced from the world's best flea markets — Portobello Road, Shimokitazawa, Brooklyn Flea, and Milan Navigli.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-jumia-orange hover:bg-[#E07A13] text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-orange-900/30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Start Shopping
                  </button>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {[
                    { icon: <Shield className="w-3.5 h-3.5" />, text: "Provenance Guaranteed" },
                    { icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />, text: "Flat-Measured Sizing" },
                    { icon: <HelpCircle className="w-3.5 h-3.5" />, text: "No Hidden Algorithms" },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                      <span className="text-amber-500">{b.icon}</span>
                      {b.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Product Preview Cards */}
              <div className="relative hidden lg:block">
                {/* Floating cards arrangement */}
                <div className="relative w-full h-[560px]">

                  {/* Main card */}
                  <div className="absolute top-0 right-0 w-64 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="aspect-square bg-stone-800 overflow-hidden relative">
                      <img src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80" alt="Vintage jacket" className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-jumia-orange text-[9px] font-black uppercase px-2 py-0.5 rounded text-stone-900 tracking-wider">Live Auction</div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-[10px] font-mono text-stone-500 uppercase">70s Rocker • Neon Nostalgia</p>
                      <h4 className="font-serif text-sm font-bold text-white leading-tight">1978 Schott Perfecto Leather Jacket</h4>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-jumia-orange font-black font-mono text-base">₦245</span>
                          <span className="text-stone-600 text-[10px] line-through ml-1.5">₦342</span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded">7 bids</span>
                      </div>
                    </div>
                  </div>

                  {/* Second card — offset */}
                  <div className="absolute top-48 left-0 w-56 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="h-36 bg-stone-800 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80" alt="Sukajan" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-[9px] font-mono text-stone-500 uppercase">80s Retro • Tokyo</p>
                      <h4 className="font-serif text-xs font-bold text-white line-clamp-1">Kyoto Cranes Sukajan</h4>
                      <span className="text-jumia-orange font-black font-mono text-sm block">₦320</span>
                    </div>
                  </div>

                  {/* Third card — bottom right */}
                  <div className="absolute bottom-0 right-8 w-52 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="h-32 bg-stone-800 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80" alt="Vintage tee" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-[9px] font-mono text-stone-500 uppercase">90s Grunge • Brooklyn</p>
                      <h4 className="font-serif text-xs font-bold text-white line-clamp-1">Nirvana In Utero Tour Tee</h4>
                      <span className="text-jumia-orange font-black font-mono text-sm block">₦360</span>
                    </div>
                  </div>

                  {/* Decorative live badge floating */}
                  <div className="absolute top-36 right-12 bg-red-950/80 border border-red-800/60 text-red-300 text-[9px] font-mono font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></span>
                    Bidding Live
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section className="relative z-10 border-y border-stone-800/60 bg-stone-900/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "350+", label: "Curated Pieces" },
                { value: "4", label: "Global Sourcing Markets" },
                { value: "₦580k", label: "Highest Sale" },
                { value: "100%", label: "Provenance Verified" },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="font-serif text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="relative z-10 py-24 px-6">
          <div className="max-w-7xl mx-auto space-y-14">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-jumia-orange">Simple Process</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">How FitCheck works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  desc: "Sign up in under 60 seconds with SMS verification. Your account unlocks live bidding, flat-measured sizing data, and the personal vault.",
                  icon: <User className="w-6 h-6" />
                },
                {
                  step: "02",
                  title: "Browse & bid live",
                  desc: "Explore pieces from Portobello, Shimokitazawa, Brooklyn, and Milan. Place real-time bids or buy instantly with our secure checkout.",
                  icon: <ShoppingBag className="w-6 h-6" />
                },
                {
                  step: "03",
                  title: "Receive & wear",
                  desc: "Every piece ships wax-sealed via DHL Express with a physical provenance certificate. Delivered to your door in 2–4 business days.",
                  icon: <Shield className="w-6 h-6" />
                }
              ].map((item, i) => (
                <div key={i} className="bg-stone-900/60 border border-stone-800 rounded-2xl p-7 space-y-4 hover:border-stone-700 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-jumia-orange/10 border border-jumia-orange/20 rounded-xl flex items-center justify-center text-jumia-orange group-hover:bg-jumia-orange/20 transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-mono text-4xl font-black text-stone-800">{item.step}</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOURCING MARKETS ── */}
        <section className="relative z-10 py-20 px-6 bg-stone-900/20">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-jumia-orange">Where We Source</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">The world's finest vintage markets</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { city: "London", market: "Portobello Road", img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80" },
                { city: "Tokyo", market: "Shimokitazawa", img: "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5c?w=400&q=80" },
                { city: "Brooklyn", market: "Brooklyn Flea", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80" },
                { city: "Milan", market: "Navigli Canal", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80" },
              ].map((m, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/5]">
                  <img src={m.img} alt={m.city} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <p className="font-serif text-lg font-bold text-white">{m.city}</p>
                    <p className="text-[10px] font-mono text-stone-300 uppercase tracking-wider">{m.market}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="relative z-10 py-24 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
              Ready to find your<br />
              <span className="text-jumia-orange italic">perfect vintage piece?</span>
            </h2>
            <p className="text-stone-400 text-base leading-relaxed">
              Join thousands of collectors and fashion archivists who trust FitCheck for authenticated vintage. Create your free account in seconds.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 bg-jumia-orange hover:bg-[#E07A13] text-white font-bold px-10 py-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-xl shadow-orange-900/30 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Enter the Showroom
            </button>
            <p className="text-[11px] text-stone-600 font-mono">Free to join · No credit card required · SMS verified</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 border-t border-stone-800/60 py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-jumia-orange text-white px-2.5 py-1 rounded-lg font-black text-sm">
                Fit<span className="font-serif italic">Check</span>
              </div>
              <span className="text-stone-600 text-[10px] font-mono uppercase tracking-widest">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6 text-[11px] text-stone-600 font-mono uppercase tracking-wider">
              <span className="hover:text-stone-400 cursor-pointer transition-colors">Buyer Protection</span>
              <span className="hover:text-stone-400 cursor-pointer transition-colors">Terms of Auction</span>
              <span className="hover:text-stone-400 cursor-pointer transition-colors">Sizing Guide</span>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          hideCloseButton={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1C1A17] dark:bg-[#131211] dark:text-[#EBE7DF] font-sans flex flex-col justify-between transition-colors duration-300 selection:bg-amber-100 selection:text-amber-900" id="editorial_app_main">
      <div>
        
        {/* Sticky top headers */}
        <Navbar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          activeBidCount={activeBidCount} 
          wishlistCount={wishlist.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userEmail={userEmail}
          setUserEmail={handleSetUserEmail}
          userPhone={userPhone}
          userName={userName}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />

        {/* Hero editorial banner - strictly only visible on the central Showcase Collection feed */}
        {currentTab === "browse" && !selectedBoothId && (
          <section className="bg-[#1C1A17] text-[#FAF9F5] py-16 sm:py-24 border-b border-stone-800" id="editorial_hero_banner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-400 font-bold block">
                The anti-fast fashion showroom
              </span>
              <h1 className="font-serif text-4xl sm:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto italic">
                FitCheck. <br className="hidden sm:inline" />No Plastic. Pure Patina.
              </h1>
              <p className="font-sans text-stone-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Step into a high-fidelity digital bazaar where historical single-stitches, steerhide aviators, and Milanese silks are cataloged with raw backstories, auctioned live, and guaranteed physical origins.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-amber-300/85">
                <span className="flex items-center gap-1.5 border-r border-[#FAF9F5]/20 pr-6 last:border-0">
                  <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                  No Hidden Algorithms
                </span>
                <span className="flex items-center gap-1.5 border-r border-[#FAF9F5]/20 pr-6 last:border-0">
                  <Shield className="w-5 h-5 text-amber-300" />
                  Provenance Guaranteed
                </span>
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-5 h-5 text-amber-300" />
                  Flat Measured Fit Checked
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Main Content Render Layout */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 dark:bg-[#131211]">
          {currentTab === "browse" && (
            <VintageGrid
              items={filteredItems}
              onSelectItem={(item) => setSelectedItem(item)}
              selectedBoothId={selectedBoothId}
              clearBoothFilter={() => setSelectedBoothId(null)}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          {currentTab === "wishlist" && (
            <div className="space-y-8 animate-fade-in" id="wishlist_view_section">
              <div className="border-b border-[#EBE8DF] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-700 font-bold block mb-1">
                    Your Curated Showroom Vault
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold italic text-[#1C1A17]">My Wishlist</h2>
                </div>
                <div className="font-mono text-xs text-amber-900 bg-amber-50 border border-amber-200/60 px-3.5 py-1.5 rounded-full whitespace-nowrap">
                  {items.filter((item) => wishlist.includes(item.id)).length} {items.filter((item) => wishlist.includes(item.id)).length === 1 ? "piece" : "pieces"} cataloged
                </div>
              </div>

              {items.filter((item) => wishlist.includes(item.id)).length > 0 ? (
                <VintageGrid
                  items={filteredItems.filter((item) => wishlist.includes(item.id))}
                  onSelectItem={(item) => setSelectedItem(item)}
                  selectedBoothId={null}
                  clearBoothFilter={() => {}}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlistView={true}
                />
              ) : (
                <div className="text-center py-20 bg-[#FCFBF8] border border-dashed border-[#EBE8DF] rounded-2xl max-w-lg mx-auto" id="empty_wishlist_panel">
                  <div className="w-16 h-16 rounded-full bg-rose-50/50 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <Heart className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#1C1A17]">Wishlist is currently empty</h3>
                  <p className="text-xs text-[#6B6152] mt-2 px-6 leading-relaxed">
                    Explore the collections from Portobello, Shimokitazawa & Brooklyn flea, then tap the heart icon on any piece to register it to your wishlist.
                  </p>
                  <button
                    onClick={() => setCurrentTab("browse")}
                    className="mt-6 inline-flex text-xs font-mono font-bold text-amber-800 hover:text-[#1C1A17] border-b border-amber-800 pb-0.5"
                  >
                    Browse The Collection
                  </button>
                </div>
              )}
            </div>
          )}

          {currentTab === "markets" && (
            selectedBoothIdForProfile ? (
              <VendorProfile
                booth={booths.find(b => b.id === selectedBoothIdForProfile)!}
                items={items}
                allReviews={allReviews}
                onSelectItem={(item) => setSelectedItem(item)}
                onBack={() => setSelectedBoothIdForProfile(null)}
                onOpenFeedbackModal={() => {
                  const b = booths.find(b => b.id === selectedBoothIdForProfile);
                  if (b) {
                    setFeedbackVendorId(b.id);
                    setFeedbackItemTitle("Direct Curator Consultation");
                  }
                }}
              />
            ) : (
              <MarketDirectory
                booths={booths}
                onSelectBooth={(boothId) => setSelectedBoothIdForProfile(boothId)}
                itemCounts={computeItemCounts()}
              />
            )
          )}

          {currentTab === "lookbooks" && (
            <LookbookShowcase
              lookbooks={lookbooks}
              items={items}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          )}

          {currentTab === "sell" && (
            isAdmin ? (
              <SellForm
                booths={booths}
                onAddListing={handleAddListing}
                userEmail={userEmail}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-850 text-center space-y-4" id="sell_auth_restricted_gate">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-serif text-xl font-bold">Curator Authorization Required</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  The upload lounge and garment listing options are restricted to certified admin curators. Please log in with an administrator account to list pieces.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentTab("browse")}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-950 text-white text-[11px] font-mono rounded-lg uppercase font-black tracking-wider transition-colors"
                >
                  Return to Showroom
                </button>
              </div>
            )
          )}

          {currentTab === "closet" && (
            <ClosetHub
              items={items}
              bidLogs={bidLogs}
              purchasedItemIds={purchasedItemIds}
              onSelectItem={(item) => setSelectedItem(item)}
              onClearPurchases={handleClearPurchases}
              wishlist={wishlist}
              currentUserName={userName}
            />
          )}

          {currentTab === "admin" && (
            <AdminDashboard
              items={items}
              setItems={setItems}
              persistState={persistState}
              booths={booths}
              bidLogs={bidLogs}
              setBidLogs={setBidLogs}
              purchasedItemIds={purchasedItemIds}
              userEmail={userEmail}
            />
          )}
        </main>
      </div>

      {/* Exquisite detail inspection overlay modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onPlaceBid={handlePlaceBid}
          onBuyNow={handleBuyNow}
          bidLogs={bidLogs}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {/* Auth verification Modal flow */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        hideCloseButton={false}
      />

      {/* Feedback Submission Modal */}
      {feedbackVendorId && (
        <FeedbackModal
          isOpen={!!feedbackVendorId}
          onClose={() => {
            setFeedbackVendorId(null);
            setFeedbackItemTitle("");
          }}
          vendorId={feedbackVendorId}
          vendorName={booths.find(b => b.id === feedbackVendorId)?.name || "FitCheck Curators"}
          itemTitle={feedbackItemTitle}
          defaultCustomerName={userName || "Verified Buyer"}
          onSubmitSuccess={() => {
            // Re-sync local storage updates inside active session state
            try {
              const storedReviews = safeLocalStorage.getItem("vintage_vendor_reviews_list");
              if (storedReviews) {
                setAllReviews(JSON.parse(storedReviews));
              }
            } catch (err) {
              console.error("Failed to load reviews:", err);
            }
          }}
        />
      )}

      {/* Footer Column - High Aesthetic details */}
      <footer className="bg-[#1C1A17] text-[#FAF9F5] border-t border-stone-805 mt-20" id="curated_boutique_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-8 pb-12 border-b border-stone-800">
            {/* Column 1 */}
            <div className="space-y-4">
              <span className="font-sans font-black text-xl bg-orange-600 px-3 py-1 rounded w-fit text-white block">
                FITCHECK
              </span>
              <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
                A digital counter-response to crowded, low-quality superstores. Dedicated to premium vintage garments that tell original tales. We verify flat-measurements and materials so you buy only lasting design heritage.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-wider text-amber-500 font-bold">
                Affiliated Sourcing Locations
              </h4>
              <ul className="text-xs text-stone-300 space-y-2 font-mono">
                <li>• Portobello Road Gate 4, London, UK</li>
                <li>• Shimokitazawa Block 3, Setagaya, Tokyo</li>
                <li>• Brooklyn Flea Stand 9B, Brooklyn, NY</li>
                <li>• Milan Navigli Canal Central Chest, Italy</li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-wider text-amber-500 font-bold">
                Archival Stewardship
              </h4>
              <p className="text-stone-400 text-xs leading-relaxed">
                By purchasing real vintage instead of cheap modern synthetics: <br />
                <strong className="text-emerald-400">Carbon Saved per bid checkout: ~14.2kg CO2e.</strong> <br />
                Insured flat-box courier dispatch guaranteed.
              </p>
              <div className="flex gap-3 pt-2 text-stone-400">
                <Instagram className="w-4 h-4 hover:text-amber-400 transition-colors" />
                <span className="text-[10px] uppercase font-mono tracking-widest hover:text-amber-400 cursor-pointer">@fitcheck_vintage</span>
              </div>
            </div>
          </div>

          {/* Copyright details */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-stone-500">
            <p>© {new Date().getFullYear()} FitCheck. All physical provenance recorded.</p>
            <div className="flex gap-4">
              <span className="hover:text-stone-300 cursor-pointer">Buyer Protection Charter</span>
              <span>•</span>
              <span className="hover:text-stone-300 cursor-pointer">Steward Terms of Auction</span>
              <span>•</span>
              <span className="hover:text-stone-300 cursor-pointer">Flat Measurement Guidelines</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
