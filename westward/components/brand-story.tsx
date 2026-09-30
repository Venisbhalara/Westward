"use client";

import { ArrowUpRight, Compass, Scissors, Feather, Anchor } from "lucide-react";
import Link from "next/link";
import "./brand-story.css";

export default function BrandStory() {
  return (
    <section className="brand-story-luxury" id="story">
      {/* Decorative Atelier Frame */}
      <div className="story-frame-outer">
        <div className="story-frame-inner">
          {/* Top Heritage Badge */}
          <div className="story-badge-header">
            <span className="story-rule-line" />
            <div className="story-crest-badge">
              <Compass size={14} className="crest-icon" />
              <span>THE WESTWARD WAY &bull; EST. 2024</span>
            </div>
            <span className="story-rule-line" />
          </div>

          {/* Main Editorial Hero */}
          <div className="story-hero-content">
            <p className="story-eyebrow">OUR PHILOSOPHY &amp; PROVENANCE</p>
            <h2 className="story-main-title">
              Independent in <i>spirit.</i>
              <br />
              Intentional in <i>everything.</i>
            </h2>
            <div className="story-ornament">
              <span className="diamond-bullet">✦ &bull; ✦</span>
            </div>
            <p className="story-lead-quote">
              &ldquo;We believe a good wardrobe should feel like you. Rooted in
              the honest textures of western living and shaped for a life in
              perpetual motion, WESTWARD brings together thoughtful tailoring,
              enduring fabrics, and a quiet confidence that never goes out of
              style.&rdquo;
            </p>
          </div>

          {/* Visual Editorial Duo (Framed Plates) */}
          <div className="story-editorial-duo">
            <div className="story-plate-card">
              <div className="plate-img-wrapper">
                <img
                  src="/images/6838910.jpg"
                  alt="Artisanal heavy-gauge woven check fabric and stitching"
                  className="plate-img-first"
                  loading="lazy"
                />
                <span className="plate-tag">
                  PLATE 01 &bull; TACTILE PROVENANCE
                </span>
              </div>
              <div className="plate-caption">
                <h4>Honest Hand-Selected Yarns</h4>
                <p>
                  Natural ring-spun cotton and raw Belgian flax linen, woven
                  with high-density tension for structural drape and lifelong
                  resilience.
                </p>
              </div>
            </div>

            <div className="story-plate-card">
              <div className="plate-img-wrapper">
                <img
                  src="/images/26769894.jpg"
                  alt="Japanese selvedge indigo denim shirt detailing"
                  className="plate-img-second"
                  loading="lazy"
                />
                <span className="plate-tag">
                  PLATE 02 &bull; ARTISANAL CRAFT
                </span>
              </div>
              <div className="plate-caption">
                <h4>The Architecture of Wear</h4>
                <p>
                  Triple-needle chain-stitching, custom brass hardware, and
                  reinforced pressure points engineered to age with distinctive
                  character.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Pillars / Hallmarks */}
          <div className="story-pillars-grid">
            <div className="story-pillar-item">
              <div className="pillar-num">01</div>
              <div className="pillar-head">
                <Scissors size={18} className="pillar-icon" />
                <h3>Artisanal Permanence</h3>
              </div>
              <p>
                We reject fast-fashion trends in favour of timeless silhouettes.
                Every piece is cut with purposeful proportions meant to be worn
                for decades.
              </p>
            </div>

            <div className="story-pillar-item">
              <div className="pillar-num">02</div>
              <div className="pillar-head">
                <Feather size={18} className="pillar-icon" />
                <h3>Living Patina</h3>
              </div>
              <p>
                Our garments are designed to absorb your journey—fading
                naturally under the sun, softening through washes, and molding
                exclusively to your posture.
              </p>
            </div>

            <div className="story-pillar-item">
              <div className="pillar-num">03</div>
              <div className="pillar-head">
                <Anchor size={18} className="pillar-icon" />
                <h3>Independent Spirit</h3>
              </div>
              <p>
                Tailored for the modern wanderer. Whether on an open highway or
                amidst city streets, wear pieces that feel uniquely,
                unmistakably your own.
              </p>
            </div>
          </div>

          {/* Manifesto Footer / Sign-off */}
          <div className="story-manifesto-footer">
            <div className="story-quote-box">
              <p className="manifesto-signoff">
                &ldquo;Buy less. Demand better. Walk the long way round.&rdquo;
              </p>
              <span className="atelier-stamp">
                WESTWARD ATELIER &bull; FORT, MUMBAI &bull; CRAFT ARCHIVE
              </span>
            </div>

            <div className="story-cta-actions">
              <Link href="/shop" className="button story-btn-primary">
                Wear your own story <ArrowUpRight size={16} />
              </Link>
              <Link href="/contact" className="story-link-secondary">
                Our Atelier &amp; Garment Care Hub <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Watermark Crest */}
          <div className="story-crest-watermark" aria-hidden="true">
            <span className="watermark-letter">W</span>
            <span className="watermark-sub">WESTWARD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
