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
import { Star, Shield, HelpCircle, Heart, Instagram } from "lucide-react";

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
    return safeLocalStorage.getItem("user_email") || "guest@gabrielvintage.com";
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
    setUserEmail("guest@gabrielvintage.com");
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
      const prevBidderEmail = prevHighestBidder === userName ? userEmail : `${prevHighestBidder.toLowerCase().replace(/\s+/g, "")}@gabrielvintage.com`;
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
        userEmail || "customer@gabrielvintage.com",
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

  const isGated = !userEmail || userEmail === "guest@gabrielvintage.com" || userEmail.trim().toLowerCase().includes("guest");

  if (isGated) {
    return (
      <div className="min-h-screen bg-[#1F1D19] text-[#FAF9F5] flex flex-col justify-between font-sans relative overflow-hidden" id="gated_visitor_auth_showroom">
        {/* Dynamic decorative backdrop blurring halos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#2E2B25_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        </div>

        {/* Top brand header bar */}
        <header className="border-b border-stone-800/80 py-5 px-6 relative z-10 flex items-center justify-between bg-stone-950/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-jumia-orange rounded-full animate-ping"></span>
            <span className="font-serif text-lg font-bold tracking-tight text-white italic">Gabriel Vintage Archive</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-900/30">
            Secure Entry Required
          </span>
        </header>

        {/* Central visual statement panel - layout designed desktop-first with extreme aesthetic precision */}
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 flex-1">
          <div className="text-center md:text-left space-y-6 md:max-w-md">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-jumia-orange font-bold block bg-orange-950/60 px-3.5 py-1 rounded-full w-fit mx-auto md:mx-0 border border-orange-900/30">
              The anti-fast fashion showroom
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white italic">
              Authentication <br /> Gated Cabinets.
            </h1>
            <p className="font-sans text-stone-400 text-xs sm:text-sm leading-relaxed">
              Step into an analog-grade digital bazaar. To ensure live bidding authenticity, measurements flat-checks, and direct-to-buyer boutique courier delivery, visitors must create a signature account first.
            </p>

            {/* Aesthetic trust indicators */}
            <div className="pt-4 border-t border-stone-800 space-y-3.5 text-xs text-stone-300">
              <div className="flex items-start gap-2.5">
                <span className="p-0.5 bg-amber-950/60 text-amber-400 rounded shrink-0 font-mono text-[10px] font-bold">✓</span>
                <p className="leading-tight"><strong className="text-white">Single-Stitch Sizing Ledger:</strong> Full access to exact waist, chest, and shoulder millimetre flat measurements.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="p-0.5 bg-amber-950/60 text-amber-400 rounded shrink-0 font-mono text-[10px] font-bold">✓</span>
                <p className="leading-tight"><strong className="text-white">Flea Market Provenance:</strong> Chronological archive bios detailing Portobello Road & Shimokitazawa chest finds.</p>
              </div>
            </div>
          </div>

          {/* Interactive registration trigger action */}
          <div className="w-full max-w-sm bg-stone-900/50 border border-stone-800/80 p-8 rounded-2xl backdrop-blur-md text-center space-y-5 shadow-xl">
            <div className="w-12 h-12 bg-amber-950/60 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-900/40">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-white italic">Unlock Gabriel Cabinet Access</h3>
              <p className="text-xs text-stone-400">Takes less than 60 seconds with simulated code verification delivery.</p>
            </div>
            
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 bg-jumia-orange hover:bg-opacity-90 hover:scale-[1.01] transform text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Initialize Sign-Up Verification</span>
            </button>
          </div>
        </div>

        {/* Footer info lock indicator */}
        <footer className="border-t border-stone-800/60 py-6 text-center text-[10px] text-stone-500 font-mono relative z-10 uppercase tracking-widest bg-stone-950/10">
          GABRIEL VINTAGE LTD © 2026 • LOCKED CATALOG SECURITY SUITE
        </footer>

        {/* Auths Modal triggered directly - with strict hideCloseButton enforcement */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          hideCloseButton={true}
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
                Gabriel Vintage. <br className="hidden sm:inline" />No Plastic. Pure Patina.
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
          vendorName={booths.find(b => b.id === feedbackVendorId)?.name || "Gabriel Curators"}
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
                GABRIEL VINTAGE
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
                <span className="text-[10px] uppercase font-mono tracking-widest hover:text-amber-400 cursor-pointer">@gabriel_vintage_tokyo</span>
              </div>
            </div>
          </div>

          {/* Copyright details */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-stone-500">
            <p>© {new Date().getFullYear()} Gabriel Vintage. All physical provenance recorded.</p>
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
