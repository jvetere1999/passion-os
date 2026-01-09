import type { FeatureEntry } from "./types";

/**
 * Serum 2 Power Features.
 * Source: LETT - Serum 2 Power Features - POWER FEATURES.csv
 * 
 * These are advanced features, mouse actions, and workflow tips
 * that go beyond simple keyboard shortcuts.
 */
export const serumFeatures: FeatureEntry[] = [
    {
        kind: 'feature',
        id: 'serum2:power-ui-menu-logo-box-top-left-right-click-gui-scaling-options',
        productId: 'serum2',
        type: 'ui',
        command: 'GUI Scaling Options',
        keys: 'Right Click',
        context: 'Top Left',
        tags: [
            'power-feature'
        ],
        group: 'UI MENU - (LOGO BOX)',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: 'Ability to change Serum to a fixed percentage based scale, with the last option allowing you to save the choice as your default every time you load Serum going forward.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-ui-menu-logo-box-left-of-serum-2-logo-hover-cursor-then-click-and-drag-drag-from-serum-into-daw-computer-finder-explorer-or-back-into-a-serum-osc-alt',
        productId: 'serum2',
        type: 'ui',
        command: 'Drag from Serum into DAW, Computer (Finder/Explorer), or back into a Serum OSC',
        keys: 'Hover Cursor, Then Click and Drag',
        context: 'Left of Serum 2 Logo',
        tags: [
            'power-feature'
        ],
        group: 'UI MENU - (LOGO BOX)',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: 'Ability to export the last played note in Serum to a .wav file that you can drag and drop directly into your DAW, or drag directly into a desired file path to save directly to computer. ALT/OPTION + Click the wave icon to open the RENDERS folder. Bonus Tip: You can also drag the rendered audio from Serum back into itself into either OSC A, B, C (with advanced Import options) or Noise OSC (as simple sample) to resample the sound. This could be used creatively or possibly to reduce CPU usage.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sub-osc-sub-oct-crs-right-click-enable-pitch-tracking-sub',
        productId: 'serum2',
        type: 'osc',
        command: 'Enable Pitch Tracking',
        keys: 'Right Click',
        context: 'SUB OCT CRS',
        tags: [
            'power-feature'
        ],
        group: 'SUB OSC',
        facets: [
            'Sound Design'
        ],
        note: 'SUB pitch follows keyboard note pitch when ON, constant pitch when OFF.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sub-osc-phase-offset-degree-right-click-contiguous',
        productId: 'serum2',
        type: 'osc',
        command: 'Contiguous',
        keys: 'Right Click',
        context: 'Phase Offset (degree)',
        tags: [
            'power-feature'
        ],
        group: 'SUB OSC',
        facets: [
            'Sound Design'
        ],
        note: 'New notes continue phase of previous note.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sub-osc-phase-offset-degree-right-click-wrap-phase',
        productId: 'serum2',
        type: 'osc',
        command: 'Wrap Phase',
        keys: 'Right Click',
        context: 'Phase Offset (degree)',
        tags: [
            'power-feature'
        ],
        group: 'SUB OSC',
        facets: [
            'Sound Design'
        ],
        note: 'Allows modulations of Phase Offset to wrap under 0° or above 360°. With this setting off, any modulation range would be capped at 0° or 360°. Example: You set Phase Offset to 300°, and add ENV/LFO modulation up 90°. With Wrap Phase OFF, it would only go up to and stop at 360°. With Wrap Phase ON, the modulation would go up to 390° (or wraps back around to 30°; 390°-360°).',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-wavetable-osc-oct-sem-fin-or-crs-right-click-enable-pitch-tracking',
        productId: 'serum2',
        type: 'osc',
        command: 'Enable Pitch Tracking',
        keys: 'Right Click',
        context: 'OCT, SEM, FIN or CRS',
        tags: [
            'power-feature'
        ],
        group: 'WAVETABLE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'OSC follows keyboard note pitch when ON, constant pitch when OFF.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-wavetable-osc-phase-offset-degree-right-click-wrap-phase',
        productId: 'serum2',
        type: 'osc',
        command: 'Wrap Phase',
        keys: 'Right Click',
        context: 'Phase Offset (degree)',
        tags: [
            'power-feature'
        ],
        group: 'WAVETABLE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'Allows modulations of Phase Offset to wrap under 0° or above 360°. With this setting off, any modulation range would be capped at 0° or 360°. See Wrap Phase example above.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-wavetable-osc-phase-offset-degree-right-click-phase-legato',
        productId: 'serum2',
        type: 'osc',
        command: 'Phase Legato',
        keys: 'Right Click',
        context: 'Phase Offset (degree)',
        tags: [
            'power-feature'
        ],
        group: 'WAVETABLE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'Phase does not reset on new note when Legato is ON.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-wavetable-osc-phase-memory-left-click-phase-memory-phase',
        productId: 'serum2',
        type: 'osc',
        command: 'Phase Memory',
        keys: 'Left Click',
        context: 'Phase Memory',
        tags: [
            'power-feature'
        ],
        group: 'WAVETABLE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'Specifies how phase and phase randomization should be determined for new notes. • All Voices: New notes use the PHASE and RAND control settings for all voices. This is the default setting. • Contiguous: New notes continue with the phase of the previous note. • Per Voice: New notes startwith the same editable phase each time. New pencil icon appears to manually select unison voice phase start location.',
        default: 'All Voices'
    },
    {
        kind: 'feature',
        id: 'serum2:power-wavetable-osc-wt-pos-right-click-smooth-interpolation',
        productId: 'serum2',
        type: 'osc',
        command: 'Smooth Interpolation',
        keys: 'Right Click',
        context: 'WT POS',
        tags: [
            'power-feature'
        ],
        group: 'WAVETABLE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'Interpolates frames between wave shapes for smooth morphing'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-preset-menu-right-click-switch-to-wavetable',
        productId: 'serum2',
        type: 'osc',
        command: 'Switch to Wavetable',
        keys: 'Right Click',
        context: 'Sample Preset Menu',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Convert Sample to Wavetable OSC, using a variety of interpolation modes. See Import feature below for breakdown of wavetable import options.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-oct-sem-fin-or-crs-right-click-enable-pitch-tracking',
        productId: 'serum2',
        type: 'osc',
        command: 'Enable Pitch Tracking',
        keys: 'Right Click',
        context: 'OCT, SEM, FIN or CRS',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'OSC follows keyboard note when ON, constant pitch when OFF.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-oct-sem-fin-or-crs-right-click-mode-semitones',
        productId: 'serum2',
        type: 'osc',
        command: 'Mode > Semitones',
        keys: 'Right Click',
        context: 'OCT, SEM, FIN or CRS',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Adjust pitch in semitones, which are intervals between two adjacent keys on a piano tuned to 12-tone equal temperament used in American/European musical tradition.',
        default: 'Semitones'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-oct-sem-fin-or-crs-right-click-mode-harmonics',
        productId: 'serum2',
        type: 'osc',
        command: 'Mode > Harmonics',
        keys: 'Right Click',
        context: 'OCT, SEM, FIN or CRS',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Change the pitch by multiplying the bass frequency using whole number harmonics, generating pitches based on the harmonic series, which is useful for creating overtone-rich sounds like organ tones or harmonic layers.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-oct-sem-fin-or-crs-right-click-mode-ratio-src',
        productId: 'serum2',
        type: 'osc',
        command: 'Mode > Ratio',
        keys: 'Right Click',
        context: 'OCT, SEM, FIN or CRS',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Set the pitch of the oscillator in relation to the base frequency using ratios which is common in FM Synthesis. The oscillator is tuned to a specific ratio relative to antoher oscillator to create complex timbres. In this mode you can set the specific source (SRC) and ratio.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-click-and-drag-sample-display-zoom',
        productId: 'serum2',
        type: 'osc',
        command: 'Sample Display Zoom',
        keys: 'Click and Drag',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Left click and drag down to zoom in, drag up to zoom out, drag left and right to move around timing of sample when zoomed in.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-click-and-drag-audio-file-into-osc-or-right-click-sample-osc-and-switch-to-wavetable-import-fft',
        productId: 'serum2',
        type: 'osc',
        command: 'Import',
        keys: 'Click and Drag Audio File Into OSC OR Right Click Sample OSC and Switch to Wavetable',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Advanced options for how audio files are converted to wavetables. Normal • Dynamic Pitch - Zero Snap: Serum scans the audio file and builds a pitch map, then attempts to locate zero-crossings within the pitch map. Works better with simple sounds as complex sounds don\'t often have sensible zero crossings. This option is typically best if you have a sound with a non-fixed fundamental (has pitch bend or vibrato) and the sound is pretty simple. • Dynamic Pitch - Follow: Similar to previous option with a pitch map. Serum imports a varying-sized segment of audio for each frame based on analyzed pitch. This option is better suited for complex sounds, such as a sample that may have chorus/unison, resonance, or background noise. • Frequency Estimation: Serum analyzes for dominant frequencies (fundamental) and harmonic content (integer multiples of fundamental) to convert to a wavetable. Serum can then align the wavetable content to the correct pitch. This is particularly useful for samples with well-defined pitches and harmonic structures, i.e. monophonic synth leads, bass sounds, sustained vocals, plucked/struck instruments, FM sounds. Constant Framesize • Pitch Average: Serum analyzes the entire file for an average pitch, then uses this number of samples as the import length, displaying the number of samples it is using per frame in the Wavetable Editor formula area. This option is typically the best choice when a sound has a fixed frequency such as a one-shot from a synthesizer. FFT (Fast Fourier Transform) FFT is a method that converts signal from the time domain to frequency domain, breakding down complex waveforms into many sinusoidal frequencies (sine waves). Unlike other import modes, FFT modes are a spectral import, and you can think of it as a "blurred averaging of the frequency content". This can be useful for sounds such as drum loops, speech, and other material you want the flavor of the sound for abstract purposes. The numbers (256-2048) represent the number of samples used to perform FFT. Larger FFT sizes provide higher frequency resolution but less time resolution. Lower FFT sizes provide lower frequency resolution but higher time resolution. • 256 • 512 • 1024 • 2048'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-show-marker-animation',
        productId: 'serum2',
        type: 'osc',
        command: 'Show Marker Animation',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Enable to have start, end, and loop markers animate to show the effect of any assigned modulation. *Dragging markers is not allowed when this is enabled.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-zoom-to-start-and-end',
        productId: 'serum2',
        type: 'osc',
        command: 'Zoom to Start and End',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Reset display zoom setting to defaul showing start and end markers. * Cannot zoom when this is enabled.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-snap-options',
        productId: 'serum2',
        type: 'osc',
        command: 'Snap Options',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Snapping for Start and End times, as well as Loop Points. • Snap Off: No Snap • Snap to Zero: Snap to nearest zero-crossing points, prevents clicking/pops • Snap to Beats: Snap to nearest beat grid based on tempo • Snap to Loop: Snap to nearest pre-defined loop point in waveform',
        default: 'Snap Off'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-fade-edges',
        productId: 'serum2',
        type: 'osc',
        command: 'Fade Edges',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Create gentle crossfades at Sample Start and End times.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-normalize',
        productId: 'serum2',
        type: 'osc',
        command: 'Normalize',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Adjust amplitude/volume to maximize peak loudness without introducing distortion.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-reverse',
        productId: 'serum2',
        type: 'osc',
        command: 'Reverse',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Reverse Audio Sample.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-trim',
        productId: 'serum2',
        type: 'osc',
        command: 'Trim',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Trim sample to current start and end markers.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-sample-waveform-image-right-click-slicing-options',
        productId: 'serum2',
        type: 'osc',
        command: 'Slicing Options',
        keys: 'Right Click',
        context: 'Sample Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Choose whether or not slicing is enabled within the Sample, and if so, how slicing is managed. • Slicing Off: No slicing • Slice Auto: Automatically slice the sample using a configurable threshold (sensitivity). • Slice Manual: Automatically slice the sample then allow you to manually adjust the slices.',
        default: 'Slicing Off'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-loop-mode-right-click-relative-loop',
        productId: 'serum2',
        type: 'osc',
        command: 'Relative Loop',
        keys: 'Right Click',
        context: 'Loop Mode',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Looped section of sample changes dynamically based on playback start position, rather than always looping between fixed start and end points.',
        default: 'One-Shot (No Loop)'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-loop-mode-right-click-link-loop-length',
        productId: 'serum2',
        type: 'osc',
        command: 'Link Loop Length',
        keys: 'Right Click',
        context: 'Loop Mode',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Loop end marker moves relative to the loop start marker, keeping loop length consistent.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-loop-mode-right-click-exit-loop-on-release',
        productId: 'serum2',
        type: 'osc',
        command: 'Exit Loop on Release',
        keys: 'Right Click',
        context: 'Loop Mode',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'When a key is released and the amplitude envelope is in the release phase, playback exits the loop and plays to the end of the sample.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-scan-right-click-range',
        productId: 'serum2',
        type: 'osc',
        command: 'Range',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Expand sample scan playback speed up to ± 200, 400, or 800%.',
        default: '± 200%'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-scan-right-click-reverse',
        productId: 'serum2',
        type: 'osc',
        command: 'Reverse',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Initiate sample playback from end time in reverse direction.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-scan-right-click-lock-scan-rate-to-tempo',
        productId: 'serum2',
        type: 'osc',
        command: 'Lock Scan Rate (to Tempo)',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Change scan rate when the tempo changes.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-sample-oscs-common-features-between-sample-granular-spectral-scan-right-click-sample-length-to-bpm-scan',
        productId: 'serum2',
        type: 'osc',
        command: 'Sample Length to BPM',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'SAMPLE OSCS - (Common Features - Between SAMPLE, - GRANULAR & SPECTRAL)',
        facets: [
            'Sound Design'
        ],
        note: 'Set the sample length based on the BPM set in the host DAW. Changes SCAN to RATE based on BPM divisions.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-multisample-osc-unique-sample-preset-menu-right-click-switch-to-single-sample-sample',
        productId: 'serum2',
        type: 'osc',
        command: 'Switch to Single Sample',
        keys: 'Right Click',
        context: 'Sample Preset Menu',
        tags: [
            'power-feature'
        ],
        group: 'MULTISAMPLE OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Simplifies to single SAMPLE OSC based on last detected sample played.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-multisample-osc-unique-adsr-envelope-override-delay-right-click-bpm-sync',
        productId: 'serum2',
        type: 'osc',
        command: 'BPM Sync',
        keys: 'Right Click',
        context: 'ADSR Envelope Override - Delay',
        tags: [
            'power-feature'
        ],
        group: 'MULTISAMPLE OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Change millisecond pre-delay to BPM based pre-delay.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-loop-mode-right-click-loop-grains',
        productId: 'serum2',
        type: 'osc',
        command: 'Loop Grains',
        keys: 'Right Click',
        context: 'Loop Mode',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Sets the grain playback to respect loop markers.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-unison-left-click-cog-wheel-spawn-pattern',
        productId: 'serum2',
        type: 'osc',
        command: 'Spawn Pattern',
        keys: 'Left Click Cog Wheel',
        context: 'UNISON',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'The timing offset at which unison grain voices are spawned. • Together: All unsion grain voices spawn at the same time. • Even: The timing of unison grain voices is spread out evenly. • Exp: The timing between unison grain voices increases over the period before next spawn. • Random: The timing between unison grain voices is randomly distributed.',
        default: 'Together'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-window-amount-alt-option-left-click-and-drag-change-window-amount-and-skew-alt',
        productId: 'serum2',
        type: 'osc',
        command: 'Change Window Amount and Skew',
        keys: 'ALT/OPTION + Left Click and Drag',
        context: 'Window Amount',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Left click into the Window to see more advanced grain shape settings. ALT/OPTION + Click and Drag on the window allows you to quickly adjust the settings for the chosen SHAPE. Drag up/down = Amount Drag left/right = Skew'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-scan-right-click-key-track',
        productId: 'serum2',
        type: 'osc',
        command: 'Key Track',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Disable, scan rate is fixed. When enabled, the scan rate changes in proportion to the pitch of the note played (higher-notes increase the scan rate).',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-dens-density-right-click-free',
        productId: 'serum2',
        type: 'osc',
        command: 'Free',
        keys: 'Right Click',
        context: 'DENS (Density)',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Grains are spawned at a rate defined in Hz',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-dens-density-right-click-bpm-sync',
        productId: 'serum2',
        type: 'osc',
        command: 'BPM Sync',
        keys: 'Right Click',
        context: 'DENS (Density)',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Grains are spawned at a bar/beat division of host tempo. Additional Triplet and Dotted right click context menu options are added if selected.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-dens-density-right-click-grains',
        productId: 'serum2',
        type: 'osc',
        command: 'Grains**',
        keys: 'Right Click',
        context: 'DENS (Density)',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'The spawn rate is calculated as a function of grain length such that a consistent number of grains as set by the control is playing at any given time.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-dens-density-right-click-jump-start',
        productId: 'serum2',
        type: 'osc',
        command: 'Jump Start',
        keys: 'Right Click',
        context: 'DENS (Density)',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Multiple grains spawn at note start so that the full density is heard immediately.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-dens-density-right-click-max-grains-2-256',
        productId: 'serum2',
        type: 'osc',
        command: 'Max Grains > (2-256)',
        keys: 'Right Click',
        context: 'DENS (Density)',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Set a maximum number of grains allowed to play at any one time including unison grain voices.',
        default: '128'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-length-right-click-free',
        productId: 'serum2',
        type: 'osc',
        command: 'Free',
        keys: 'Right Click',
        context: 'LENGTH',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Grains are spawned at a rate defined in Hz',
        default: 'Free'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-length-right-click-bpm-sync',
        productId: 'serum2',
        type: 'osc',
        command: 'BPM Sync',
        keys: 'Right Click',
        context: 'LENGTH',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Grains are spawned at a bar/beat division of host tempo. Additional Triplet and Dotted right click context menu options are added if selected.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-length-right-click-percent-dens',
        productId: 'serum2',
        type: 'osc',
        command: 'Percent**',
        keys: 'Right Click',
        context: 'LENGTH',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Grain length is set to a percent of the density period. **This option is not available if you select Grains option with the DENS knob.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-length-right-click-key-track',
        productId: 'serum2',
        type: 'osc',
        command: 'Key Track',
        keys: 'Right Click',
        context: 'LENGTH',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Length of grains changes in proportion to the pitch of the note played (lower notes have longer grains and higher notes have shorter grains).',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-granular-osc-unique-dir-random-direction-right-click-reverse-grains',
        productId: 'serum2',
        type: 'osc',
        command: 'Reverse Grains',
        keys: 'Right Click',
        context: 'DIR (Random Direction)',
        tags: [
            'power-feature'
        ],
        group: 'GRANULAR OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Enable reversal of grain playback as part of per-grain direction randomization.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-sample-preset-dropdown-right-click-import-png',
        productId: 'serum2',
        type: 'osc',
        command: 'Import PNG...',
        keys: 'Right Click',
        context: 'Sample Preset Dropdown',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Import image file as spectral sample. X-axis is scanned through over time, Y-Axis represents frequencies low to high.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-sample-preset-menu-left-click-icon-to-left-of-preset-or-right-click-sample-preset-name-embed-in-preset-spectral',
        productId: 'serum2',
        type: 'osc',
        command: 'Embed in Preset',
        keys: 'Left Click Icon to Left of Preset OR Right Click Sample Preset Name',
        context: 'Sample Preset Menu',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'You can upload custom images to the SPECTRAL OSC by dragging and dropping PNG files into the image display window or by right clicking the preset dropdown and choosing Import PNG... If you add a custom PNG, new options will appear to allow embedding. Right click the preset dropdown and choose Embed in Preset or left click the new icon on the left to enable embedding of custom PNG files loaded into SPECTRAL OSC so they save into the preset. Make sure to check this if you plan on sharing presets that use custom PNG images.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-spectral-waveform-image-right-click-show-waveform-display',
        productId: 'serum2',
        type: 'osc',
        command: 'Show Waveform Display',
        keys: 'Right Click',
        context: 'Spectral Waveform Image',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Toggle to display the waveform directly below the spectral display.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-high-low-markers-to-right-of-spectrogram-right-click-smooth',
        productId: 'serum2',
        type: 'osc',
        command: 'Smooth',
        keys: 'Right Click',
        context: 'High/Low Markers to Right of Spectrogram',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Apply filter at low and high frequency boundaries for smoother edges.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-high-low-markers-to-right-of-spectrogram-right-click-post-warp',
        productId: 'serum2',
        type: 'osc',
        command: 'Post Warp',
        keys: 'Right Click',
        context: 'High/Low Markers to Right of Spectrogram',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Apply low/high filtering after processing spectral warps.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-scan-right-click-phase-lock-fft',
        productId: 'serum2',
        type: 'osc',
        command: 'Phase Lock',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Adjust the FFT phases to minimize the audible phase change between FFT blocks. This can result in a less "smeared" sound, more faithful to the orginal sample. Consider using this for tonal samples.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-scan-right-click-transients-fft',
        productId: 'serum2',
        type: 'osc',
        command: 'Transients',
        keys: 'Right Click',
        context: 'SCAN',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Preserves transients that would otherwise be smeared by FFT processing. Consider using this with percussive sounds or loops.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-spectral-osc-unique-warp-left-click-spectral-modes',
        productId: 'serum2',
        type: 'osc',
        command: 'Spectral Modes',
        keys: 'Left Click',
        context: 'WARP',
        tags: [
            'power-feature'
        ],
        group: 'SPECTRAL OSC - (UNIQUE)',
        facets: [
            'Sound Design'
        ],
        note: 'Explore a list of Warp modes that are unique to the Spectral OSC. Some warp modes have an additional slider control that will appear underneath that allows you to further adjust the window of warping.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-noise-osc-pitch-right-click-enable-pitch-tracking',
        productId: 'serum2',
        type: 'osc',
        command: 'Enable Pitch Tracking',
        keys: 'Right Click',
        context: 'PITCH',
        tags: [
            'power-feature'
        ],
        group: 'NOISE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'Noise pitch follows keyboard note when ON, constant pitch when OFF.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-noise-osc-noise-preset-menu-right-click-embed-in-preset-noise',
        productId: 'serum2',
        type: 'osc',
        command: 'Embed in Preset',
        keys: 'Right Click',
        context: 'Noise Preset Menu',
        tags: [
            'power-feature'
        ],
        group: 'NOISE OSC',
        facets: [
            'Sound Design'
        ],
        note: 'You can upload custom Noise samples to the NOISE OSC by right clicking the preset dropdown and choosing Load Sample or by dragging and dropping in an audio file direct onto the Noise OSC sample display. If you add a custom Noise sample, a new option will appear in the preset dropdown right click menu, Embed in Preset, which allows you to save the custom noise sample directly into the preset file. Make sure to check this if you plan on sharing presets that use custom Noise samples if you do not plan to share the noise samples separately. Bonus tip: Mono samples will use slightly less CPU resources than stereo samples (one channel instead of two can add up with chords).'
    },
    {
        kind: 'feature',
        id: 'serum2:power-filter-1-2-drive-right-click-clean-mode-drive',
        productId: 'serum2',
        type: 'filter',
        command: 'Clean Mode',
        keys: 'Right Click',
        context: 'DRIVE',
        tags: [
            'power-feature'
        ],
        group: 'FILTER 1 & 2',
        facets: [
            'Sound Design'
        ],
        note: 'Normally DRIVE will add push gain into the filter circuit, which can impart some coloration (mild distortion) to the sound. Use Clean Mode to add gain without the added saturation/coloration.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-modulation-modulation-sources-click-and-drag-quick-create-modulation-velo',
        productId: 'serum2',
        type: 'mod',
        command: 'Quick Create Modulation',
        keys: 'Click and Drag',
        context: 'Modulation Sources',
        tags: [
            'power-feature'
        ],
        group: 'MODULATION',
        facets: [
            'Modulation'
        ],
        note: 'Click and drag any Source direct to a destination parameter to create a new modulation. Serum 1 allowed this for options such as: ENVs, LFOs, VELO (velocity), NOTE (keyboard note position), and MOD WHEEL. Serum 2 has added a few new options for instant click and drag assignments. These additions include SUB, OSC A, OSC B, OSC C, NOISE, FILTER 1 and FILTER 2. (click and drag direct from the header row)'
    },
    {
        kind: 'feature',
        id: 'serum2:power-modulation-modulatied-parameter-alt-option-shift-left-click-change-modulation-polarity-direction',
        productId: 'serum2',
        type: 'mod',
        command: 'Change Modulation Polarity (Direction)',
        keys: 'ALT/OPTION + Shift + Left Click',
        context: 'Modulatied Parameter',
        tags: [
            'power-feature'
        ],
        group: 'MODULATION',
        facets: [
            'Modulation'
        ],
        note: 'Change the type of any modulation (envelope, LFO, macro, etc.) from Unidirectional (+ or -) to Bidirectional (±).',
        default: 'Parameter Dependent'
    },
    {
        kind: 'feature',
        id: 'serum2:power-envelopes-envelope-display-right-click-grid',
        productId: 'serum2',
        type: 'mod',
        command: 'Grid',
        keys: 'Right Click',
        context: 'Envelope Display',
        tags: [
            'power-feature'
        ],
        group: 'ENVELOPES',
        facets: [
            'Modulation'
        ],
        note: 'Change grid setting behind envelope display. • Time: Default option that shows grid in seconds. • Beats: Shows grid in beats, bars divided with thick bars. This grid dynamically adjusts with host BPM.',
        default: 'Time'
    },
    {
        kind: 'feature',
        id: 'serum2:power-envelopes-envelope-display-right-click-legato-inverted-legato',
        productId: 'serum2',
        type: 'mod',
        command: 'Legato Inverted',
        keys: 'Right Click',
        context: 'Envelope Display',
        tags: [
            'power-feature'
        ],
        group: 'ENVELOPES',
        facets: [
            'Modulation'
        ],
        note: 'When the main LEGATO switch is enabled, envelopes do not retrigger if a second note is played while a first note is still held. You can use this option to force an envelope to always trigger at note on, even when legato is enabled.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-lfos-rate-bpm-right-click-swing-swing',
        productId: 'serum2',
        type: 'mod',
        command: 'Swing',
        keys: 'Right Click',
        context: 'RATE (BPM)',
        tags: [
            'power-feature'
        ],
        group: 'LFOs',
        facets: [
            'Modulation'
        ],
        note: 'Add swing to LFO rate, matching the setting from SWING amount above keyboard.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-lfos-rate-hz-right-click-10x',
        productId: 'serum2',
        type: 'mod',
        command: '10x',
        keys: 'Right Click',
        context: 'RATE (HZ)',
        tags: [
            'power-feature'
        ],
        group: 'LFOs',
        facets: [
            'Modulation'
        ],
        note: 'Allow the range of the rate control (in Hz) be multiplied by a factor of 10, allowing for faster LFO rates.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-lfos-lfo-point-on-envelope-mode-right-click-or-ctrl-cmd-shift-left-click-point-set-loopback-point-here',
        productId: 'serum2',
        type: 'mod',
        command: 'Set Loopback Point Here',
        keys: 'Right Click OR CTRL/CMD + Shift + Left Click Point',
        context: 'LFO Point on ENVELOPE Mode',
        tags: [
            'power-feature'
        ],
        group: 'LFOs',
        facets: [
            'Modulation'
        ],
        note: 'Set a loopback point, causing the LFO to play through fully once, and then cycle back to the selected loopback point to loop from that point on.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-lfos-lfo-points-ctrl-cmd-left-click-and-drag-through-points-relative-movement',
        productId: 'serum2',
        type: 'mod',
        command: 'Relative Movement',
        keys: 'CTRL/CMD + Left Click and Drag Through Points',
        context: 'LFO Points',
        tags: [
            'power-feature'
        ],
        group: 'LFOs',
        facets: [
            'Modulation'
        ],
        note: 'Select multiple points for relative movement of all points together.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-velo-note-voicing-velo-right-click-legato-portamento-time-velo',
        productId: 'serum2',
        type: 'midi',
        command: 'Legato (Portamento Time)',
        keys: 'Right Click',
        context: 'VELO',
        tags: [
            'power-feature'
        ],
        group: 'VELO, NOTE & VOICING',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'Have the portamento applied to the VELO curve when a note is triggered and another is already held.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-velo-note-voicing-note-right-click-legato-portamento-time-note',
        productId: 'serum2',
        type: 'midi',
        command: 'Legato (Portamento Time)',
        keys: 'Right Click',
        context: 'NOTE',
        tags: [
            'power-feature'
        ],
        group: 'VELO, NOTE & VOICING',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'Have the portamento applied to the NOTE curve when a note is triggered and another is already held.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-velo-note-voicing-voicing-poly-right-click-limit-same-note-poly-to-1',
        productId: 'serum2',
        type: 'midi',
        command: 'Limit Same Note Poly to 1',
        keys: 'Right Click',
        context: 'VOICING: POLY',
        tags: [
            'power-feature'
        ],
        group: 'VELO, NOTE & VOICING',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'If a note is already sounding, pressing the same note again won\'t trigger another layer of the same note. This prevents "stacking" multiple instances of the same note, ensuring clarity in the sound and avoiding unintended overlaps or muddiness.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-velo-note-voicing-voicing-poly-right-click-voice-steal-priority',
        productId: 'serum2',
        type: 'midi',
        command: 'Voice Steal Priority',
        keys: 'Right Click',
        context: 'VOICING: POLY',
        tags: [
            'power-feature'
        ],
        group: 'VELO, NOTE & VOICING',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'Change the priority of what note should be terminated when the number of voices exceeds the maximum Polyphony settings. • Newest - Newest note played. • Oldest - Oldest note played. • Highest - Highest note played. • Lowest - Lowest note played. • Velocity - Note with the lowest input velocity.',
        default: 'Newest'
    },
    {
        kind: 'feature',
        id: 'serum2:power-clip-clip-module-right-click-lock-module-clip',
        productId: 'serum2',
        type: 'midi',
        command: 'Lock Module',
        keys: 'Right Click',
        context: 'CLIP Module',
        tags: [
            'power-feature'
        ],
        group: 'CLIP',
        facets: [
            'MIDI Control',
            'Workflow'
        ],
        note: 'Lock the entire CLIP module, including all clips, when changing presets.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-clip-clip-preview-window-right-click-set-as-preview-clip-clip',
        productId: 'serum2',
        type: 'midi',
        command: 'Set as Preview Clip',
        keys: 'Right Click',
        context: 'CLIP Preview Window',
        tags: [
            'power-feature'
        ],
        group: 'CLIP',
        facets: [
            'MIDI Control',
            'Workflow'
        ],
        note: 'Save CLIP as part of synth preset for quick previewing in Preset Browser page. If no option is saved, a default MIDI sequence will be used instead.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-clip-clip-preview-windows-left-click-and-drag-to-daw-piano-roll-drag-clip-s-midi-to-piano-roll',
        productId: 'serum2',
        type: 'midi',
        command: 'Drag CLIP\'s MIDI to Piano Roll',
        keys: 'Left Click and Drag to DAW Piano Roll',
        context: 'CLIP Preview Windows',
        tags: [
            'power-feature'
        ],
        group: 'CLIP',
        facets: [
            'MIDI Control',
            'Workflow'
        ],
        note: 'Allows you to migrate MIDI information* from within Serum directly to your DAW Piano Roll. *Velocity, Pan or other MIDI CC supported properties may migrate but Serum internal modulations such as Macro 1-8 movements may not export over.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-arp-arp-module-right-click-lock-module-arp',
        productId: 'serum2',
        type: 'midi',
        command: 'Lock Module',
        keys: 'Right Click',
        context: 'ARP Module',
        tags: [
            'power-feature'
        ],
        group: 'ARP',
        facets: [
            'MIDI Control',
            'Composition'
        ],
        note: 'Lock the entire ARP module, including all arps, when changing presets.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-arp-chance-right-click-pre-chance',
        productId: 'serum2',
        type: 'midi',
        command: 'Pre',
        keys: 'Right Click',
        context: 'CHANCE',
        tags: [
            'power-feature'
        ],
        group: 'ARP',
        facets: [
            'MIDI Control',
            'Composition'
        ],
        note: 'CHANCE sets the probability of a note being played. Choose Pre to apply the CHANCE setting before the SHAPE pattern is advanced. You can use this to guarantee that the next note played is always next in the sequence. Example: You hold chord C E G, then add note A. With Pre on, the next random note would be guaranteed here to be A.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-keyboard-key-scale-right-click-swap-key-mode-to-major-swap-key-mode-to-minor',
        productId: 'serum2',
        type: 'midi',
        command: '• Swap Key/Mode to: _ Major • Swap Key/Mode to: _ Minor',
        keys: 'Right Click',
        context: 'KEY & SCALE',
        tags: [
            'power-feature'
        ],
        group: 'KEYBOARD',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'Adjust the Key and Scale to the most directly related Major or Minor scale. Example: F Lydian is all white notes, and so is C Major and A Minor. These are different modes that all use the same underlying notes, even though they have a different tonic (home base). If set to F Lydian, the right click menu would give options to Swap Key/Mode to: C Major or A Minor respectively.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-keyboard-key-scale-right-click-start-learning-stop-learning-assign-key',
        productId: 'serum2',
        type: 'midi',
        command: '• Start Learning • Stop Learning + Assign Key',
        keys: 'Right Click',
        context: 'KEY & SCALE',
        tags: [
            'power-feature'
        ],
        group: 'KEYBOARD',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'Allow Serum to detect incoming MIDI to learn what key you are in. The more notes you provide, the more accurate it will be able to detect a suitable key/scale. First, click Start Learning, after which Serum will begin listening to every MIDI note input to detect a key. After you are done running through your MIDI, right click and choose Stop Learning + Assign Key to lock in the detected key. Choose Abort Learn to cancel out.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-keyboard-osc-mapping-left-click-key-vel-ranges-for-all-osc-keyboard',
        productId: 'serum2',
        type: 'midi',
        command: 'KEY & VEL Ranges for All OSC',
        keys: 'Left Click',
        context: 'OSC MAPPING',
        tags: [
            'power-feature'
        ],
        group: 'KEYBOARD',
        facets: [
            'MIDI Control',
            'Performance'
        ],
        note: 'Use the OSC Mapping Editor to dial in KEYBOARD note and VELOCITY ranges for various OSC sources separately, as well as the ARP section. The green bars represent the ranges for each OSC. You can drag the edges to change the limits and drag the bars themselves to move around. The FOLD checkboxes instruct Serum so that notes played outside of that range fold back into an applicable note. The WARP checkboxes instruct Serum to still apply Warping from oscillators when played outside their range, i.e. OSC A has FM from OSC B, and OSC B is played out of its key range, OSC B will still warp OSC A. Bonus Tip: You can use OSC Mapping to do splits and layers, i.e. bass and lead layers split to their according ranges.',
        default: 'Full Range'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-global-bypass-alt-option-left-click-bypass-all-fx-alt',
        productId: 'serum2',
        type: 'fx',
        command: 'Bypass All FX',
        keys: 'ALT/OPTION + Left Click',
        context: 'Global Bypass',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'ALT/OPTION click any single bypass icon to bypass all FX on any specific bus (MAIN, BUS 1, BUS 2).'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-shift-right-click-retrig-shift',
        productId: 'serum2',
        type: 'fx',
        command: 'Retrig',
        keys: 'Right Click',
        context: 'SHIFT',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'SHIFT adjusts the percentage of the range to which to apply the pitch shift. Choose Retrig to have the module restart the effect for each new note.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-rate-bpm-right-click-swing-chorus',
        productId: 'serum2',
        type: 'fx',
        command: 'Swing',
        keys: 'Right Click',
        context: 'RATE (BPM)',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Apply swing to CHORUS rate from global SWING section above bottom keyboard.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-ratio-right-click-limiter-latency-comp-ratio',
        productId: 'serum2',
        type: 'fx',
        command: 'Limiter Latency Comp.',
        keys: 'Right Click',
        context: 'RATIO',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'If RATIO is set to max, or set to act as a Limiter, Serum 2 can introduce lookahead latency. Choose Limiter Latency Comp to have the FX module report this latency to the host.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-mix-multiband-right-click-compensated-wet-dry-mix',
        productId: 'serum2',
        type: 'fx',
        command: 'Compensated Wet/Dry',
        keys: 'Right Click',
        context: 'MIX (MULTIBAND)',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Auto-Gain functionality as you adjust MIX knob of compressor to any value less than 100% for parallel compression.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-ir-display-manual-left-click-icon-in-top-right-or-right-click-ir-display-embed-in-preset-png',
        productId: 'serum2',
        type: 'fx',
        command: 'Embed in Preset',
        keys: 'Left Click Icon in Top Right OR Right Click IR Display',
        context: 'IR Display (Manual)',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'You can load impulse responses from outside the Serum 2 Presets folder by dragging and dropping files (.wav, .flac, etc.) onto the IR display or selecting Load IR from the context menu. If you manually add a sample, the option to Embed in Preset appears in the right click menu and an icon appears in the IR display. This option allows you to embed the impulse response into the preset, similar to what you can do with PNG images in SPECTRAL OSC.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-mode-left-click-high-quality-delay',
        productId: 'serum2',
        type: 'fx',
        command: 'High Quality',
        keys: 'Left Click',
        context: 'MODE',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Option to render the output of the DELAY module in higher quality.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-freq-right-click-key-track',
        productId: 'serum2',
        type: 'fx',
        command: 'Key Track',
        keys: 'Right Click',
        context: 'FREQ',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Makes center frequency for distortion filter follow keyboard note position. Lower notes have lower frequency, higher notes have higher frequency.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-cutoff-right-click-key-track',
        productId: 'serum2',
        type: 'fx',
        command: 'Key Track',
        keys: 'Right Click',
        context: 'CUTOFF',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Makes cutoff frequency follow keyboard note position. Lower notes have lower cutoff frequency, higher notes have higher cutoff frequency.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-drive-right-click-clean-mode-drive',
        productId: 'serum2',
        type: 'fx',
        command: 'Clean Mode',
        keys: 'Right Click',
        context: 'DRIVE',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Normally DRIVE will add push gain into the filter circuit, which can impart some coloration (mild distortion) to the sound. Use Clean Mode to add gain without the added saturation/coloration.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-rate-bpm-right-click-swing-flanger',
        productId: 'serum2',
        type: 'fx',
        command: 'Swing',
        keys: 'Right Click',
        context: 'RATE (BPM)',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Apply swing to FLANGER rate from global SWING section above bottom keyboard.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-rate-bpm-right-click-swing-phaser',
        productId: 'serum2',
        type: 'fx',
        command: 'Swing',
        keys: 'Right Click',
        context: 'RATE (BPM)',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Apply swing to PHASER rate from global SWING section above bottom keyboard.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-fx-pre-dly-right-click-bpm',
        productId: 'serum2',
        type: 'fx',
        command: 'BPM',
        keys: 'Right Click',
        context: 'PRE-DLY',
        tags: [
            'power-feature'
        ],
        group: 'FX',
        facets: [
            'Effects'
        ],
        note: 'Adjust Pre-Delay timing for any of the 5 included reverb modes from free (milliseconds) to BPM to dial in tempo-based delay time from host before the reverb kicks in. Using Pre-Delay can give an impression that a sound is close to you but in a large room, or help you to separate a transient from the reverb to create a delay-like echo.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-matrix-top-right-dropdown-left-click-additional-modulation-matrix-operations-source',
        productId: 'serum2',
        type: 'mod',
        command: 'Additional Modulation Matrix Operations',
        keys: 'Left Click',
        context: 'Top Right Dropdown',
        tags: [
            'power-feature'
        ],
        group: 'MATRIX',
        facets: [
            'Modulation'
        ],
        note: 'Various operations that you can quickly perform with the Modulation Matrix: • Sort by Source: Sort the modulation matrix (ascending) by the SOURCE column. • Sort by Destination: Sort the modulation matrix (ascending) by the DESTINATION column. • Lock Matrix (Keep Assignments on Preset Change): Lock the matrix, keeping the modulation assignments when you change presets or initialize a new preset. • Create Vibrato (Unused LFO->Pitch via Wheel): Create a new modulation that maps the next available LFO to "Main Tuning" (global fine pitch) using the Mod Wheel. • Create Velo->Amp Assignment: Create a new modulation that maps VELO (Velocity) to the Amp. • Apply and Delete Macros: "Bake" the macro adjustments into the current preset. Specifically for any parameter assigned to a macro, update the current value of the parameter to include any offset from the macro, then remove all modulation assignments for all macros from the modulation matrix.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-user-interface-double-click-behavior-left-click-change-behavior-of-double-click-reset',
        productId: 'serum2',
        type: 'ui',
        command: 'Change Behavior of Double Click',
        keys: 'Left Click',
        context: 'USER INTERFACE: Double-Click Behavior',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Adjust the default behavior of double clicking in Serum 2 between two options: • RESET: Reset a knob/fader/parameter to its default (init) value. • TYPE VALUE: Display a pop-up text box allowing you to type a specific value. Note: Whichever option is not turned on will instead be CTRL/CMD + Click instead of Double Click.',
        default: 'TYPE VALUE'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-user-interface-offline-render-quality-left-click-use-ultra-quality-when-rendering-important',
        productId: 'serum2',
        type: 'ui',
        command: 'Use Ultra quality when rendering',
        keys: 'Left Click',
        context: 'USER INTERFACE: Offline Render Quality',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Instruct Serum 2 to perform an offline render (bounce) using Ultra Quality mode (4X Oversampling). This results in the highest quality playback of the rendered sound. Since the rendering is performed offline, the performance trade off in using ultra quality mode for renders generally makes sense. IMPORTANT: If you feel like your export sounds vastly different than what you hear in the DAW, it\'s probably this setting. Higher oversampling on Ultra may clean up certain kinds of distortion/saturation introduced from aliasing. If this kind of distortion was part of your purposeful intent, then you may want to uncheck this option for those Serum instances that you want to be more distorted or gritty, i.e. a bass patch.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-quality-left-click-set-and-lock-quality',
        productId: 'serum2',
        type: 'ui',
        command: 'Set and Lock Quality',
        keys: 'Left Click',
        context: 'QUALITY',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Set the oversampling quality of Serum 2. • Good (formerly Draft): 1x oversampling (no oversampling) • High: 2x oversampling • Ultra: 4x oversampling The lock icon will ignore quality configurations in other presets as you switch from preset to preset, using your Global locked setting instead. Bonus Tip: Set Quality to Good, the lowest possible, while you work on projects to save CPU; and use the aforementioned checkbox to "Use Ultra quality when rendering" so that you still get the best sounding quality as you export and bounce out audio. Keep in mind the impact of Ultra on distortion if you don\'t prefer this by default.',
        default: 'High (2x)'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-quality-left-click-s1-compatibility-mode-dsp',
        productId: 'serum2',
        type: 'ui',
        command: 'S1 Compatibility Mode',
        keys: 'Left Click',
        context: 'QUALITY',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Serum 2 features a completely rebuilt sound engine. However, when you load a Serum 1 preset, this option is automatically enabled to preserve maximum sonic similarity with Serum 1. Disable this option if you prefer Serum 1 presets take advantage of the DSP updates available in the Serum 2 sound engine.',
        default: 'OFF (ON for S1 Presets)'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-quality-left-click-disable-smoothing',
        productId: 'serum2',
        type: 'ui',
        command: 'Disable Smoothing',
        keys: 'Left Click',
        context: 'QUALITY',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Disable automation parameter smoothing. While Serum is built to try to avoid clicks and jumps in the signal, there are times you might want precision over parameter changes (for instance, during fast rhythmic automation). In this case, you can choose to disable smoothing (Serum supports sample-accurate automation).',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-voice-control-random-detune-right-click-10x',
        productId: 'serum2',
        type: 'ui',
        command: '10X',
        keys: 'Right Click',
        context: 'VOICE CONTROL: RANDOM DETUNE',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Globally set random detune amounts per voice. The default range goes from 0-20 Cents. 10X extends this range from 0-200 Cents. Note: 100 Cents = 1 Semitone = 1 Half Step on Piano (C to C#)',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-tuning-mts-esp-settings-right-click-enable-mts-esp-tun',
        productId: 'serum2',
        type: 'ui',
        command: 'Enable MTS-ESP',
        keys: 'Right Click',
        context: 'TUNING: MTS-ESP Settings',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Serum 2 allows you to load in a custom Tuning file by clicking into the TUN FILE field and choosing Load Tuning. However, if you would like to use a single main tuning file across all instances of Serum as well as other supported virtual instrument plugins, Serum supports the MTS-ESP microtuning system developed by ODDSOUND. Using the free MTS-ESP Mini plugin, you can load .scl, .kbm, or .tun files and automatically retune all connected MTS-ESP clients (including Serum), allowing you to retune any number of supported instruments from a central location without requiring you to tune each instrument separately. MTS-ESP support is enabled by default.',
        default: 'ON'
    },
    {
        kind: 'feature',
        id: 'serum2:power-global-tuning-mts-esp-settings-right-click-mts-esp-note-on-only-mts',
        productId: 'serum2',
        type: 'ui',
        command: 'MTS-ESP Note-On Only',
        keys: 'Right Click',
        context: 'TUNING: MTS-ESP Settings',
        tags: [
            'power-feature'
        ],
        group: 'GLOBAL',
        facets: [
            'Workflow'
        ],
        note: 'Have the tuning set on Note-On MIDI events. This ensures that the tuning of a note will not change during its duration, even if the global MTS-ESP tuning updates.',
        default: 'OFF'
    },
    {
        kind: 'feature',
        id: 'serum2:power-browser-selected-preset-s-shift-backspace-delete-selected-presets',
        productId: 'serum2',
        type: 'ui',
        command: 'Delete Selected Presets',
        keys: 'Shift + Backspace',
        context: 'Selected Preset(s)',
        tags: [
            'power-feature'
        ],
        group: 'BROWSER',
        facets: [
            'Workflow',
            'Presets'
        ],
        note: 'Shortcut to quickly delete selected presets. Use Shift + Click to select more than one at a time. Useful if there are presets you feel you will never use, then you can filter down the noise. Note: Serum does not ask confirmation before deleting and you can\'t undo deletion from within Serum.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-browser-top-right-dropdown-left-click-advanced-preset-browser-options',
        productId: 'serum2',
        type: 'ui',
        command: 'Advanced Preset Browser Options',
        keys: 'Left Click',
        context: 'Top Right Dropdown',
        tags: [
            'power-feature'
        ],
        group: 'BROWSER',
        facets: [
            'Workflow',
            'Presets'
        ],
        note: 'Perform a range of additional advanced operations such as:'
    },
    {
        kind: 'feature',
        id: 'serum2:power-browser-top-right-dropdown-left-click-presets',
        productId: 'serum2',
        type: 'ui',
        command: 'Presets',
        keys: 'Left Click',
        context: 'Top Right Dropdown',
        tags: [
            'power-feature'
        ],
        group: 'BROWSER',
        facets: [
            'Workflow',
            'Presets'
        ],
        note: '• Show Preset in Finder/Folder: Display the selected preset in Finder (macOS) or Explorer (Windows). • Load Random Preset: Load a random preset. (Type 7 to load another) • Hybridize: Load a hybrid preset consisting of four randomly selected presets. (Type 8 to load another). • Hybridize Favoring Selected Preset: Load a hybrid preset consisting of the currently selected preset and 3 other randomly-selected presets. (To load another, type 9 for shortcut).'
    },
    {
        kind: 'feature',
        id: 'serum2:power-browser-top-right-dropdown-left-click-previews-clip',
        productId: 'serum2',
        type: 'ui',
        command: 'Previews',
        keys: 'Left Click',
        context: 'Top Right Dropdown',
        tags: [
            'power-feature'
        ],
        group: 'BROWSER',
        facets: [
            'Workflow',
            'Presets'
        ],
        note: '• Auto-Play Previews: Toggle to have preset previews play automatically instead of having to click the play button on far left. • Preview Fallback Clip: 3 available built-in MIDI sequences for any preset that does not have a custom CLIP set as preview clip.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-browser-top-right-dropdown-left-click-database',
        productId: 'serum2',
        type: 'ui',
        command: 'Database',
        keys: 'Left Click',
        context: 'Top Right Dropdown',
        tags: [
            'power-feature'
        ],
        group: 'BROWSER',
        facets: [
            'Workflow',
            'Presets'
        ],
        note: '• Rescan Database: Rescan the Serum presets database. Can do this after adding new presets to the Serum 2 Presets folder or making other changes to the database. • Erase and Rebuild Database: Do this if rescanning the database (above) unexpectedly fails to reflect all the presets in the Serum 2 Presets folder. Under normal circumstances, you will never likely need to do this.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-browser-browser-folders-right-click-create-and-export-pack-url',
        productId: 'serum2',
        type: 'ui',
        command: 'Create and Export Pack...',
        keys: 'Right Click',
        context: 'Browser Folders',
        tags: [
            'power-feature'
        ],
        group: 'BROWSER',
        facets: [
            'Workflow',
            'Presets'
        ],
        note: 'Create and export a preset pack from a folder of presets. Right-click a folder and choose Create and Export Pack. A dialog will open allowing you to specify the pack information, such as: Name, Author, URL, Description, Artwork. Init disabled oscillators will reset disabled oscillators, removing associated parameters and samples.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-main-menu-operations',
        productId: 'serum2',
        type: 'ui',
        command: 'Main Menu Operations',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: 'Use the main menu to complete operations that affect overall performance and capabilities of Serum:'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-general',
        productId: 'serum2',
        type: 'ui',
        command: 'General',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: '• About: Display Serum release information. • Read the manual: Open the Serum 2 User Guide • Check for Updates...: Display if an update is available, with a link to the website.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-initialization',
        productId: 'serum2',
        type: 'ui',
        command: 'Initialization',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: '• Init Preset: Initialize Serum to start a new blank patch. • Init LFOs + LFO Mods: Initialize just the LFOs and LFO modulations. • Init Modulations: Initialize just the modulation assignments, leaving everything else untouched.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-presets',
        productId: 'serum2',
        type: 'ui',
        command: 'Presets',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: '• Load Preset: Manually browse and pick preset file. • Revert to Saved: After making changes to a preset, revert to the last saved version. • Save as Default Preset: Save the current preset as your default Serum 2 preset.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-import',
        productId: 'serum2',
        type: 'ui',
        command: 'Import',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: '• Import Preset Pack: Import a Serum preset pack file.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-rendering-warp',
        productId: 'serum2',
        type: 'ui',
        command: 'Rendering',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: '• Render OSC Warp > (OSC A, B or C): Use the current wavetable frame of the selected oscillator and create 256 frames spanning 0 to 100% of the WARP knob. • Resample to > (OSC A, B, C or A+B stereo) : Play a note of the preset for one bar and capture (render and import) the result as a wavetable in the selected oscillator.'
    },
    {
        kind: 'feature',
        id: 'serum2:power-menu-top-right-of-serum-2-left-click-mpe-mpe',
        productId: 'serum2',
        type: 'ui',
        command: 'MPE',
        keys: 'Left Click',
        context: 'Top Right of Serum 2',
        tags: [
            'power-feature'
        ],
        group: 'MENU',
        facets: [
            'Workflow',
            'Navigation'
        ],
        note: '• MPE Enabled*: Enable support for MIDI Polyphonic Expression (MPE). When enabled Serum responds to MPE messages allowing for more expressive and nuanced musical performances using compatible MPE controllers (i.e. Roli Seaboard). • Note Exp.: XYZ->Macro 1,2,3: Map the X, Y, and Z axes of an MPE-compatible controller to Serum macros 1, 2, and 3 respectively. • Note Exp.: YZ-> Macro 1,2: Map the X and Y axes of an MPE-compatible controller to Serum macros 1 and 2 respectively. • Note Exp.: Y-> Mod Wheel: Map the Y-axis movement of an MPE controller to the Modulation Wheel (Mod Wheel) control. • MPE Bend Range: 48: Pitch bend range for MPE controllers. Set to any value from 1 to 96 semitones. This option is only available when MPE Enabled is selected. *Note: Checkbox under Global MPE Settings to change the default.',
        default: 'OFF (ON when Global Checkbox setting is enabled)'
    }
];
