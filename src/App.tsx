import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Menu as MenuIcon, 
  Calendar, 
  Clock, 
  X, 
  Plus, 
  ChevronRight, 
  Utensils, 
  LogOut, 
  User as UserIcon,
  Trash2,
  CheckCircle,
  Clock3,
  AlertCircle,
  Star,
  Send,
  Phone,
  Mail,
  Lock,
  Globe
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OperationType, handleFirestoreError } from './firestore-utils';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category: "Main" | "Drink" | "Sauce" | "Appetizer" | "Chips";
  available: boolean;
}

interface Booking {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  userEmail: string;
  date: any; // Firestore Timestamp
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
}

interface TruckLocation {
  latitude: number;
  longitude: number;
  address: string;
  updatedAt: any;
  isPrivate?: boolean;
  inviteLink?: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: any;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { user, signIn, logout, isAdmin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('track')}>
              <div className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
                <span className="bg-primary text-white px-3 py-1 rounded-xl">MM</span> MEAT MAN
              </div>
            </div>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-10">
              {[
                { id: 'track', label: 'Tracker' },
                { id: 'menu', label: 'Full Menu' },
                { id: 'book', label: 'Booking' },
                { id: 'reviews', label: 'Reviews' },
                { id: 'about', label: 'About Us' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center pt-1 border-b-[3px] text-base font-bold transition-all",
                    activeTab === tab.id
                      ? "border-secondary text-secondary"
                      : "border-transparent text-text/60 hover:text-text hover:border-text/20"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-text">{user.displayName}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-text/40">{isAdmin ? 'Admin' : 'Member'}</p>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-100">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" />
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-text/40 hover:text-primary transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="vibrant-button px-6 py-2.5 bg-text text-white text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Nav */}
      <div className="sm:hidden flex justify-around p-2 bg-white border-t border-slate-100">
        {[
          { id: 'track', icon: MapPin },
          { id: 'menu', icon: MenuIcon },
          { id: 'book', icon: Calendar },
          { id: 'reviews', icon: Star },
          { id: 'about', icon: Utensils },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              activeTab === tab.id ? "bg-primary/10 text-primary" : "text-slate-400"
            )}
          >
            <tab.icon size={24} />
          </button>
        ))}
      </div>
    </nav>
  );
};

const ContactSection = () => (
  <div className="vibrant-card p-12 bg-text text-white border-none mt-20 relative overflow-hidden">
    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
      <div>
        <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase">Contact Meat Man</h3>
        <p className="text-white/50 font-medium leading-relaxed">
          The pit never sleeps, and neither do we. Reach out for corporate events, private parties, or general hype.
        </p>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Call the Pit</p>
            <p className="font-bold">(555) MEAT-MAN</p>
          </div>
        </div>
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-secondary transition-colors">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Email Us</p>
            <p className="font-bold">hello@meatmanbbq.com</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-full h-full bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
            <h4 className="text-primary font-black text-xl mb-1 uppercase">Ready to Book?</h4>
            <p className="text-sm text-white/40 mb-4 font-bold">Secure your date today</p>
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <img key={i} className="w-8 h-8 rounded-full border-2 border-text bg-slate-100" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
              ))}
            </div>
        </div>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
  </div>
);

const ReviewsView = () => {
  const { user, isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous Guest',
        rating,
        text,
        createdAt: serverTimestamp()
      });
      setText('');
      setRating(5);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${id}`);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black text-text tracking-tighter uppercase">Carnivore Reviews</h2>
              <p className="text-text/50 font-medium tracking-tight">REAL FEEDBACK FROM THE FRONT LINES OF THE PIT.</p>
            </div>
            <div className="text-right hidden sm:block">
               <div className="text-4xl font-black text-primary leading-none">{averageRating}</div>
               <div className="flex text-accent mt-1 gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"} />)}
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-text/30 mt-1">{reviews.length} Feedbacks</p>
            </div>
          </div>

          <div className="space-y-6">
            {reviews.map(review => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={review.id} 
                className="vibrant-card p-6 border-b-8 border-transparent hover:border-accent"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`} alt="reviewer" />
                    </div>
                    <div>
                      <h4 className="font-black text-text">{review.userName}</h4>
                      <div className="flex text-accent gap-0.5 my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <p className="text-[10px] text-text/30 font-bold uppercase tracking-widest">
                        {review.createdAt ? format(review.createdAt.toDate(), 'PPP') : 'Just now'}
                      </p>
                    </div>
                  </div>
                  {(isAdmin || (user && user.uid === review.userId)) && (
                    <button 
                      onClick={() => deleteReview(review.id)}
                      className="p-2 text-text/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-text/70 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-4">
                  "{review.text}"
                </p>
              </motion.div>
            ))}
            {reviews.length === 0 && (
              <div className="vibrant-card p-20 text-center bg-slate-50 border-none">
                 <Utensils size={48} className="mx-auto mb-4 text-slate-200" />
                 <p className="text-text/30 font-black uppercase tracking-widest">Be the first to leave a mark</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="vibrant-card p-8 sticky top-24">
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">LEAVE A REVIEW</h3>
            <p className="text-sm font-medium text-text/40 mb-8 lowercase tracking-tight">Tell the world how much you love the smoke.</p>
            
            {user ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-3">Meat Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                          rating >= star ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-slate-50 text-slate-300"
                        )}
                      >
                        <Star fill={rating >= star ? "currentColor" : "none"} size={20} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-3">Your Feedback</label>
                  <textarea
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Best brisket in the state..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm h-32 resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="vibrant-button w-full py-4 bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {submitting ? 'SENDING...' : (<><Send size={18} /> SUBMIT FEEDBACK</>)}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-text/40 mb-4">SIGN IN TO POST</p>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                   <Lock size={20} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ContactSection />
    </div>
  );
};

const TrackView = ({ setActiveTab }: { setActiveTab?: (tab: string) => void }) => {
  const [location, setLocation] = useState<TruckLocation | null>(null);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const unsubLoc = onSnapshot(doc(db, 'location', 'current'), 
      (doc) => {
        if (doc.exists()) {
          setLocation(doc.data() as TruckLocation);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'location/current')
    );

    const unsubMenu = onSnapshot(query(collection(db, 'menu')), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setFeaturedItems(items.filter(i => i.available).slice(0, 3));
    });

    return () => {
      unsubLoc();
      unsubMenu();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      <div className="space-y-6">
        <div className="vibrant-card h-[500px] border-4 border-white relative overflow-hidden flex flex-col">
          <div className="flex-1 map-dots relative">
             <motion.div 
               initial={{ y: 20 }}
               animate={{ y: 0 }}
               className="absolute top-[20%] left-[10%] bg-secondary px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-xl"
             >
                Coming Soon: Downtown Plaza
             </motion.div>

             <motion.div 
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className={cn(
                 "absolute top-[45%] left-[55%] text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 transition-colors",
                 location?.isPrivate ? "bg-text" : "bg-primary"
               )}
             >
               {location?.isPrivate ? (
                 <><Lock size={18} /> Private Event</>
               ) : (
                 <><Utensils size={18} /> Hot & Ready!</>
               )}
             </motion.div>
             
             {location?.isPrivate && location.inviteLink && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="absolute top-[55%] left-[55%] -ml-10"
               >
                 <button 
                   onClick={() => window.open(location.inviteLink)}
                   className="bg-white/90 backdrop-blur-md text-text px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-white transition-all transform hover:-translate-y-1"
                 >
                   < Globe size={12} /> View Invite
                 </button>
               </motion.div>
             )}
          </div>
          
          <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            {location ? (
              <>
                <div>
                  <h3 className="text-xl font-black text-text">{location.address.split(',')[0]}</h3>
                  <p className="text-sm text-text/50 font-medium">{location.address}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text/40 bg-slate-100 px-3 py-1 rounded-md">Departing in</span>
                    <p className="text-2xl font-black text-primary">42 Mins</p>
                  </div>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`)}
                    className="vibrant-button p-4 bg-primary text-white shadow-lg shadow-primary/30"
                  >
                    <MapPin size={24} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-text/50 italic animate-pulse">Scanning the streets for the truck...</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { title: 'Plan Ahead', desc: 'Secure catering for your parties.', icon: Calendar, color: 'bg-orange-100 text-orange-600' },
             { title: 'Fresh Flavors', desc: 'Seasonal local ingredients used.', icon: Utensils, color: 'bg-blue-100 text-blue-600' },
             { title: 'Live Updates', desc: 'Real-time GPS tracking always.', icon: Clock, color: 'bg-green-100 text-green-600' }
           ].map((stat, i) => (
             <div key={i} className="vibrant-card p-6 flex flex-col items-center text-center">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.color)}>
                  <stat.icon size={24} />
                </div>
                <h3 className="font-black text-text">{stat.title}</h3>
                <p className="text-sm text-text/50 mt-1">{stat.desc}</p>
             </div>
           ))}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="vibrant-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">Featured Items</h3>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">In Stock</span>
          </div>
          <div className="space-y-4">
            {featuredItems.length > 0 ? featuredItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 border-2 border-transparent hover:border-accent rounded-2xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                  <img 
                    src={item.imageUrl || `https://picsum.photos/seed/${item.name}/100/100`} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-text/50 line-clamp-1">{item.description}</p>
                </div>
                <div className="ml-auto font-black text-secondary whitespace-nowrap">${item.price.toFixed(2)}</div>
              </div>
            )) : (
              <p className="text-sm text-text/30 italic text-center py-4">Checking the kitchen...</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-orange-50 p-4 rounded-2xl text-center">
              <span className="block text-xl font-black text-primary">4.9</span>
              <span className="text-[10px] font-bold uppercase text-text/30">Rating</span>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl text-center">
              <span className="block text-xl font-black text-primary">12m</span>
              <span className="text-[10px] font-bold uppercase text-text/30">Wait Time</span>
            </div>
          </div>
        </div>

        <div className="vibrant-card p-8 bg-secondary border-none text-white relative overflow-hidden">
           <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2">Host a BBQ?</h3>
            <p className="text-sm text-white/80 mb-6">Bring MEAT MAN to your next big event. Heavy cuts & great vibes.</p>
            <button onClick={() => setActiveTab?.('book')} className="w-full vibrant-button py-4 bg-white text-secondary text-base">
              Book the MEAT MAN Now
            </button>
           </div>
           <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      </aside>
      <ContactSection />
    </div>
  );
};

const MenuView = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const { isAdmin } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'menu')), (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });
    return () => unsub();
  }, []);

  const toggleAvailability = async (id: string, current: boolean) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'menu', id), { available: !current });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `menu/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'menu', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `menu/${id}`);
    }
  };

  const categories = ["Main", "Drink", "Sauce", "Appetizer", "Chips"];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-text tracking-tighter">The Full Menu</h2>
          <p className="text-text/50 font-medium">Chef-inspired street food made with local love.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="vibrant-button px-6 py-3 bg-primary text-white shadow-lg shadow-primary/30"
          >
            <Plus size={20} className="mr-2 inline" /> Add Item
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        <div className="space-y-12">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            
            return (
              <div key={cat} className="space-y-6">
                <h3 className="text-2xl font-black text-text border-l-8 border-secondary pl-4">
                  {cat}s
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catItems.map(item => (
                    <div key={item.id} className={cn(
                      "vibrant-card overflow-hidden group border-2 border-transparent hover:border-accent shadow-none hover:shadow-xl",
                      !item.available && "opacity-60 grayscale-[0.5]"
                    )}>
                      <div className="h-40 overflow-hidden relative">
                        <img 
                          src={item.imageUrl || `https://picsum.photos/seed/${item.name}/400/300`} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-black text-secondary shadow-sm">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="font-black text-text text-lg mb-1">{item.name}</h4>
                        <p className="text-sm text-text/40 font-medium line-clamp-2 mb-4">{item.description}</p>
                        {isAdmin && (
                          <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
                            <button 
                              onClick={() => toggleAvailability(item.id, item.available)}
                              className={cn(
                                "p-2 rounded-xl transition-colors",
                                item.available ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-600"
                              )}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => deleteItem(item.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-xl"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="space-y-6 hidden lg:block">
          <div className="vibrant-card p-6 bg-accent text-white border-none">
            <Utensils size={40} className="mb-4 text-white/40" />
            <h3 className="text-xl font-black mb-2">Feeling Hungry?</h3>
            <p className="text-sm text-white/90">Our truck is currently serving fresh hot meals at Art District East Side.</p>
          </div>
          <div className="vibrant-card p-6">
            <h4 className="font-black mb-4">Dietary Info</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold text-xs">V</div>
                <span className="text-sm font-bold text-text/70">Vegan Options</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs">GF</div>
                <span className="text-sm font-bold text-text/70">Gluten-Free Available</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await addDoc(collection(db, 'menu'), {
                    name: formData.get('name'),
                    price: parseFloat(formData.get('price') as string),
                    category: formData.get('category'),
                    description: formData.get('description'),
                    imageUrl: formData.get('imageUrl'),
                    available: true
                  });
                  setShowAddModal(false);
                } catch (err) {
                  handleFirestoreError(err, OperationType.CREATE, 'menu');
                }
              }} className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold">New Menu Item</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                    <input required name="name" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price ($)</label>
                      <input required name="price" type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                      <select name="category" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Image URL</label>
                    <input name="imageUrl" placeholder="HTTPS link to image" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                    <textarea name="description" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4">
                  Add to Menu
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AboutView = () => {
  return (
    <div className="space-y-12">
      {/* ... Hero and Stats ... */}
      <section className="vibrant-card p-10 bg-primary text-white border-none overflow-hidden relative">
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase">THE MEAT MAN STORY</h2>
          <p className="text-xl font-bold opacity-90 leading-relaxed mb-6">
            We don't just sell BBQ; we sell the soul of the smokehouse. MEAT MAN started with a simple mission: 
            to bring the heaviest cuts and the honest flavors of low-and-slow cooking to every corner of the city.
          </p>
          <div className="flex flex-wrap gap-4">
             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-black">EST. 2024</div>
             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-black">100% PURE WOOD SMOKED</div>
             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-black">LOCAL INGREDIENTS</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl opacity-30" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="vibrant-card p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6">
            <Utensils size={40} />
          </div>
          <h3 className="text-2xl font-black mb-4">OUR PROMISE</h3>
          <p className="text-text/60 font-medium leading-relaxed">
            Every brisket is seasoned by hand and smoked for 12+ hours using local oak. No shortcuts. No gas. 
            Just fire, smoke, and patience. We believe that the best MEAT takes time, and we're happy to wait for it.
          </p>
        </div>
        <div className="vibrant-card p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6">
            <MapPin size={40} />
          </div>
          <h3 className="text-2xl font-black mb-4">ON THE MOVE</h3>
          <p className="text-text/60 font-medium leading-relaxed">
            Good BBQ shouldn't be a destination; it should be an experience that finds you. Our mobile smokehouse 
            allows us to keep the fire burning wherever the people are. From festivals to your backyard, 
            MEAT MAN is always on the move.
          </p>
        </div>
      </div>

      <div className="vibrant-card p-12 bg-slate-900 text-white border-none text-center">
        <h3 className="text-3xl font-black mb-6 uppercase">CRAFTED FOR CARNIVORES</h3>
        <p className="text-white/60 mb-8 max-w-xl mx-auto leading-relaxed">
          Whether you're finishing a long day at work or celebrating a milestone, 
          MEAT MAN provides the fuel for your fire. Serious hunger requires serious BBQ.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           {[
             { label: 'Pounds Smoked', value: '14,000+' },
             { label: 'Happy Guests', value: '8,500+' },
             { label: 'Wood Sources', value: '100% Local' },
             { label: 'Smokers', value: 'Always Hot' }
           ].map(stat => (
             <div key={stat.label}>
                <div className="text-3xl font-black text-primary">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">{stat.label}</div>
             </div>
           ))}
        </div>
      </div>
      <ContactSection />
    </div>
  );
};

const BookView = () => {
  const { user, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    userEmail: '',
    location: '',
    date: ''
  });

  useEffect(() => {
    const q = isAdmin 
      ? query(collection(db, 'bookings'), orderBy('date', 'asc'))
      : user 
        ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
        : null;
    
    if (!q) return;

    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });
    return () => unsub();
  }, [user, isAdmin]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user?.uid || null,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        userEmail: formData.userEmail,
        date: new Date(formData.date),
        location: formData.location,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setStep(1);
      setFormData({ firstName: '', lastName: '', phone: '', userEmail: '', location: '', date: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl font-black text-text tracking-tighter uppercase">Book the MEAT MAN</h2>
          <p className="text-text/50 font-medium tracking-tight">GUEST CHECKOUT AVAILABLE. ENTER DETAILS TO RESERVE THE SMOKER.</p>
        </div>

        <div className="vibrant-card p-8">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {step === 1 ? (
                  <form onSubmit={handleNextStep} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-2">First Name</label>
                        <input 
                          required 
                          placeholder="Your first name"
                          value={formData.firstName}
                          onChange={e => setFormData({...formData, firstName: e.target.value})}
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-2">Last Name</label>
                        <input 
                          required 
                          placeholder="Your last name"
                          value={formData.lastName}
                          onChange={e => setFormData({...formData, lastName: e.target.value})}
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-2">Phone Number</label>
                      <input 
                        required 
                        type="tel"
                        placeholder="E.g. (555) 000-0000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-2">Email Address</label>
                      <input 
                        required 
                        type="email"
                        placeholder="master@meatman.com"
                        value={formData.userEmail}
                        onChange={e => setFormData({...formData, userEmail: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text/40 tracking-widest mb-2">Event Address</label>
                      <input 
                        required 
                        placeholder="Where is the party? (Physical Address)"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm" 
                      />
                    </div>
                    <button type="submit" className="vibrant-button w-full py-4 bg-secondary text-white font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">
                      Next: Choose Date
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-6 text-center">
                    <div className="mb-8">
                       <Calendar size={64} className="mx-auto text-primary mb-4" />
                       <h3 className="text-2xl font-black mb-2 tracking-tighter">SELECT YOUR DATE</h3>
                       <p className="text-sm font-medium text-text/50 uppercase tracking-wide">Ready the fire for which day?</p>
                    </div>
                    <input 
                      required 
                      type="datetime-local" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-primary outline-none font-black text-lg text-center" 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="vibrant-button py-4 bg-slate-100 text-text/40 font-bold uppercase tracking-widest"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="vibrant-button py-4 bg-primary text-white font-black uppercase tracking-widest"
                      >
                        {submitting ? 'SENDING...' : 'CONFIRM BBQ'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase">REQUEST FIRED!</h3>
                <p className="text-text/60 font-medium mb-8">The pitmaster has received your details and will email you the confirmation shortly.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="vibrant-button px-8 py-3 bg-text text-white font-black uppercase tracking-widest"
                >
                  Book Another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-6 text-center">
          <div className="vibrant-card p-6 bg-secondary text-white border-none shadow-xl shadow-secondary/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock size={24} />
            </div>
            <p className="text-[10px] font-black uppercase opacity-60">Avg Response</p>
            <p className="text-base font-black uppercase">Under 24H</p>
          </div>
          <div className="vibrant-card p-6 flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <p className="text-[10px] font-black uppercase text-text/30">NOTICE</p>
            <p className="text-base font-black text-text uppercase">Live Fire BBQ</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-text flex items-center gap-3 uppercase tracking-tighter">
          {isAdmin ? 'ADMIN: Requests' : 'Your History'}
          <span className="text-sm font-black bg-slate-100 text-text/40 px-3 py-1 rounded-full">{isAdmin ? bookings.length : (user ? bookings.length : 0)}</span>
        </h3>
        
        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {(isAdmin || user) ? bookings.map(booking => (
            <div key={booking.id} className="vibrant-card p-6 border-b-8 border-transparent hover:border-accent group">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-md",
                      booking.status === 'confirmed' ? "bg-green-100 text-green-700" : 
                      booking.status === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    )}>
                      {booking.status}
                    </span>
                    <span className="text-[10px] text-text/30 font-bold uppercase tracking-widest">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'MMM d') : ''}
                    </span>
                  </div>
                  <h4 className="font-black text-text text-lg">
                    {isAdmin ? `${booking.firstName} ${booking.lastName}` : (booking.date?.toDate ? format(booking.date.toDate(), 'EEEE, MMM d') : 'Pending Date')}
                  </h4>
                  <div className="space-y-1 mt-2">
                    <p className="text-xs text-text/50 font-bold flex items-center gap-1">
                      <MapPin size={12} className="text-primary" /> {booking.location}
                    </p>
                    {isAdmin && (
                      <div className="pt-2">
                        <p className="text-xs text-text/80 font-black tracking-widest">{booking.phone}</p>
                        <p className="text-[10px] text-text/40 font-bold">{booking.userEmail}</p>
                        {booking.date?.toDate && (
                          <p className="text-[10px] text-primary font-black mt-1 uppercase">Event: {format(booking.date.toDate(), 'PP p')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isAdmin && booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors"
                      title="Confirm"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                      title="Cancel"
                    >
                      <X size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        const sub = `MEAT MAN Booking Request - ${booking.firstName} ${booking.lastName}`;
                        const body = `Hi ${booking.firstName},\n\nThis is the Pitmaster from MEAT MAN BBQ. Regarding your request for ${booking.location} on ${format(booking.date.toDate(), 'PPpp')}...\n\n`;
                        window.location.href = `mailto:${booking.userEmail}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
                      }}
                      className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                      title="Email Client"
                    >
                      <UserIcon size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="vibrant-card p-10 text-center bg-slate-50 border-none">
               <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <LogOut size={24} />
               </div>
               <p className="text-xs font-bold uppercase tracking-widest text-text/30">Sign in to track persistent history</p>
            </div>
          )}

          {(isAdmin || user) && bookings.length === 0 && (
            <div className="py-20 text-center bg-white rounded-card border-4 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <Calendar size={32} />
              </div>
              <p className="text-text/30 font-bold">No history available yet.</p>
            </div>
          )}
        </div>
      </div>
      <ContactSection />
    </div>
  );
};

const AdminView = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const [location, setLocation] = useState<TruckLocation | null>(null);
  const [updating, setUpdating] = useState(false);
  const [admins, setAdmins] = useState<{ email: string }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const unsubLoc = onSnapshot(doc(db, 'location', 'current'), (doc) => {
      if (doc.exists()) setLocation(doc.data() as TruckLocation);
    });

    const unsubAdmins = onSnapshot(collection(db, 'admins'), 
      (snap) => {
        setAdmins(snap.docs.map(doc => ({ email: doc.id })));
      },
      (err) => {
        console.error("Admin List Error:", err);
        // If we get a permission error here, it likely means the user isn't actually an admin yet
        // according to the rules, even if the state thinks they are.
      }
    );

    return () => {
      unsubLoc();
      unsubAdmins();
    };
  }, []);

  const handleUpdateLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await setDoc(doc(db, 'location', 'current'), {
        address: formData.get('address'),
        latitude: parseFloat(formData.get('latitude') as string),
        longitude: parseFloat(formData.get('longitude') as string),
        isPrivate: formData.get('isPrivate') === 'on',
        inviteLink: formData.get('inviteLink'),
        updatedAt: serverTimestamp()
      });
      alert('Location updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'location/current');
    } finally {
      setUpdating(false);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    try {
      await setDoc(doc(db, 'admins', newAdminEmail.toLowerCase().trim()), {
        addedAt: serverTimestamp(),
        addedBy: currentUser?.email
      });
      setNewAdminEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'admins');
    }
  };

  const removeAdmin = async (email: string) => {
    if (email === "outgame954@gmail.com") {
      alert("Cannot remove super-admin.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${email} from administrators?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', email));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${email}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="vibrant-card p-8">
          <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter">Update Truck Location</h2>
          <form onSubmit={handleUpdateLocation} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-text/40 tracking-widest mb-2">Current Address</label>
              <input name="address" defaultValue={location?.address} required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-text/40 tracking-widest mb-2">Latitude</label>
                <input name="latitude" type="number" step="any" defaultValue={location?.latitude} required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-text/40 tracking-widest mb-2">Longitude</label>
                <input name="longitude" type="number" step="any" defaultValue={location?.longitude} required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none font-bold" />
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl space-y-6 text-white border-none">
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="font-black">Private Event Mode</h4>
                    <p className="text-xs text-white/40 font-bold">Lock the map and show an invite link (Editor Control)</p>
                 </div>
                 <input 
                   name="isPrivate" 
                   type="checkbox" 
                   defaultChecked={location?.isPrivate}
                   className="w-8 h-8 rounded-xl accent-primary transition-all cursor-pointer" 
                 />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Invite Link (Visible during Private Events)</label>
                <input 
                  name="inviteLink" 
                  defaultValue={location?.inviteLink} 
                  placeholder="https://event-invite.com"
                  className="w-full px-4 py-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-primary outline-none font-bold text-sm" 
                />
              </div>
            </div>
            <button type="submit" disabled={updating} className="vibrant-button w-full py-4 bg-primary text-white shadow-lg">
              {updating ? 'Updating...' : 'Save Live Location'}
            </button>
          </form>
        </div>

        <div className="vibrant-card p-8 bg-slate-50 border-none">
          <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter font-sans flex items-center gap-3">
             <UserIcon className="text-text/20" /> Manage Admins
          </h2>
          
          <form onSubmit={addAdmin} className="flex gap-4 mb-8">
            <input 
              required 
              type="email" 
              placeholder="newadmin@email.com"
              value={newAdminEmail}
              onChange={e => setNewAdminEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-transparent focus:border-secondary outline-none font-bold text-sm" 
            />
            <button type="submit" className="vibrant-button px-6 bg-secondary text-white">
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xs">SA</div>
                <span className="font-bold text-sm">outgame954@gmail.com</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded">Super Admin</span>
            </div>
            {admins.filter(a => a.email !== "outgame954@gmail.com").map(admin => (
              <div key={admin.email} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-black text-xs">AD</div>
                  <span className="font-bold text-sm">{admin.email}</span>
                </div>
                <button 
                  onClick={() => removeAdmin(admin.email)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="vibrant-card p-8 bg-text text-white border-none flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter font-sans">Quick Navigation</h3>
          <p className="text-white/40 text-sm font-bold tracking-tight">Jump to other kitchen management areas</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setActiveTab('menu')} className="vibrant-button px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10">Manage Menu Stock</button>
          <button onClick={() => setActiveTab('book')} className="vibrant-button px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10">View All Bookings</button>
        </div>
      </div>
    </div>
  );
};

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('track');
  const { user, isAdmin, signIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'track' && <TrackView setActiveTab={setActiveTab} />}
            {activeTab === 'menu' && <MenuView />}
            {activeTab === 'book' && <BookView />}
            {activeTab === 'reviews' && <ReviewsView />}
            {activeTab === 'about' && <AboutView />}
            {activeTab === 'admin' && isAdmin && <AdminView setActiveTab={setActiveTab} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-8 mt-auto flex justify-center">
        {!user ? (
          <button 
            onClick={signIn}
            className="vibrant-button px-8 py-4 bg-text text-white shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
          >
            <UserIcon size={20} /> Login & Edit Website
          </button>
        ) : isAdmin ? (
          <button 
            onClick={() => setActiveTab('admin')}
            className={cn(
              "vibrant-button px-8 py-4 bg-primary text-white shadow-2xl hover:scale-105 transition-transform flex items-center gap-3",
              activeTab === 'admin' && "ring-4 ring-offset-2 ring-primary"
            )}
          >
            <Plus size={20} /> Admin Dashboard: Edit Details
          </button>
        ) : (
          <div className="text-text/20 font-black tracking-widest uppercase text-xs">© 2026 MEAT MAN</div>
        )}
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
