"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  Plus,
  Minus,
  Truck,
  RotateCcw,
  ShieldCheck,
  X,
  Check,
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Printer,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Toaster, toast } from "sonner";
import { catalog, Product, money } from "@/lib/catalog";
import { scrollToTarget } from "@/components/smooth-scroll";
import AuthCard from "@/components/auth-card";
import AccountDashboard, { Order, BagItem } from "@/components/account-dashboard";
import ContactCare from "@/components/contact-care";
import BrandStory from "@/components/brand-story";
type CompletedOrder = {
  id: string;
  total: number;
  items: (BagItem & { name: string; price: number; image?: string })[];
  address: {
    name: string;
    email: string;
    street: string;
    city: string;
    postal: string;
    country?: string;
  };
  status?: string;
  createdAt?: string;
};
type StoreData = {
  products: Product[];
  user: { name: string; email: string } | null;
  bag: BagItem[];
  wishlist: string[];
  orders: Order[];
};
const initialStoreData: StoreData = {
  products: catalog,
  user: null,
  bag: [],
  wishlist: [],
  orders: [],
};
let memoryStoreData: StoreData | null = null;

export default function Store({
  view = "home",
  slug,
  initialCategory,
}: {
  view?: string;
  slug?: string;
  initialCategory?: string;
}) {
  const [data, setData] = useState<StoreData>(initialStoreData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [sizeGuide, setSizeGuide] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "All");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [info, setInfo] = useState("");
  const [result, setResult] = useState<CompletedOrder | null>(null);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      setRequestId(crypto.randomUUID());
    }
  }, []);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/store");
      const body = (await res.json()) as StoreData & { error?: string };
      if (!res.ok) throw new Error(body.error);
      setData(body);
      memoryStoreData = body;
      try {
        sessionStorage.setItem("ww_store_cache", JSON.stringify(body));
      } catch {}
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    // Restore cached session/cart data on client mount after SSR hydration
    try {
      if (memoryStoreData) {
        setData(memoryStoreData);
      } else {
        const cached = sessionStorage.getItem("ww_store_cache");
        if (cached) {
          const parsed = JSON.parse(cached) as StoreData;
          if (
            parsed &&
            Array.isArray(parsed.products) &&
            parsed.products.length > 0
          ) {
            memoryStoreData = parsed;
            setData(parsed);
          }
        }
      }
    } catch {}

    refresh();
    if (typeof window !== "undefined") {
      const c = new URLSearchParams(window.location.search).get("category");
      if (c) setCategory(c);
    }
  }, [refresh, view, slug]);

  // Realtime synchronization: Poll /api/store every 3 seconds on account page, and immediately when tab regains focus
  useEffect(() => {
    if (view === "account") {
      refresh();
      const interval = setInterval(() => {
        refresh();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [view, refresh]);

  useEffect(() => {
    const handleFocus = () => {
      refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      toast.success("Signed out successfully.");
      memoryStoreData = null;
      try {
        sessionStorage.removeItem("ww_store_cache");
      } catch {}
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const value = (await res.json()) as {
        error?: string;
        signIn?: boolean;
        id?: string;
        total?: number;
      };
      if (!res.ok) {
        if (value.signIn) setPanel("signin");
        throw new Error(value.error);
      }
      await refresh();
      return value;
    } catch (e) {
      toast.error((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  function quick(p: Product) {
    setSelected(p);
    setSize("");
  }
  async function add(p: Product, chosen: string) {
    if (!chosen) {
      toast.error("Choose your size first.");
      return;
    }
    const current = data.bag.find(
      (i) => i.productId === p.id && i.size === chosen,
    );
    if (
      await mutate({
        action: "bag",
        productId: p.id,
        size: chosen,
        quantity: (current?.quantity || 0) + 1,
      })
    ) {
      setSelected(null);
      setPanel("bag");
      toast.success("Added to your bag");
    }
  }
  const count = data.bag.reduce((n, i) => n + i.quantity, 0);
  const subtotal = data.bag.reduce(
    (n, i) =>
      n +
      (data.products.find((p) => p.id === i.productId)?.price || 0) *
        i.quantity,
    0,
  );
  const shipping = subtotal >= 7500 ? 0 : 199;
  useEffect(() => {
    setPage(1);
  }, [category, query, sort]);
  const filtered = data.products
    .filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (p.name + " " + p.color + " " + p.category)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  useEffect(() => {
    if (view !== "home" && view !== "shop") return;
    const mc = (document as unknown as Record<string, unknown>).modelContext as
      | { registerTool?: (spec: unknown, opts: unknown) => Promise<void> }
      | undefined;
    if (!mc?.registerTool) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        mc.registerTool(
          {
            name: "filter_westward_catalog",
            description:
              "Filter the visible menswear collection by category and search text.",
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: [
                    "All",
                    "Shirts",
                    "Essentials",
                    "Denim",
                    "Outerwear",
                    "Footwear",
                  ],
                },
                query: { type: "string" },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute(input: Record<string, unknown>) {
              if (
                !input ||
                typeof input !== "object" ||
                (input.query !== undefined &&
                  typeof input.query !== "string") ||
                (input.category !== undefined &&
                  ![
                    "All",
                    "Shirts",
                    "Essentials",
                    "Denim",
                    "Outerwear",
                    "Footwear",
                  ].includes(input.category as string))
              )
                throw new Error("Invalid catalog filter");
              setCategory((input.category as string) || "All");
              setQuery((input.query as string) || "");
              scrollToTarget("#collection", { offset: -70 });
              return {
                category: (input.category as string) || "All",
                query: (input.query as string) || "",
              };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, [view]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filtered.slice(
    (currentPage - 1) * 20,
    currentPage * 20,
  );
  const card = (p: Product) => (
    <article className="product-card" key={p.id}>
      <div className="product-photo">
        <Link href={"/product/" + p.id}>
          <img
            src={"/images/" + p.image + ".jpg"}
            alt={p.name + " in " + p.color}
            loading="lazy"
            decoding="async"
          />
        </Link>
        <span className="product-tag">{p.tag}</span>
        <button
          aria-label={
            (data.wishlist.includes(p.id) ? "Unsave " : "Save ") + p.name
          }
          className={"heart " + (data.wishlist.includes(p.id) ? "active" : "")}
          disabled={busy}
          onClick={() =>
            mutate({
              action: "wishlist",
              productId: p.id,
              saved: !data.wishlist.includes(p.id),
            })
          }
        >
          <Heart
            fill={data.wishlist.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
        <button className="quick-add" onClick={() => quick(p)}>
          Choose size <Plus size={16} />
        </button>
      </div>
      <div className="product-title">
        <Link href={"/product/" + p.id}>{p.name}</Link>
        <span>{money(p.price)}</span>
      </div>
      <p className="product-color">{p.color}</p>
      <div className="swatches">
        <span style={{ background: p.hex }} />
        <small>{p.color}</small>
      </div>
    </article>
  );
  const filters = (
    <div className="catalog-controls">
      <div className="categories">
        {["All", "Shirts", "Essentials", "Denim", "Outerwear", "Footwear"].map(
          (c) => (
            <button
              key={c}
              className={category === c ? "chosen" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c === "All" ? "All pieces" : c}
              <span className="category-count">
                {c === "All"
                  ? data.products.length
                  : data.products.filter((p) => p.category === c).length}
              </span>
            </button>
          ),
        )}
      </div>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger aria-label="Sort products">
          <SlidersHorizontal />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="low">Price: low to high</SelectItem>
          <SelectItem value="high">Price: high to low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  function details(p: Product) {
    return (
      <div className="product-details">
        <p className="eyebrow">
          {p.category} / {p.tag}
        </p>
        <h1>{p.name}</h1>
        <p className="detail-price">
          {money(p.price)} <span>Inclusive of taxes</span>
        </p>
        <p>{p.description}</p>
        <p className="fabric">{p.fabric}</p>
        <p className="photo-note">
          Illustrative collection photography · Sample product
        </p>
        <hr />
        <p className="color-label">
          <span style={{ background: p.hex }} />
          Colour: {p.color}
        </p>
        <div className="size-label">
          <b>Select your size</b>
          <button className="text-link" onClick={() => setSizeGuide(true)}>
            Size guide
          </button>
        </div>
        <RadioGroup
          value={size}
          onValueChange={setSize}
          className="size-options"
          aria-label="Product size"
        >
          {p.sizes.map((s) => (
            <label className={size === s ? "checked" : ""} key={s}>
              <RadioGroupItem value={s} className="sr-only" />
              {s}
            </label>
          ))}
        </RadioGroup>
        <button
          className="button add-button"
          disabled={busy || loading || !!error}
          onClick={() => add(p, size)}
        >
          Add to bag <ShoppingBag />
        </button>
        <div className="detail-services">
          <span>
            <Truck /> Complimentary delivery over ₹7,500
          </span>
          <span>
            <RotateCcw /> 14-day returns on unworn pieces
          </span>
        </div>
        <details>
          <summary>Materials & care</summary>
          <p>
            {p.fabric}. Follow the garment care label. Wash cotton pieces gently
            with similar colours; specialist cleaning is recommended for
            outerwear and leather.
          </p>
        </details>
        <details>
          <summary>Delivery & returns</summary>
          <p>
            Preview delivery estimate: 3–7 business days within India. This is a
            sample storefront; demo orders are not charged or shipped.
          </p>
        </details>
      </div>
    );
  }
  const currentProduct = data.products.find((p) => p.id === slug);
  return (
    <>
      <Toaster position="bottom-center" richColors />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className={`header glass-header ${scrolled ? "scrolled" : ""}`}>
        <button
          className="mobile-menu icon glass-action-btn"
          aria-label="Open navigation"
          onClick={() => setPanel("menu")}
        >
          <Menu size={20} />
        </button>
        <Link className="wordmark" href="/">
          WESTWARD<span>INDEPENDENT SPIRIT. CONSIDERED STYLE.</span>
        </Link>
        <nav aria-label="Main navigation" className="glass-nav">
          <Link href="/shop" className="nav-item">
            New arrivals
          </Link>
          <Link href="/shop?category=Shirts" className="nav-item">
            Clothing
          </Link>
          <Link href="/shop?category=Footwear" className="nav-item">
            Footwear
          </Link>
          <Link href="/contact" className="nav-item">
            Contact & care
          </Link>
          <Link href="/#story" className="nav-item">
            Our story
          </Link>
        </nav>
        <div className="header-actions">
          <button
            className="icon glass-action-btn search-btn"
            aria-label="Search store"
            onClick={() => setPanel("search")}
          >
            <Search size={18} />
          </button>
          <Link
            className="icon glass-action-btn account-icon"
            href="/account"
            aria-label="Your account"
          >
            <UserRound size={18} />
            {data.user && (
              <span
                className="glass-user-dot"
                title={`Signed in as ${data.user.name}`}
              />
            )}
          </Link>
          <button
            className="icon glass-action-btn wishlist-icon"
            aria-label="Saved pieces"
            onClick={() => setPanel("wishlist")}
          >
            <Heart size={18} />
            {data.wishlist.length > 0 && (
              <span className="glass-count-dot">{data.wishlist.length}</span>
            )}
          </button>
          <button
            className="icon glass-action-btn bag-icon"
            aria-label={"Shopping bag, " + count + " items"}
            onClick={() => setPanel("bag")}
          >
            <ShoppingBag size={18} />
            {count > 0 && <span className="glass-bag-pill">{count}</span>}
          </button>
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error} <button onClick={refresh}>Retry</button>
        </div>
      )}
      <main id="main" key={view + (slug || "")} className="page-transition-content">
        {view === "home" && (
          <>
            <section className="hero">
              <img
                src="/images/6838911.jpg"
                alt="A man in a checked shirt and western hat looks across the open desert"
                fetchPriority="high"
              />
              <div className="hero-copy">
                <p className="eyebrow">THE OPEN ROAD COLLECTION / 01</p>
                <h1>
                  Made for
                  <br />
                  <i>your own way.</i>
                </h1>
                <p>
                  Modern essentials. A western soul.
                  <br />
                  For wherever the day takes you.
                </p>
                <Link className="button light" href="/shop">
                  Explore the collection <ArrowUpRight />
                </Link>
              </div>
              <div className="hero-bottom">
                <span>LESS, BUT BETTER.</span>
                <span>DESIGNED TO GO THE DISTANCE.</span>
              </div>
            </section>
            <div className="values-strip">
              <span>
                <Truck /> Complimentary shipping over ₹7,500
              </span>
              <span>
                <RotateCcw /> Easy 14-day returns
              </span>
              <span>
                <ShieldCheck /> Thoughtfully considered essentials
              </span>
            </div>
            <section className="collection-section" id="collection">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE EVERYDAY ROTATION</p>
                  <h2>Good things. Worn often.</h2>
                </div>
                <Link className="text-link" href="/shop">
                  Shop all pieces <ArrowUpRight />
                </Link>
              </div>
              {filters}
              <div className="product-grid">
                {filtered.slice(0, 4).map(card)}
              </div>
              {filtered.length > 4 && (
                <div className="collection-more">
                  <p>Showing 4 of {filtered.length} pieces</p>
                  <Link
                    className="button"
                    href={
                      "/shop" +
                      (category === "All"
                        ? ""
                        : "?category=" + encodeURIComponent(category))
                    }
                  >
                    View all {filtered.length}{" "}
                    {category === "All" ? "pieces" : category.toLowerCase()}
                  </Link>
                </div>
              )}
              {!filtered.length && (
                <p className="empty">No pieces found. Try another category.</p>
              )}
            </section>
            <section className="editorial">
              <div className="editorial-image">
                <img
                  src="/images/8350480.jpg"
                  alt="Relaxed white shirting in the desert"
                  loading="lazy"
                />
              </div>
              <div className="editorial-copy">
                <p className="eyebrow">THE ART OF TAKING IT EASY</p>
                <h2>
                  A little less rush.
                  <br />A little more living.
                </h2>
                <p>
                  Sun-faded shades. Natural textures. Shapes that move with you.
                  Meet the pieces that make getting dressed feel effortless.
                </p>
                <Link className="button" href="/shop?category=Shirts">
                  Find your everyday <ArrowUpRight />
                </Link>
                <span className="editorial-note">01 / THE SHIRT EDIT</span>
              </div>
            </section>
            <section className="collection-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">BUILD YOUR OWN UNIFORM</p>
                  <h2>Find your direction.</h2>
                </div>
                <span className="subtle">
                  Distinct pieces. Endless possibilities.
                </span>
              </div>
              <div className="category-grid">
                {[
                  {
                    name: "Denim, done right.",
                    category: "Denim",
                    image: "26769894",
                  },
                  {
                    name: "Layers with character.",
                    category: "Outerwear",
                    image: "3448328",
                  },
                  {
                    name: "Grounded in style.",
                    category: "Footwear",
                    image: "9929606",
                  },
                ].map((c) => (
                  <Link
                    href={"/shop?category=" + c.category}
                    className="category-card"
                    key={c.category}
                  >
                    <img
                      src={"/images/" + c.image + ".jpg"}
                      alt={c.category}
                      loading="lazy"
                    />
                    <div>
                      <span>{c.category.toUpperCase()}</span>
                      <h3>
                        {c.name} <ArrowUpRight />
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            <BrandStory />
          </>
        )}
        {view === "shop" && (
          <section className="collection-section shop-page" id="collection">
            <p className="breadcrumb">
              <Link href="/">Home</Link> / The collection
            </p>
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE OPEN ROAD COLLECTION</p>
                <h1>
                  {category === "All" ? "Your everyday. Elevated." : category}
                </h1>
                <p className="subtle">
                  A considered collection for a life in motion.
                </p>
              </div>
              <span aria-live="polite">{filtered.length} pieces</span>
            </div>
            <div className="search-field">
              <Search />
              <input
                aria-label="Search the collection"
                placeholder="Find your next favourite piece…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X />
                </button>
              )}
            </div>
            {filters}
            <div className="product-grid">{visibleProducts.map(card)}</div>
            {filtered.length > 0 && (
              <div className="catalog-pagination">
                <p aria-live="polite">
                  Showing {(currentPage - 1) * 20 + 1}–
                  {Math.min(currentPage * 20, filtered.length)} of{" "}
                  {filtered.length} pieces
                </p>
                {pageCount > 1 && (
                  <Pagination aria-label="Collection pages">
                    <PaginationContent>
                      {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                        (n) => (
                          <PaginationItem key={n}>
                            <PaginationLink
                              href="#collection"
                              isActive={currentPage === n}
                              aria-label={"Page " + n}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(n);
                                scrollToTarget("#collection", { offset: -70 });
                              }}
                            >
                              {n}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
            {!filtered.length && (
              <div className="empty">
                <Search />
                <h2>No pieces found</h2>
                <p>Try a different search or explore the full collection.</p>
                <button
                  className="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </section>
        )}
        {view === "product" &&
          (currentProduct ? (
            <section className="product-page">
              <p className="breadcrumb">
                <Link href="/">Home</Link> / <Link href="/shop">Collection</Link> /{" "}
                {currentProduct.name}
              </p>
              <div className="product-layout">
                <div className="detail-image">
                  <img
                    src={"/images/" + currentProduct.image + ".jpg"}
                    alt={currentProduct.name}
                  />
                  <span>THE WESTWARD COLLECTION</span>
                </div>
                {details(currentProduct)}
              </div>
              <div className="related">
                <div className="section-heading">
                  <h2>Goes your way.</h2>
                  <Link href="/shop" className="text-link">
                    Explore all <ArrowUpRight />
                  </Link>
                </div>
                <div className="product-grid">
                  {data.products
                    .filter((p) => p.id !== currentProduct.id)
                    .slice(0, 4)
                    .map(card)}
                </div>
              </div>
            </section>
          ) : (
            <div className="empty">
              <h1>Piece not found</h1>
              <Link href="/shop" className="button">
                Explore the collection
              </Link>
            </div>
          ))}
        {view === "account" && (
          <section className="account-page">
            <p className="breadcrumb">
              <Link href="/">Home</Link> / Your account
            </p>
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR WESTWARD</p>
                <h1>A space of your own.</h1>
                <p className="subtle">
                  Manage your orders, saved pieces and account preferences in
                  one place.
                </p>
              </div>
            </div>
            {loading ? (
              <p>Loading your account…</p>
            ) : !data.user ? (
              <AuthCard
                title="Sign in or create account"
                subtitle="Sign in to keep your bag, saved pieces and order history together in real time."
                onSuccess={refresh}
              />
            ) : (
              <AccountDashboard
                user={data.user}
                orders={data.orders}
                wishlist={data.wishlist}
                products={data.products}
                bagCount={count}
                onLogout={logout}
                busy={busy}
                onMutate={mutate}
                onQuickAdd={quick}
                money={money}
              />
            )}
          </section>
        )}
        {view === "checkout" && (
          <section className="checkout-page">
            <Link className="text-link" href="/shop">
              ← Continue shopping
            </Link>
            <h1>{result ? "Order Confirmed." : "Make it yours."}</h1>
            {result ? (
              <div className="order-confirmed-container">
                {/* Top Success Banner */}
                <div className="order-confirmed-banner">
                  <div className="confirmed-banner-main">
                    <div className="confirmed-check-wrap">
                      <Check className="confirmed-check-icon" size={26} />
                    </div>
                    <div className="confirmed-banner-text">
                      <span className="confirmed-kicker">Order Placed & Confirmed</span>
                      <h2>
                        Thank you for your order
                        {result.address?.name ? `, ${result.address.name.split(" ")[0]}` : ""}
                        .
                      </h2>
                      <p className="confirmed-subtext">
                        Your order has been officially received and is being prepared in our atelier. 
                        Tracking updates and digital documentation are linked to <strong>{result.address?.email}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="confirmed-ref-pill">
                    <span className="ref-label">ORDER REFERENCE</span>
                    <span className="ref-number">{result.id}</span>
                  </div>
                </div>

                {/* Tracking & Timeline Stepper */}
                <div className="order-stepper-card">
                  <div className="stepper-header">
                    <div>
                      <span className="stepper-status-badge">
                        <CheckCircle2 size={14} /> Status: {result.status || "Confirmed"}
                      </span>
                      <h3>
                        Estimated Delivery:{" "}
                        {(() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 4);
                          return d.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                        })()}
                      </h3>
                    </div>
                    <span className="stepper-carrier-tag">
                      <Truck size={14} /> BlueDart Priority Express
                    </span>
                  </div>

                  <div className="order-progress-track">
                    <div className="track-step active completed">
                      <div className="step-circle">
                        <Check size={14} />
                      </div>
                      <span className="step-label">Order Placed</span>
                      <span className="step-time">Confirmed</span>
                    </div>
                    <div className="track-line active" />
                    <div className="track-step active current">
                      <div className="step-circle">
                        <Sparkles size={14} />
                      </div>
                      <span className="step-label">Atelier Prep</span>
                      <span className="step-time">In Progress</span>
                    </div>
                    <div className="track-line" />
                    <div className="track-step">
                      <div className="step-circle">3</div>
                      <span className="step-label">Dispatched</span>
                      <span className="step-time">Tomorrow</span>
                    </div>
                    <div className="track-line" />
                    <div className="track-step">
                      <div className="step-circle">4</div>
                      <span className="step-label">Delivered</span>
                      <span className="step-time">3–5 Business Days</span>
                    </div>
                  </div>
                </div>

                {/* Two-Column Grid: Ordered Items + Delivery Address & Summary */}
                <div className="order-details-grid">
                  {/* Left Column: Ordered Items Details */}
                  <div className="ordered-items-panel">
                    <div className="panel-title-bar">
                      <div className="panel-title-with-badge">
                        <Package size={18} />
                        <h3>Purchased Pieces</h3>
                      </div>
                      <span className="items-count-badge">
                        {result.items.reduce((s, i) => s + (i.quantity || 1), 0)} items
                      </span>
                    </div>

                    <div className="ordered-items-list">
                      {result.items.map((item, idx) => (
                        <div className="confirmed-item-row" key={idx}>
                          <Link href={`/product/${item.productId}`} className="confirmed-item-img-link">
                            <img
                              src={`/images/${item.image || "8350480"}.jpg`}
                              alt={item.name}
                              className="confirmed-item-img"
                            />
                          </Link>
                          <div className="confirmed-item-info">
                            <Link href={`/product/${item.productId}`} className="confirmed-item-title">
                              {item.name}
                            </Link>
                            <div className="confirmed-item-meta">
                              <span className="confirmed-meta-tag">
                                Size: <strong>{item.size}</strong>
                              </span>
                              <span className="confirmed-meta-tag">
                                Quantity: <strong>{item.quantity}</strong>
                              </span>
                            </div>
                            <div className="confirmed-item-fabric-note">
                              <span>Natural Hand-Crafted Textile · Made in India</span>
                            </div>
                          </div>
                          <div className="confirmed-item-pricing">
                            <span className="item-unit-calc">
                              {item.quantity} × {money(item.price)}
                            </span>
                            <span className="item-total-price">
                              {money(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="atelier-craft-box">
                      <ShieldCheck size={18} />
                      <div>
                        <strong>WESTWARD Signature Packaging</strong>
                        <p>
                          Every piece is individually hand-wrapped in archival tissue paper, boxed in sustainably recycled kraft boxes, and sealed with our tamper-evident wax seal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Address, Payment & Order Totals */}
                  <div className="order-sidebar-panel">
                    {/* Shipping Address Card */}
                    <div className="sidebar-card">
                      <div className="sidebar-card-header">
                        <MapPin size={17} />
                        <h4>Delivery Address</h4>
                      </div>
                      <div className="address-display-box">
                        <strong className="recipient-name">{result.address?.name}</strong>
                        <p className="address-street">{result.address?.street}</p>
                        <p className="address-city-pin">
                          {result.address?.city}, {result.address?.postal}
                        </p>
                        <p className="address-country">India</p>
                        <div className="address-contact-footer">
                          <span>Recipient: {result.address?.email}</span>
                          <span>Method: Express Courier Delivery</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary & Pricing Breakdown Card */}
                    <div className="sidebar-card">
                      <div className="sidebar-card-header">
                        <CreditCard size={17} />
                        <h4>Payment & Summary</h4>
                      </div>
                      <div className="summary-breakdown">
                        <div className="summary-line">
                          <span>Items Subtotal</span>
                          <span>
                            {money(result.items.reduce((s, i) => s + i.price * i.quantity, 0))}
                          </span>
                        </div>
                        <div className="summary-line">
                          <span>Express Delivery</span>
                          <span>
                            {result.total >= 7500 ||
                            result.items.reduce((s, i) => s + i.price * i.quantity, 0) >= 7500
                              ? "Complimentary"
                              : "₹199"}
                          </span>
                        </div>
                        <div className="summary-line">
                          <span>Taxes & Duties</span>
                          <span className="tax-inclusive">Included (GST 12%)</span>
                        </div>
                        <div className="summary-divider" />
                        <div className="summary-line total-line">
                          <strong>Total Paid / Payable</strong>
                          <strong className="grand-total-amount">{money(result.total)}</strong>
                        </div>
                        <div className="payment-status-badge">
                          <CheckCircle2 size={13} />
                          <span>Order Verified · Express Dispatch Scheduled</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="order-action-buttons">
                      <Link href="/account" className="button full-button primary-action">
                        View In Your Account <ArrowRight size={16} />
                      </Link>
                      <div className="order-sub-actions">
                        <button
                          type="button"
                          className="button light sub-action-btn"
                          onClick={() => window.print()}
                        >
                          <Printer size={15} /> Print Receipt
                        </button>
                        <Link href="/shop" className="button light sub-action-btn">
                          Continue Shopping <ArrowUpRight size={15} />
                        </Link>
                      </div>
                      <Link href="/contact" className="concierge-help-link">
                        Questions about your order? <span>Contact Concierge →</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <p>Loading your bag…</p>
            ) : !data.user ? (
              <div className="checkout-auth-container">
                <AuthCard
                  title="Sign in to checkout"
                  subtitle="Sign in or create an account to proceed with your order."
                  onSuccess={refresh}
                />
              </div>
            ) : !data.bag.length ? (
              <div className="empty">
                <ShoppingBag />
                <h2>Your bag is waiting.</h2>
                <Link className="button" href="/shop">
                  Find your favourites
                </Link>
              </div>
            ) : (
              <div className="checkout-grid">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const values = Object.fromEntries(
                      new FormData(e.currentTarget).entries(),
                    );
                    const currentBagItems = data.bag.map((b) => {
                      const prod = data.products.find((p) => p.id === b.productId);
                      return {
                        productId: b.productId,
                        size: b.size,
                        quantity: b.quantity,
                        name: prod?.name || "Selected Piece",
                        price: prod?.price || 0,
                        image: prod?.image || "8350480",
                      };
                    });
                    const checkoutReqId =
                      requestId ||
                      (typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : "");
                    const r = (await mutate({
                      action: "checkout",
                      address: values,
                      requestId: checkoutReqId,
                    })) as {
                      id?: string;
                      total?: number;
                      items?: (BagItem & { name: string; price: number; image?: string })[];
                      address?: {
                        name: string;
                        email: string;
                        street: string;
                        city: string;
                        postal: string;
                        country?: string;
                      };
                      status?: string;
                      createdAt?: string;
                    } | null;
                    if (r && r.id && typeof r.total === "number") {
                      const finalOrder: CompletedOrder = {
                        id: r.id,
                        total: r.total,
                        items: Array.isArray(r.items) && r.items.length > 0 ? r.items : currentBagItems,
                        address: r.address || {
                          name: String(values.name || data.user?.name || "Valued Patron"),
                          email: String(values.email || data.user?.email || ""),
                          street: String(values.street || ""),
                          city: String(values.city || ""),
                          postal: String(values.postal || ""),
                          country: "India",
                        },
                        status: r.status || "Confirmed",
                        createdAt: r.createdAt || new Date().toISOString(),
                      };
                      setResult(finalOrder);
                      scrollToTarget(0, { duration: 0.8 });
                    }
                  }}
                >
                  <div className="checkout-step">
                    <span>01</span>
                    <h2>Contact & delivery</h2>
                  </div>
                  <div className="form-grid">
                    <label>
                      Full name
                      <input
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                        defaultValue={data.user.name}
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue={data.user.email}
                        autoComplete="email"
                      />
                    </label>
                    <label className="full">
                      Street address
                      <input
                        name="street"
                        required
                        maxLength={200}
                        autoComplete="street-address"
                      />
                    </label>
                    <label>
                      City
                      <input
                        name="city"
                        required
                        maxLength={100}
                        autoComplete="address-level2"
                      />
                    </label>
                    <label>
                      PIN code
                      <input
                        name="postal"
                        required
                        pattern="[0-9]{6}"
                        title="Enter a 6-digit Indian PIN code"
                        inputMode="numeric"
                        autoComplete="postal-code"
                      />
                    </label>
                    <label className="full">
                      Country
                      <input value="India" readOnly />
                    </label>
                  </div>
                  <div className="checkout-step">
                    <span>02</span>
                    <h2>Delivery</h2>
                  </div>
                  <div className="delivery-choice">
                    <Truck />
                    <div>
                      Standard delivery<p>Estimated 3–7 business days</p>
                    </div>
                    <b>{shipping === 0 ? "Complimentary" : money(shipping)}</b>
                  </div>
                  <div className="checkout-step">
                    <span>03</span>
                    <h2>Order review & payment</h2>
                  </div>
                  <div className="demo-note payment-review-note">
                    <ShieldCheck />
                    <div>
                      <b>Pre-approved Order Confirmation</b>
                      <p>
                        Your order is securely authorized with complimentary express dispatch.
                        You will receive live tracking and delivery notifications via email.
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={busy || !!error}
                    className="button full-button"
                    type="submit"
                  >
                    {busy ? "Placing your order…" : "Complete Order"}{" "}
                    <ArrowRight />
                  </button>
                </form>
                <aside className="order-summary">
                  <h2>
                    Your edit <span>({count})</span>
                  </h2>
                  {data.bag.map((i) => {
                    const p = data.products.find((p) => p.id === i.productId)!;
                    return (
                      <div className="summary-item" key={i.productId + i.size}>
                        <img src={"/images/" + p.image + ".jpg"} alt={p.name} />
                        <div>
                          <b>{p.name}</b>
                          <p>
                            {p.color} / {i.size} · Qty {i.quantity}
                          </p>
                          <span>{money(p.price * i.quantity)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="totals">
                    <p>
                      <span>Subtotal</span>
                      <span>{money(subtotal)}</span>
                    </p>
                    <p>
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? "Complimentary" : money(shipping)}
                      </span>
                    </p>
                    <p className="total">
                      <b>Total</b>
                      <b>{money(subtotal + shipping)}</b>
                    </p>
                    <small>Inclusive of applicable taxes · INR</small>
                  </div>
                </aside>
              </div>
            )}
          </section>
        )}
        {view === "contact" && (
          <ContactCare user={data.user} orders={data.orders} />
        )}
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <Link className="wordmark" href="/">
              WESTWARD
            </Link>
            <p>
              Go your own way.
              <br />
              Look like yourself doing it.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/shop">All pieces</Link>
            <Link href="/shop?category=Shirts">Shirts & overshirts</Link>
            <Link href="/shop?category=Denim">Denim</Link>
            <Link href="/shop?category=Footwear">Footwear</Link>
          </div>
          <div>
            <h3>Here to help</h3>
            <button onClick={() => setInfo("Delivery & returns")}>
              Delivery & returns
            </button>
            <button onClick={() => setSizeGuide(true)}>Size guide</button>
            <Link href="/account">My account & orders</Link>
            <Link href="/contact">Contact & care</Link>
          </div>
          <div className="footer-statement">
            <p className="eyebrow">LESS, BUT BETTER.</p>
            <p>A wardrobe for the long way round.</p>
            <Link href="/#story" className="text-link">
              The Westward way <ArrowUpRight />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} WESTWARD</span>
          <span>India / INR ₹</span>
          <button onClick={() => setInfo("Privacy & terms")}>
            Privacy & terms
          </button>
          <span>Sample collection · Demo checkout</span>
        </div>
      </footer>
      <Sheet
        open={!!panel}
        onOpenChange={(o) => {
          if (!o) setPanel("");
        }}
      >
        <SheetContent className="store-sheet">
          <SheetTitle className="panel-title">
            {
              (
                {
                  bag: "Your bag",
                  wishlist: "Saved pieces",
                  search: "Find your next favourite.",
                  menu: "Explore Westward",
                  signin: "Make yourself at home.",
                } as Record<string, string>
              )[panel]
            }
          </SheetTitle>
          <SheetDescription>
            {panel === "bag"
              ? `${count} considered ${count === 1 ? "piece" : "pieces"} for your everyday.`
              : panel === "wishlist"
                ? "The pieces you keep coming back to."
                : "Independent spirit. Considered style."}
          </SheetDescription>
          {panel === "menu" && (
            <nav className="mobile-nav">
              <button
                type="button"
                className="mobile-nav-search-bar"
                onClick={() => setPanel("search")}
              >
                <Search size={16} />
                <span>Search the collection…</span>
              </button>

              <div className="mobile-nav-heading">COLLECTION</div>
              <Link href="/shop" onClick={() => setPanel("")}>
                <span>New arrivals</span>
                <span className="mobile-nav-badge">NEW</span>
              </Link>
              {["Shirts", "Essentials", "Denim", "Outerwear", "Footwear"].map(
                (c) => (
                  <Link
                    href={"/shop?category=" + c}
                    key={c}
                    onClick={() => setPanel("")}
                  >
                    <span>{c}</span>
                    <span className="mobile-nav-count">
                      {data.products.filter((p) => p.category === c).length}{" "}
                      pieces
                      <ArrowRight size={15} />
                    </span>
                  </Link>
                ),
              )}

              <div className="mobile-nav-heading">YOUR ATELIER</div>
              <button
                type="button"
                className="mobile-nav-btn"
                onClick={() => setPanel("wishlist")}
              >
                <span className="nav-btn-left">
                  <Heart size={18} />
                  <span>Saved pieces</span>
                </span>
                {data.wishlist.length > 0 ? (
                  <span className="mobile-nav-pill">
                    {data.wishlist.length}
                  </span>
                ) : (
                  <ArrowRight size={15} />
                )}
              </button>

              <button
                type="button"
                className="mobile-nav-btn"
                onClick={() => setPanel("bag")}
              >
                <span className="nav-btn-left">
                  <ShoppingBag size={18} />
                  <span>Shopping bag</span>
                </span>
                {count > 0 ? (
                  <span className="mobile-nav-pill count">{count}</span>
                ) : (
                  <ArrowRight size={15} />
                )}
              </button>

              <Link href="/account" onClick={() => setPanel("")}>
                <span className="nav-btn-left">
                  <UserRound size={18} />
                  <span>
                    {data.user
                      ? `Account (${data.user.name.split(" ")[0]})`
                      : "Account & orders"}
                  </span>
                </span>
                <ArrowRight size={15} />
              </Link>

              <Link href="/contact" onClick={() => setPanel("")}>
                <span>Contact &amp; garment care</span>
                <ArrowRight size={15} />
              </Link>

              <Link href="/#story" onClick={() => setPanel("")}>
                <span>Our story &amp; craft</span>
                <ArrowRight size={15} />
              </Link>

              <div className="mobile-nav-perk">
                <Truck size={15} />
                <span>Complimentary delivery over ₹7,500</span>
              </div>
            </nav>
          )}
          {panel === "signin" && (
            <div className="sheet-auth-section">
              <AuthCard
                compact
                subtitle="Sign in to save your bag, favourites and order history across visits."
                onSuccess={async () => {
                  setPanel("");
                  await refresh();
                }}
              />
            </div>
          )}
          {panel === "search" && (
            <>
              <div className="search-field">
                <Search />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try linen, denim, boots…"
                  aria-label="Search products"
                />
              </div>
              <p className="subtle">{filtered.length} pieces found</p>
              <div className="panel-products">
                {filtered.map((p) => (
                  <Link
                    className="mini-product"
                    key={p.id}
                    href={"/product/" + p.id}
                    onClick={() => setPanel("")}
                  >
                    <img src={"/images/" + p.image + ".jpg"} alt={p.name} loading="lazy" decoding="async" />
                    <div>
                      <b>{p.name}</b>
                      <p>{p.color}</p>
                      <span>{money(p.price)}</span>
                    </div>
                    <ArrowUpRight />
                  </Link>
                ))}
              </div>
              {!filtered.length && <p>No pieces found. Try another search.</p>}
            </>
          )}
          {panel === "wishlist" && (
            <div className="panel-products">
              {data.products
                .filter((p) => data.wishlist.includes(p.id))
                .map((p) => (
                  <div className="mini-product" key={p.id}>
                    <img src={"/images/" + p.image + ".jpg"} alt={p.name} loading="lazy" decoding="async" />
                    <div>
                      <Link href={"/product/" + p.id} onClick={() => setPanel("")}>
                        <b>{p.name}</b>
                      </Link>
                      <p>{money(p.price)}</p>
                      <button
                        className="text-link"
                        onClick={() => {
                          setPanel("");
                          quick(p);
                        }}
                      >
                        Choose size <Plus />
                      </button>
                    </div>
                    <button
                      className="icon"
                      aria-label={"Unsave " + p.name}
                      disabled={busy}
                      onClick={() =>
                        mutate({
                          action: "wishlist",
                          productId: p.id,
                          saved: false,
                        })
                      }
                    >
                      <X />
                    </button>
                  </div>
                ))}
              {!data.wishlist.length && (
                <div className="empty">
                  <Heart />
                  <h2>Keep a good thing close.</h2>
                  <p>Tap a heart to save your favourite pieces.</p>
                  <Link href="/shop" className="button" onClick={() => setPanel("")}>
                    Explore the collection
                  </Link>
                </div>
              )}
            </div>
          )}
          {panel === "bag" && (
            <>
              {!count ? (
                <div className="empty">
                  <ShoppingBag />
                  <h2>A little room for something good.</h2>
                  <p>Your bag is currently empty.</p>
                  <Link href="/shop" className="button" onClick={() => setPanel("")}>
                    Explore the collection
                  </Link>
                </div>
              ) : (
                <>
                  <div className="shipping-note">
                    <Truck />
                    {subtotal >= 7500
                      ? "Your delivery is on us."
                      : `${money(7500 - subtotal)} away from complimentary delivery.`}
                  </div>
                  <div className="bag-items">
                    {data.bag.map((i) => {
                      const p = data.products.find(
                        (p) => p.id === i.productId,
                      )!;
                      return (
                        <div className="bag-item" key={p.id + i.size}>
                          <Link href={"/product/" + p.id} onClick={() => setPanel("")}>
                            <img
                              src={"/images/" + p.image + ".jpg"}
                              alt={p.name}
                              loading="lazy"
                              decoding="async"
                            />
                          </Link>
                          <div>
                            <Link href={"/product/" + p.id} onClick={() => setPanel("")}>
                              <b>{p.name}</b>
                            </Link>
                            <p>
                              {p.color} / {i.size}
                            </p>
                            <span>{money(p.price * i.quantity)}</span>
                            <div className="quantity">
                              <button
                                disabled={busy}
                                aria-label={"Decrease " + p.name + " quantity"}
                                onClick={() =>
                                  mutate({
                                    action: "bag",
                                    productId: p.id,
                                    size: i.size,
                                    quantity: i.quantity - 1,
                                  })
                                }
                              >
                                <Minus />
                              </button>
                              <span>{i.quantity}</span>
                              <button
                                disabled={busy || i.quantity >= 10}
                                aria-label={"Increase " + p.name + " quantity"}
                                onClick={() =>
                                  mutate({
                                    action: "bag",
                                    productId: p.id,
                                    size: i.size,
                                    quantity: i.quantity + 1,
                                  })
                                }
                              >
                                <Plus />
                              </button>
                            </div>
                          </div>
                          <button
                            className="icon"
                            disabled={busy}
                            aria-label={"Remove " + p.name}
                            onClick={() =>
                              mutate({
                                action: "bag",
                                productId: p.id,
                                size: i.size,
                                quantity: 0,
                              })
                            }
                          >
                            <X />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bag-total">
                    <div>
                      <b>Subtotal</b>
                      <b>{money(subtotal)}</b>
                    </div>
                    <p>Taxes included. Shipping calculated at checkout.</p>
                    <Link href="/checkout" className="button full-button" onClick={() => setPanel("")}>
                      Continue to checkout <ArrowRight />
                    </Link>
                    <button className="text-link" onClick={() => setPanel("")}>
                      Continue exploring
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="quick-dialog">
          <DialogTitle className="sr-only">{selected?.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a size and add this piece to your bag.
          </DialogDescription>
          {selected && (
            <>
              <img
                className="quick-image"
                src={"/images/" + selected.image + ".jpg"}
                alt={selected.name}
              />
              {details(selected)}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={sizeGuide} onOpenChange={setSizeGuide}>
        <DialogContent className="info-dialog">
          <DialogTitle>Find your fit.</DialogTitle>
          <DialogDescription>
            Sample garment guide. Measurements are body measurements in
            centimetres.
          </DialogDescription>
          <Table className="size-table">
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Chest</TableHead>
                <TableHead>Waist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["S", "91–96", "76–81"],
                ["M", "97–102", "82–87"],
                ["L", "103–108", "88–93"],
                ["XL", "109–114", "94–99"],
                ["XXL", "115–120", "100–105"],
              ].map((row) => (
                <TableRow key={row[0]}>
                  {row.map((x) => (
                    <TableCell key={x}>{x}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p>
            Between sizes? Choose the larger size for a relaxed fit. Footwear
            uses UK sizes. Numeric denim sizes refer to waist measurements in
            inches.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!info}
        onOpenChange={(o) => {
          if (!o) setInfo("");
        }}
      >
        <DialogContent className="info-dialog">
          <DialogTitle>{info}</DialogTitle>
          <DialogDescription>WESTWARD customer information</DialogDescription>
          {info === "Delivery & returns" ? (
            <>
              <p>
                Complimentary standard shipping on orders over ₹7,500; ₹199
                below. Estimated delivery: 3–7 business days within India.
              </p>
              <p>
                Sample policy: unworn pieces with original tags can be returned
                within 14 days. This demonstration store does not ship products
                or process returns.
              </p>
            </>
          ) : info === "Contact & care" ? (
            <>
              <p>
                For personalized fabric care advice, bespoke sizing assistance,
                or dedicated order support, our atelier concierge is at your
                service.
              </p>
              <p>
                Explore our complete garment care guides for selvedge denim,
                washed linen, waxed outerwear, and leather, or submit an inquiry
                directly to our concierge team.
              </p>
              <Link
                href="/contact"
                className="button"
                onClick={() => setInfo("")}
                style={{
                  marginTop: "16px",
                  display: "inline-flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                Open Concierge & Garment Care Hub <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <p>
                This private preview stores your saved pieces, bag and demo
                order details in its database, associated with your signed-in
                account. Other customers cannot view your account records.
              </p>
              <p>
                No card details are requested or stored. Product photos
                illustrate a sample collection. Prices, materials and policies
                are demonstration content pending brand approval.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
