"use client";

/**
 * Recipe Generator Client Component
 * Generate synthesis recipes based on parameters
 */

import { useState, useCallback } from "react";
import styles from "./page.module.css";

type Synth = "serum" | "vital";
type TargetType = "bass" | "lead" | "pad" | "pluck" | "fx" | "arp";
type Descriptor = "bright" | "dark" | "wide" | "narrow" | "clean" | "gritty" | "slow" | "fast";

interface RecipeSettings {
  synth: Synth;
  targetType: TargetType;
  descriptors: Descriptor[];
  mono: boolean;
  cpuBudget: "low" | "medium" | "high";
  macroCount: number;
}

interface GeneratedRecipe {
  title: string;
  synth: Synth;
  targetType: TargetType;
  oscillators: {
    oscA: {
      wavetable: string;
      position: string;
      warp: { type: string; amount: string };
      unison: { voices: number; detune: string; blend: string; width: string };
    };
    oscB?: {
      wavetable: string;
      position: string;
      warp: { type: string; amount: string };
    };
    sub?: { enabled: boolean; octave: number };
    noise?: { enabled: boolean; level: string };
  };
  filter: {
    type: string;
    cutoff: string;
    resonance: string;
    keytrack: string;
    envAmount: string;
  };
  envelopes: {
    amp: { attack: string; decay: string; sustain: string; release: string };
    filter: { attack: string; decay: string; sustain: string; release: string };
  };
  lfos: {
    lfo1: { shape: string; rate: string; destination: string; amount: string };
    lfo2?: { shape: string; rate: string; destination: string; amount: string };
  };
  macros: { name: string; mappings: string[] }[];
  explanation: string;
  troubleshooting: string[];
  variations: { name: string; change: string }[];
}

const TARGET_DESCRIPTIONS: Record<TargetType, string> = {
  bass: "Low-frequency foundation sounds",
  lead: "Melodic, prominent sounds",
  pad: "Ambient, sustained textures",
  pluck: "Short, percussive tones",
  fx: "Sound effects and risers",
  arp: "Rhythmic, sequenced sounds",
};

const DESCRIPTORS: Descriptor[] = ["bright", "dark", "wide", "narrow", "clean", "gritty", "slow", "fast"];

interface RecipeClientProps {
  userId: string;
}

export function RecipeClient({ userId }: RecipeClientProps) {
  const [settings, setSettings] = useState<RecipeSettings>({
    synth: "serum",
    targetType: "bass",
    descriptors: [],
    mono: false,
    cpuBudget: "medium",
    macroCount: 4,
  });
  const [generating, setGenerating] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<GeneratedRecipe[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const toggleDescriptor = (desc: Descriptor) => {
    setSettings((prev) => ({
      ...prev,
      descriptors: prev.descriptors.includes(desc)
        ? prev.descriptors.filter((d) => d !== desc)
        : [...prev.descriptors, desc].slice(0, 4),
    }));
  };

  const generateRecipe = useCallback(() => {
    setGenerating(true);

    // Simulate generation (would call API in production)
    setTimeout(() => {
      const generated: GeneratedRecipe = generateMockRecipe(settings);
      setRecipe(generated);
      setGenerating(false);
    }, 1500);
  }, [settings]);

  const saveRecipe = useCallback(() => {
    if (recipe) {
      setSavedRecipes((prev) => [recipe, ...prev]);
    }
  }, [recipe]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Recipe Generator</h1>
          <p className={styles.subtitle}>
            Generate synthesis blueprints for any sound type
          </p>
        </div>
        <button
          className={styles.savedBtn}
          onClick={() => setShowSaved(!showSaved)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Saved ({savedRecipes.length})
        </button>
      </header>

      {showSaved ? (
        <div className={styles.savedSection}>
          <div className={styles.savedHeader}>
            <h2>Saved Recipes</h2>
            <button onClick={() => setShowSaved(false)}>Back to Generator</button>
          </div>
          {savedRecipes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No saved recipes yet</p>
              <span>Generate and save recipes to see them here</span>
            </div>
          ) : (
            <div className={styles.savedGrid}>
              {savedRecipes.map((r, i) => (
                <button
                  key={i}
                  className={styles.savedCard}
                  onClick={() => {
                    setRecipe(r);
                    setShowSaved(false);
                  }}
                >
                  <span className={styles.savedSynth}>{r.synth}</span>
                  <h3>{r.title}</h3>
                  <span className={styles.savedType}>{r.targetType}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.content}>
          {/* Settings Panel */}
          <aside className={styles.settings}>
            <h2 className={styles.settingsTitle}>Settings</h2>

            {/* Synth Selection */}
            <div className={styles.setting}>
              <label>Synth</label>
              <div className={styles.synthButtons}>
                <button
                  className={`${styles.synthBtn} ${settings.synth === "serum" ? styles.active : ""}`}
                  onClick={() => setSettings((p) => ({ ...p, synth: "serum" }))}
                >
                  Serum
                </button>
                <button
                  className={`${styles.synthBtn} ${settings.synth === "vital" ? styles.active : ""}`}
                  onClick={() => setSettings((p) => ({ ...p, synth: "vital" }))}
                >
                  Vital
                </button>
              </div>
            </div>

            {/* Target Type */}
            <div className={styles.setting}>
              <label>Sound Type</label>
              <div className={styles.targetGrid}>
                {(Object.keys(TARGET_DESCRIPTIONS) as TargetType[]).map((type) => (
                  <button
                    key={type}
                    className={`${styles.targetBtn} ${settings.targetType === type ? styles.active : ""}`}
                    onClick={() => setSettings((p) => ({ ...p, targetType: type }))}
                  >
                    <span className={styles.targetName}>{type}</span>
                    <span className={styles.targetDesc}>{TARGET_DESCRIPTIONS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descriptors */}
            <div className={styles.setting}>
              <label>Character (select up to 4)</label>
              <div className={styles.descriptorGrid}>
                {DESCRIPTORS.map((desc) => (
                  <button
                    key={desc}
                    className={`${styles.descriptorBtn} ${settings.descriptors.includes(desc) ? styles.active : ""}`}
                    onClick={() => toggleDescriptor(desc)}
                  >
                    {desc}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className={styles.setting}>
              <label>Options</label>
              <div className={styles.options}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={settings.mono}
                    onChange={(e) => setSettings((p) => ({ ...p, mono: e.target.checked }))}
                  />
                  <span>Mono (single voice)</span>
                </label>
              </div>
            </div>

            {/* CPU Budget */}
            <div className={styles.setting}>
              <label>CPU Budget</label>
              <div className={styles.cpuButtons}>
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    className={`${styles.cpuBtn} ${settings.cpuBudget === level ? styles.active : ""}`}
                    onClick={() => setSettings((p) => ({ ...p, cpuBudget: level }))}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Macro Count */}
            <div className={styles.setting}>
              <label>Macro Count: {settings.macroCount}</label>
              <input
                type="range"
                min="0"
                max="8"
                value={settings.macroCount}
                onChange={(e) => setSettings((p) => ({ ...p, macroCount: parseInt(e.target.value) }))}
                className={styles.slider}
              />
            </div>

            {/* Generate Button */}
            <button
              className={styles.generateBtn}
              onClick={generateRecipe}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className={styles.spinner} />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate Recipe
                </>
              )}
            </button>
          </aside>

          {/* Recipe Display */}
          <main className={styles.recipePanel}>
            {!recipe ? (
              <div className={styles.placeholder}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M9 3h6v5l4 9H5l4-9V3z" />
                  <line x1="9" y1="3" x2="15" y2="3" />
                </svg>
                <h3>No Recipe Generated</h3>
                <p>Configure your settings and click Generate to create a synthesis recipe</p>
              </div>
            ) : (
              <div className={styles.recipe}>
                <div className={styles.recipeHeader}>
                  <div>
                    <span className={styles.recipeSynth}>{recipe.synth}</span>
                    <h2>{recipe.title}</h2>
                    <span className={styles.recipeType}>{recipe.targetType}</span>
                  </div>
                  <button className={styles.saveBtn} onClick={saveRecipe}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Save
                  </button>
                </div>

                {/* Oscillators */}
                <section className={styles.recipeSection}>
                  <h3>Oscillators</h3>
                  <div className={styles.oscGrid}>
                    <div className={styles.oscCard}>
                      <h4>OSC A</h4>
                      <dl>
                        <dt>Wavetable</dt>
                        <dd>{recipe.oscillators.oscA.wavetable}</dd>
                        <dt>Position</dt>
                        <dd>{recipe.oscillators.oscA.position}</dd>
                        <dt>Warp</dt>
                        <dd>{recipe.oscillators.oscA.warp.type} @ {recipe.oscillators.oscA.warp.amount}</dd>
                        <dt>Unison</dt>
                        <dd>
                          {recipe.oscillators.oscA.unison.voices} voices, {recipe.oscillators.oscA.unison.detune} detune
                        </dd>
                      </dl>
                    </div>
                    {recipe.oscillators.oscB && (
                      <div className={styles.oscCard}>
                        <h4>OSC B</h4>
                        <dl>
                          <dt>Wavetable</dt>
                          <dd>{recipe.oscillators.oscB.wavetable}</dd>
                          <dt>Position</dt>
                          <dd>{recipe.oscillators.oscB.position}</dd>
                        </dl>
                      </div>
                    )}
                  </div>
                </section>

                {/* Filter */}
                <section className={styles.recipeSection}>
                  <h3>Filter</h3>
                  <div className={styles.paramGrid}>
                    <div className={styles.param}>
                      <span className={styles.paramLabel}>Type</span>
                      <span className={styles.paramValue}>{recipe.filter.type}</span>
                    </div>
                    <div className={styles.param}>
                      <span className={styles.paramLabel}>Cutoff</span>
                      <span className={styles.paramValue}>{recipe.filter.cutoff}</span>
                    </div>
                    <div className={styles.param}>
                      <span className={styles.paramLabel}>Resonance</span>
                      <span className={styles.paramValue}>{recipe.filter.resonance}</span>
                    </div>
                    <div className={styles.param}>
                      <span className={styles.paramLabel}>Env Amount</span>
                      <span className={styles.paramValue}>{recipe.filter.envAmount}</span>
                    </div>
                  </div>
                </section>

                {/* Envelopes */}
                <section className={styles.recipeSection}>
                  <h3>Envelopes</h3>
                  <div className={styles.envGrid}>
                    <div className={styles.envCard}>
                      <h4>Amp Env</h4>
                      <div className={styles.adsrRow}>
                        <div><span>A</span>{recipe.envelopes.amp.attack}</div>
                        <div><span>D</span>{recipe.envelopes.amp.decay}</div>
                        <div><span>S</span>{recipe.envelopes.amp.sustain}</div>
                        <div><span>R</span>{recipe.envelopes.amp.release}</div>
                      </div>
                    </div>
                    <div className={styles.envCard}>
                      <h4>Filter Env</h4>
                      <div className={styles.adsrRow}>
                        <div><span>A</span>{recipe.envelopes.filter.attack}</div>
                        <div><span>D</span>{recipe.envelopes.filter.decay}</div>
                        <div><span>S</span>{recipe.envelopes.filter.sustain}</div>
                        <div><span>R</span>{recipe.envelopes.filter.release}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Macros */}
                {recipe.macros.length > 0 && (
                  <section className={styles.recipeSection}>
                    <h3>Macros</h3>
                    <div className={styles.macroGrid}>
                      {recipe.macros.map((macro, i) => (
                        <div key={i} className={styles.macroCard}>
                          <h4>Macro {i + 1}: {macro.name}</h4>
                          <ul>
                            {macro.mappings.map((m, j) => (
                              <li key={j}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Explanation */}
                <section className={styles.recipeSection}>
                  <h3>Why This Works</h3>
                  <p className={styles.explanation}>{recipe.explanation}</p>
                </section>

                {/* Troubleshooting */}
                <section className={styles.recipeSection}>
                  <h3>Troubleshooting</h3>
                  <ul className={styles.troubleList}>
                    {recipe.troubleshooting.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>

                {/* Variations */}
                <section className={styles.recipeSection}>
                  <h3>Variations</h3>
                  <div className={styles.variationGrid}>
                    {recipe.variations.map((v, i) => (
                      <div key={i} className={styles.variationCard}>
                        <h4>{v.name}</h4>
                        <p>{v.change}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

// Mock recipe generator
function generateMockRecipe(settings: RecipeSettings): GeneratedRecipe {
  const { synth, targetType, descriptors } = settings;

  const isBright = descriptors.includes("bright");
  const isDark = descriptors.includes("dark");
  const isGritty = descriptors.includes("gritty");

  const recipes: Record<TargetType, () => GeneratedRecipe> = {
    bass: () => ({
      title: `${isGritty ? "Gritty" : isDark ? "Dark" : "Punchy"} Sub Bass`,
      synth,
      targetType,
      oscillators: {
        oscA: {
          wavetable: "Basic Shapes",
          position: "0% (Sine)",
          warp: { type: "Sync", amount: "0%" },
          unison: { voices: 1, detune: "0", blend: "100%", width: "0%" },
        },
        sub: { enabled: true, octave: -1 },
      },
      filter: {
        type: "Low Pass 24dB",
        cutoff: isDark ? "200Hz" : "400Hz",
        resonance: "0%",
        keytrack: "100%",
        envAmount: "20%",
      },
      envelopes: {
        amp: { attack: "0ms", decay: "100ms", sustain: "80%", release: "150ms" },
        filter: { attack: "0ms", decay: "200ms", sustain: "0%", release: "100ms" },
      },
      lfos: {
        lfo1: { shape: "Sine", rate: "1/4", destination: "Filter Cutoff", amount: "10%" },
      },
      macros: [
        { name: "Sub Level", mappings: ["Sub Osc Volume"] },
        { name: "Growl", mappings: ["Filter Resonance", "OSC A Warp Amount"] },
      ],
      explanation: "This bass uses a clean sine wave for the fundamental with optional sub octave. The low-pass filter keeps the sound focused on the low end while the filter envelope adds punch on attack.",
      troubleshooting: [
        "Too muddy? Raise the filter cutoff or reduce decay",
        "Too quiet in the mix? Add subtle saturation",
        "Phasing issues? Ensure mono compatibility",
      ],
      variations: [
        { name: "Reese Bass", change: "Add 7 unison voices with slight detune" },
        { name: "808 Style", change: "Extend decay, add pitch envelope down" },
      ],
    }),
    lead: () => ({
      title: `${isBright ? "Bright" : "Warm"} Synth Lead`,
      synth,
      targetType,
      oscillators: {
        oscA: {
          wavetable: "Analog",
          position: isBright ? "75%" : "25%",
          warp: { type: "Bend +", amount: "20%" },
          unison: { voices: 4, detune: "15ct", blend: "50%", width: "50%" },
        },
        oscB: {
          wavetable: "Digital",
          position: "50%",
          warp: { type: "None", amount: "0%" },
        },
      },
      filter: {
        type: "Low Pass 12dB",
        cutoff: isBright ? "8kHz" : "4kHz",
        resonance: "25%",
        keytrack: "50%",
        envAmount: "40%",
      },
      envelopes: {
        amp: { attack: "5ms", decay: "300ms", sustain: "70%", release: "200ms" },
        filter: { attack: "10ms", decay: "400ms", sustain: "30%", release: "300ms" },
      },
      lfos: {
        lfo1: { shape: "Triangle", rate: "1/8", destination: "Pitch", amount: "5ct" },
        lfo2: { shape: "Sine", rate: "2Hz", destination: "Filter Cutoff", amount: "15%" },
      },
      macros: [
        { name: "Brightness", mappings: ["Filter Cutoff", "OSC A Position"] },
        { name: "Movement", mappings: ["LFO 1 Amount", "LFO 2 Rate"] },
        { name: "Width", mappings: ["Unison Width", "Chorus Mix"] },
      ],
      explanation: "This lead combines analog warmth with digital brightness. The unison adds width and presence, while the filter envelope creates that classic synth lead character.",
      troubleshooting: [
        "Too harsh? Reduce filter cutoff or resonance",
        "Lost in the mix? Add subtle stereo widening",
        "Too static? Increase LFO modulation amounts",
      ],
      variations: [
        { name: "Supersaw", change: "Increase unison to 7 voices, detune to 25ct" },
        { name: "Mono Lead", change: "Set to mono, add portamento" },
      ],
    }),
    pad: () => ({
      title: `${isDark ? "Dark Ambient" : "Lush"} Pad`,
      synth,
      targetType,
      oscillators: {
        oscA: {
          wavetable: "Analog",
          position: "30%",
          warp: { type: "None", amount: "0%" },
          unison: { voices: 4, detune: "20ct", blend: "100%", width: "100%" },
        },
        oscB: {
          wavetable: "Spectral",
          position: "50%",
          warp: { type: "None", amount: "0%" },
        },
        noise: { enabled: true, level: "5%" },
      },
      filter: {
        type: "Low Pass 12dB",
        cutoff: isDark ? "2kHz" : "6kHz",
        resonance: "10%",
        keytrack: "30%",
        envAmount: "20%",
      },
      envelopes: {
        amp: { attack: "500ms", decay: "1s", sustain: "90%", release: "2s" },
        filter: { attack: "800ms", decay: "2s", sustain: "50%", release: "1.5s" },
      },
      lfos: {
        lfo1: { shape: "Sine", rate: "0.2Hz", destination: "OSC A Position", amount: "30%" },
        lfo2: { shape: "Triangle", rate: "0.1Hz", destination: "Filter Cutoff", amount: "20%" },
      },
      macros: [
        { name: "Evolution", mappings: ["LFO 1 Amount", "OSC B Position"] },
        { name: "Brightness", mappings: ["Filter Cutoff", "Noise Level"] },
        { name: "Space", mappings: ["Reverb Mix", "Delay Feedback"] },
      ],
      explanation: "This pad creates lush, evolving textures through slow LFO modulation of wavetable position. The long attack and release create smooth transitions.",
      troubleshooting: [
        "Too muddy? High-pass the low end around 100Hz",
        "Too static? Increase LFO rates slightly",
        "Clashing with other elements? Reduce unison width",
      ],
      variations: [
        { name: "Ambient", change: "Add reverb, reduce attack to 2s" },
        { name: "Strings", change: "Use PWM instead of wavetable morph" },
      ],
    }),
    pluck: () => ({
      title: `${isBright ? "Bright" : "Mellow"} Pluck`,
      synth,
      targetType,
      oscillators: {
        oscA: {
          wavetable: "Digital",
          position: isBright ? "60%" : "20%",
          warp: { type: "None", amount: "0%" },
          unison: { voices: 2, detune: "8ct", blend: "50%", width: "30%" },
        },
      },
      filter: {
        type: "Low Pass 24dB",
        cutoff: isBright ? "6kHz" : "3kHz",
        resonance: "15%",
        keytrack: "70%",
        envAmount: "60%",
      },
      envelopes: {
        amp: { attack: "0ms", decay: "200ms", sustain: "0%", release: "100ms" },
        filter: { attack: "0ms", decay: "150ms", sustain: "0%", release: "100ms" },
      },
      lfos: {
        lfo1: { shape: "Triangle", rate: "1/16", destination: "Pan", amount: "20%" },
      },
      macros: [
        { name: "Decay", mappings: ["Amp Decay", "Filter Decay"] },
        { name: "Brightness", mappings: ["Filter Cutoff", "OSC Position"] },
      ],
      explanation: "The pluck character comes from fast filter and amp envelope decays. The filter envelope closes quickly after the attack, creating that characteristic plucked sound.",
      troubleshooting: [
        "Too clicky? Add 1-2ms attack",
        "Too short? Increase decay time",
        "Too dull? Increase filter envelope amount",
      ],
      variations: [
        { name: "Guitar-like", change: "Add body resonance, slight pitch envelope" },
        { name: "Kalimba", change: "Use bell-like wavetable, add slight reverb" },
      ],
    }),
    fx: () => ({
      title: "Riser FX",
      synth,
      targetType,
      oscillators: {
        oscA: {
          wavetable: "Noise",
          position: "50%",
          warp: { type: "None", amount: "0%" },
          unison: { voices: 1, detune: "0", blend: "100%", width: "100%" },
        },
        noise: { enabled: true, level: "50%" },
      },
      filter: {
        type: "High Pass 12dB",
        cutoff: "100Hz",
        resonance: "30%",
        keytrack: "0%",
        envAmount: "80%",
      },
      envelopes: {
        amp: { attack: "4s", decay: "0ms", sustain: "100%", release: "500ms" },
        filter: { attack: "4s", decay: "0ms", sustain: "100%", release: "200ms" },
      },
      lfos: {
        lfo1: { shape: "Saw Up", rate: "1/1", destination: "Pitch", amount: "12st" },
      },
      macros: [
        { name: "Rise Time", mappings: ["Amp Attack", "Filter Attack", "LFO Rate"] },
        { name: "Intensity", mappings: ["Filter Resonance", "Noise Level"] },
      ],
      explanation: "Risers work by automating pitch and filter upward over time. The long attack envelope and rising LFO create tension and anticipation.",
      troubleshooting: [
        "Too harsh? Reduce resonance",
        "Too subtle? Increase pitch range",
        "Timing off? Sync LFO to project tempo",
      ],
      variations: [
        { name: "Downlifter", change: "Reverse LFO direction and envelope shapes" },
        { name: "White Noise Sweep", change: "Use only noise, sweep filter cutoff" },
      ],
    }),
    arp: () => ({
      title: `${isBright ? "Bright" : "Warm"} Arp Synth`,
      synth,
      targetType,
      oscillators: {
        oscA: {
          wavetable: "PWM",
          position: "50%",
          warp: { type: "PWM", amount: "30%" },
          unison: { voices: 2, detune: "10ct", blend: "50%", width: "40%" },
        },
      },
      filter: {
        type: "Low Pass 12dB",
        cutoff: isBright ? "5kHz" : "2.5kHz",
        resonance: "20%",
        keytrack: "50%",
        envAmount: "40%",
      },
      envelopes: {
        amp: { attack: "5ms", decay: "100ms", sustain: "50%", release: "50ms" },
        filter: { attack: "0ms", decay: "80ms", sustain: "20%", release: "50ms" },
      },
      lfos: {
        lfo1: { shape: "Triangle", rate: "1/8", destination: "PWM", amount: "40%" },
      },
      macros: [
        { name: "Brightness", mappings: ["Filter Cutoff", "OSC Position"] },
        { name: "Movement", mappings: ["LFO Rate", "PWM Amount"] },
      ],
      explanation: "This arp synth uses PWM modulation for movement and a snappy envelope for rhythmic articulation. The filter envelope adds brightness on each note attack.",
      troubleshooting: [
        "Too busy? Reduce PWM modulation",
        "Notes blending together? Shorten release",
        "Too thin? Add subtle unison",
      ],
      variations: [
        { name: "Trance Arp", change: "Add sidechain compression, increase attack" },
        { name: "Chiptune", change: "Use square wave, reduce filtering" },
      ],
    }),
  };

  return recipes[targetType]();
}

export default RecipeClient;

