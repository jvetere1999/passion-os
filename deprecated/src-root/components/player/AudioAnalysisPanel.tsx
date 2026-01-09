/**
 * AudioAnalysisPanel Component
 * Displays frequency spectrum analysis and audio metrics
 */

"use client";

import type { AudioAnalysis } from "@/lib/player";
import styles from "./AudioAnalysisPanel.module.css";

interface AudioAnalysisPanelProps {
  analysis: AudioAnalysis | null;
  trackName?: string;
}

export function AudioAnalysisPanel({
  analysis,
  trackName,
}: AudioAnalysisPanelProps) {
  const spectrum = analysis?.spectrum || null;

  function getEnergyBarWidth(energy: number): string {
    return `${Math.min(100, energy * 100)}%`;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Audio Analysis</h3>
        {trackName && <span className={styles.trackName}>{trackName}</span>}
      </div>

      {spectrum ? (
        <div className={styles.content}>
          {/* Frequency Bands */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Frequency Bands</h4>
            <div className={styles.bandsGrid}>
              {spectrum.bands.map((band) => (
                <div key={band.name} className={styles.bandCard}>
                  <div className={styles.bandHeader}>
                    <span
                      className={styles.bandName}
                      style={{ color: band.color }}
                    >
                      {band.name.toUpperCase()}
                    </span>
                    <span className={styles.bandFreq}>
                      {band.freqRange[0].toFixed(0)} -{" "}
                      {band.freqRange[1].toFixed(0)} Hz
                    </span>
                  </div>

                  <div className={styles.energyBarContainer}>
                    <div className={styles.energyLabel}>Energy</div>
                    <div className={styles.energyBar}>
                      <div
                        className={styles.energyFill}
                        style={{
                          width: getEnergyBarWidth(band.energy),
                          backgroundColor: band.color,
                        }}
                      />
                    </div>
                    <div className={styles.energyValue}>
                      {(band.energy * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className={styles.bandMetrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Peak</span>
                      <span className={styles.metricValue}>
                        {(band.peak * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Average</span>
                      <span className={styles.metricValue}>
                        {(band.average * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Statistics */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Overall Statistics</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>RMS Energy</span>
                <span className={styles.statValue}>
                  {(spectrum.overallRMS * 100).toFixed(1)}%
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Peak Amplitude</span>
                <span className={styles.statValue}>
                  {(spectrum.peakAmplitude * 100).toFixed(1)}%
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Dynamic Range</span>
                <span className={styles.statValue}>
                  {spectrum.dynamicRange.toFixed(1)} dB
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Crest Factor</span>
                <span className={styles.statValue}>
                  {spectrum.crestFactor.toFixed(2)}
                </span>
              </div>
            </div>

            <div className={styles.infoText}>
              <strong>Dynamic Range:</strong> Difference between loudest and
              quietest parts (dB)
              <br />
              <strong>Crest Factor:</strong> Ratio of peak to average power
              (higher = more dynamic)
            </div>
          </div>

          {/* BPM if available */}
          {analysis?.bpm && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Tempo Analysis</h4>
              <div className={styles.bpmDisplay}>
                <span className={styles.bpmValue}>{analysis.bpm}</span>
                <span className={styles.bpmLabel}>BPM (estimated)</span>
              </div>
            </div>
          )}

          {/* Analyzed timestamp */}
          <div className={styles.analysisInfo}>
            <small>
              Analyzed: {new Date(spectrum.analyzedAt).toLocaleString()}
            </small>
          </div>
        </div>
      ) : (
        <div className={styles.noAnalysis}>
          <p>Analysis in progress...</p>
          <p className={styles.note}>
            Results will appear here when complete
          </p>
        </div>
      )}
    </div>
  );
}

export default AudioAnalysisPanel;

