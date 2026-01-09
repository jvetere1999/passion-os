"use client";

/**
 * Glossary Client Component
 * Searchable synthesis terminology
 */

import { useState, useMemo } from "react";
import styles from "./page.module.css";

interface Concept {
  id: string;
  term: string;
  definition: string;
  category: string;
  aliases: string[];
  relatedConcepts: string[];
}

// Mock concepts data
const MOCK_CONCEPTS: Concept[] = [
  {
    id: "wavetable",
    term: "Wavetable",
    definition: "A collection of single-cycle waveforms stored in a table that can be played back and morphed between. The wavetable position determines which waveform in the table is currently playing, allowing for dynamic timbral changes.",
    category: "Oscillators",
    aliases: ["wave table", "WT"],
    relatedConcepts: ["wavetable-position", "morphing", "single-cycle"],
  },
  {
    id: "wavetable-position",
    term: "Wavetable Position",
    definition: "A parameter that selects which frame or waveform within a wavetable is being played. Modulating this position creates the characteristic morphing sound of wavetable synthesis.",
    category: "Oscillators",
    aliases: ["WT pos", "frame position"],
    relatedConcepts: ["wavetable", "morphing"],
  },
  {
    id: "unison",
    term: "Unison",
    definition: "A technique where multiple copies of an oscillator are stacked together with slight detuning and stereo spread. This creates a thicker, wider sound. Common parameters include voice count, detune amount, blend, and stereo width.",
    category: "Oscillators",
    aliases: ["unison mode", "super mode"],
    relatedConcepts: ["detune", "stereo-width"],
  },
  {
    id: "detune",
    term: "Detune",
    definition: "The amount by which oscillator voices are pitch-shifted relative to each other in unison mode. Measured in cents (1/100th of a semitone). Higher detune creates a more dramatic chorus-like effect.",
    category: "Oscillators",
    aliases: ["detuning"],
    relatedConcepts: ["unison", "cents"],
  },
  {
    id: "filter",
    term: "Filter",
    definition: "A processor that attenuates certain frequencies while allowing others to pass. Common types include low-pass (removes highs), high-pass (removes lows), band-pass (passes a frequency band), and notch (removes a frequency band).",
    category: "Filters",
    aliases: ["VCF"],
    relatedConcepts: ["cutoff", "resonance", "filter-type"],
  },
  {
    id: "cutoff",
    term: "Cutoff Frequency",
    definition: "The frequency at which a filter begins to attenuate the signal. For a low-pass filter, frequencies above the cutoff are reduced; for high-pass, frequencies below are reduced.",
    category: "Filters",
    aliases: ["cutoff", "fc"],
    relatedConcepts: ["filter", "resonance"],
  },
  {
    id: "resonance",
    term: "Resonance",
    definition: "A boost of frequencies around the filter cutoff point. Higher resonance values create a more pronounced peak at the cutoff frequency. At extreme settings, the filter can self-oscillate, producing a sine wave.",
    category: "Filters",
    aliases: ["Q", "emphasis"],
    relatedConcepts: ["filter", "cutoff", "self-oscillation"],
  },
  {
    id: "envelope",
    term: "Envelope",
    definition: "A time-based modulation source that shapes how a parameter changes over time. The most common type is ADSR: Attack (time to reach peak), Decay (time to reach sustain level), Sustain (level while note is held), Release (time to fade after note release).",
    category: "Modulation",
    aliases: ["env", "ADSR"],
    relatedConcepts: ["attack", "decay", "sustain", "release"],
  },
  {
    id: "lfo",
    term: "LFO",
    definition: "Low Frequency Oscillator. An oscillator typically running below audible frequencies (0.1-20 Hz) used as a modulation source. Common shapes include sine, triangle, square, and saw. Can be free-running or tempo-synced.",
    category: "Modulation",
    aliases: ["low frequency oscillator"],
    relatedConcepts: ["modulation", "tempo-sync"],
  },
  {
    id: "modulation",
    term: "Modulation",
    definition: "The process of using one signal (the modulator) to control a parameter of another signal or processor (the carrier/destination). Common modulators include LFOs, envelopes, and MIDI controllers like velocity and mod wheel.",
    category: "Modulation",
    aliases: ["mod"],
    relatedConcepts: ["lfo", "envelope", "modulation-matrix"],
  },
  {
    id: "fm-synthesis",
    term: "FM Synthesis",
    definition: "Frequency Modulation synthesis. A technique where one oscillator (modulator) modulates the frequency of another (carrier) at audio rates, creating complex harmonic and inharmonic spectra. Used for bells, electric pianos, and metallic sounds.",
    category: "Synthesis Types",
    aliases: ["FM", "frequency modulation"],
    relatedConcepts: ["carrier", "modulator", "ratio"],
  },
  {
    id: "warp",
    term: "Warp Mode",
    definition: "In Serum and similar synths, warp modes modify the wavetable playback in various ways. Common modes include Sync (hard sync effect), Bend (phase distortion), PWM (pulse width modulation), and FM (frequency modulation from another source).",
    category: "Oscillators",
    aliases: ["warp", "WT warp"],
    relatedConcepts: ["wavetable", "sync", "pwm"],
  },
  {
    id: "macro",
    term: "Macro",
    definition: "A user-assignable controller that can be mapped to multiple parameters simultaneously. Macros allow complex parameter changes with a single control, useful for performance and sound design automation.",
    category: "Controls",
    aliases: ["macro control"],
    relatedConcepts: ["modulation", "mapping"],
  },
];

const CATEGORIES = ["All", "Oscillators", "Filters", "Modulation", "Synthesis Types", "Controls"];

export function GlossaryClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const filteredConcepts = useMemo(() => {
    return MOCK_CONCEPTS.filter((concept) => {
      const matchesCategory = selectedCategory === "All" || concept.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        concept.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const groupedConcepts = useMemo(() => {
    const groups: Record<string, Concept[]> = {};
    for (const concept of filteredConcepts) {
      if (!groups[concept.category]) {
        groups[concept.category] = [];
      }
      groups[concept.category].push(concept);
    }
    return groups;
  }, [filteredConcepts]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Glossary</h1>
        <p className={styles.subtitle}>
          Synthesis terminology and concept definitions
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categories}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.list}>
          {Object.keys(groupedConcepts).length === 0 ? (
            <div className={styles.emptyState}>
              <p>No terms match your search</p>
            </div>
          ) : (
            Object.entries(groupedConcepts).map(([category, concepts]) => (
              <div key={category} className={styles.group}>
                <h2 className={styles.groupTitle}>{category}</h2>
                <div className={styles.termList}>
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      className={`${styles.termCard} ${selectedConcept?.id === concept.id ? styles.active : ""}`}
                      onClick={() => setSelectedConcept(concept)}
                    >
                      <h3>{concept.term}</h3>
                      <p>{concept.definition.slice(0, 80)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <aside className={styles.detail}>
          {selectedConcept ? (
            <>
              <span className={styles.detailCategory}>{selectedConcept.category}</span>
              <h2 className={styles.detailTitle}>{selectedConcept.term}</h2>
              {selectedConcept.aliases.length > 0 && (
                <div className={styles.aliases}>
                  Also known as: {selectedConcept.aliases.join(", ")}
                </div>
              )}
              <p className={styles.detailDefinition}>{selectedConcept.definition}</p>
              {selectedConcept.relatedConcepts.length > 0 && (
                <div className={styles.related}>
                  <h4>Related Concepts</h4>
                  <div className={styles.relatedList}>
                    {selectedConcept.relatedConcepts.map((id) => {
                      const related = MOCK_CONCEPTS.find((c) => c.id === id);
                      if (!related) return null;
                      return (
                        <button
                          key={id}
                          className={styles.relatedBtn}
                          onClick={() => setSelectedConcept(related)}
                        >
                          {related.term}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.placeholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <p>Select a term to view its definition</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default GlossaryClient;

