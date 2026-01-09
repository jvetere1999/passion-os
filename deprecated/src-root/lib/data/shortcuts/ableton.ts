import type { Shortcut } from "./types";

/**
 * Ableton Live 12 Suite keyboard shortcuts.
 * Source: Ableton Live 12 Reference Manual - Chapter 41: Live Keyboard Shortcuts
 *
 * Groups mirror the manual's section structure.
 * Facets provide cross-cutting categorization.
 */
export const abletonShortcuts: Shortcut[] = [
    // ============================================
    // 41.1 Showing and Hiding Views
    // ============================================
    {
        id: 'ableton12suite:toggle-fullscreen',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Full Screen Mode',
        description: 'Toggles Full Screen Mode on or off.',
        descriptionSource: 'https://www.ableton.com/en/manual/live-keyboard-shortcuts/',
        keys: '⌃⌘F',
        keysWin: 'F11',
        context: 'Global',
        tags: ['view', 'window', 'fullscreen'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-second-window',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Second Window',
        description: 'Toggles Second Window on or off.',
        descriptionSource: 'https://www.ableton.com/en/manual/live-keyboard-shortcuts/',
        keys: '⇧⌘W',
        keysWin: 'Ctrl+Shift+W',
        context: 'Global',
        tags: ['view', 'window', 'dual-monitor'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-session-arrangement',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Session/Arrangement View',
        description: 'Toggles Session/Arrangement View on or off.',
        descriptionSource: 'https://www.ableton.com/en/manual/live-keyboard-shortcuts/',
        keys: 'Tab',
        context: 'Global',
        tags: ['view', 'session', 'arrangement'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-device-clip-view',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Between Device/Clip View',
        keys: '⇧Tab',
        keysWin: 'Shift+Tab OR F12',
        context: 'Global',
        tags: ['view', 'device', 'clip'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-hotswap',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Hot-Swap Mode',
        keys: 'Q',
        context: 'Global',
        tags: ['browser', 'hotswap', 'device'],
        group: 'Showing and Hiding Views',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:toggle-drum-rack-pad',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Drum Rack/Last Selected Pad',
        keys: 'D',
        context: 'Drum Rack selected',
        tags: ['drum-rack', 'pad'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-info-view',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Info View',
        keys: '⇧?',
        keysWin: 'Shift+?',
        context: 'Global',
        tags: ['view', 'info', 'help'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-video-window',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Video Window',
        keys: '⌥⌘V',
        keysWin: 'Ctrl+Alt+V',
        context: 'Global',
        tags: ['view', 'video'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-browser',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Browser',
        keys: '⌥⌘B',
        keysWin: 'Ctrl+Alt+B',
        context: 'Global',
        tags: ['view', 'browser'],
        group: 'Showing and Hiding Views',
        facets: ['Browser', 'Navigation']
    },
    {
        id: 'ableton12suite:toggle-overview',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Overview',
        keys: '⌥⌘O',
        keysWin: 'Ctrl+Alt+O',
        context: 'Global',
        tags: ['view', 'overview'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-in-out',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show In/Out',
        keys: '⌥⌘I',
        keysWin: 'Ctrl+Alt+I',
        context: 'Global',
        tags: ['view', 'routing', 'io'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-sends',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Sends',
        keys: '⌥⌘S',
        keysWin: 'Ctrl+Alt+S',
        context: 'Global',
        tags: ['view', 'sends', 'mixer'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-mixer',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Mixer',
        keys: '⌥⌘M',
        keysWin: 'Ctrl+Alt+M',
        context: 'Global',
        tags: ['view', 'mixer'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-groove-pool',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show the Groove Pool',
        keys: '⌥⌘6',
        keysWin: 'Ctrl+Alt+6',
        context: 'Global',
        tags: ['view', 'groove'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:open-settings',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Open the Settings',
        keys: '⌘,',
        keysWin: 'Ctrl+,',
        context: 'Global',
        tags: ['settings', 'preferences'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:close-window',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Close Window/Dialog',
        keys: 'Esc',
        context: 'Global',
        tags: ['window', 'dialog', 'close'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },

    // ============================================
    // 41.2 Keyboard Focus and Navigation
    // ============================================
    {
        id: 'ableton12suite:focus-control-bar',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Control Bar',
        keys: '⌥0',
        keysWin: 'Alt+0',
        context: 'Global',
        tags: ['focus', 'control-bar'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-session-view',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Session View',
        keys: '⌥1',
        keysWin: 'Alt+1',
        context: 'Global',
        tags: ['focus', 'session'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-arrangement-view',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Arrangement View',
        keys: '⌥2',
        keysWin: 'Alt+2',
        context: 'Global',
        tags: ['focus', 'arrangement'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-clip-view',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Clip View',
        keys: '⌥3',
        keysWin: 'Alt+3',
        context: 'Global',
        tags: ['focus', 'clip'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-device-view',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Device View',
        keys: '⌥4',
        keysWin: 'Alt+4',
        context: 'Global',
        tags: ['focus', 'device'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-browser',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Browser',
        keys: '⌥5',
        keysWin: 'Alt+5',
        context: 'Global',
        tags: ['focus', 'browser'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation', 'Browser']
    },

    // ============================================
    // 41.3 Working with Sets and the Program
    // ============================================
    {
        id: 'ableton12suite:new-set',
        productId: 'ableton12suite',
        type: 'file',
        command: 'New Live Set',
        keys: '⌘N',
        keysWin: 'Ctrl+N',
        context: 'Global',
        tags: ['file', 'new', 'set'],
        group: 'Working with Sets and the Program',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:open-set',
        productId: 'ableton12suite',
        type: 'file',
        command: 'Open Live Set',
        keys: '⌘O',
        keysWin: 'Ctrl+O',
        context: 'Global',
        tags: ['file', 'open', 'set'],
        group: 'Working with Sets and the Program',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:save-set',
        productId: 'ableton12suite',
        type: 'file',
        command: 'Save Live Set',
        keys: '⌘S',
        keysWin: 'Ctrl+S',
        context: 'Global',
        tags: ['file', 'save', 'set'],
        group: 'Working with Sets and the Program',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:save-set-as',
        productId: 'ableton12suite',
        type: 'file',
        command: 'Save Live Set As…',
        keys: '⇧⌘S',
        keysWin: 'Ctrl+Shift+S',
        context: 'Global',
        tags: ['file', 'save', 'set'],
        group: 'Working with Sets and the Program',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:quit',
        productId: 'ableton12suite',
        type: 'file',
        command: 'Quit Live',
        keys: '⌘Q',
        keysWin: 'Ctrl+Q',
        context: 'Global',
        tags: ['quit', 'exit'],
        group: 'Working with Sets and the Program',
        facets: []
    },
    {
        id: 'ableton12suite:export-audio',
        productId: 'ableton12suite',
        type: 'file',
        command: 'Export Audio/Video',
        keys: '⇧⌘R',
        keysWin: 'Ctrl+Shift+R',
        context: 'Global',
        tags: ['export', 'render', 'audio', 'video'],
        group: 'Working with Sets and the Program',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:export-midi',
        productId: 'ableton12suite',
        type: 'file',
        command: 'Export MIDI File',
        keys: '⇧⌘E',
        keysWin: 'Ctrl+Shift+E',
        context: 'Global',
        tags: ['export', 'midi'],
        group: 'Working with Sets and the Program',
        facets: ['Editing', 'MIDI Control']
    },

    // ============================================
    // 41.4 Working with Devices and Plug-Ins
    // ============================================
    {
        id: 'ableton12suite:group-devices',
        productId: 'ableton12suite',
        type: 'device',
        command: 'Group Devices',
        keys: '⌘G',
        keysWin: 'Ctrl+G',
        context: 'Device Chain',
        tags: ['device', 'group', 'rack'],
        group: 'Working with Devices and Plug-Ins',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:ungroup-devices',
        productId: 'ableton12suite',
        type: 'device',
        command: 'Ungroup Devices',
        keys: '⇧⌘G',
        keysWin: 'Ctrl+Shift+G',
        context: 'Device Chain',
        tags: ['device', 'ungroup', 'rack'],
        group: 'Working with Devices and Plug-Ins',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:hotswap-device',
        productId: 'ableton12suite',
        type: 'device',
        command: 'Hot-Swap Selected Device',
        keys: 'Q',
        context: 'Device selected',
        tags: ['device', 'hotswap', 'browser'],
        group: 'Working with Devices and Plug-Ins',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:show-plugin-window',
        productId: 'ableton12suite',
        type: 'device',
        command: 'Show/Hide Plug-In Window',
        keys: '⌥⌘P',
        keysWin: 'Ctrl+Alt+P',
        context: 'Plug-in selected',
        tags: ['plugin', 'vst', 'window'],
        group: 'Working with Devices and Plug-Ins',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:compare-ab',
        productId: 'ableton12suite',
        type: 'device',
        command: 'Compare A/B: Switch Device State',
        keys: 'P',
        context: 'Device selected',
        tags: ['device', 'compare', 'ab'],
        group: 'Working with Devices and Plug-Ins',
        facets: ['Editing']
    },

    // ============================================
    // 41.5 Editing
    // ============================================
    {
        id: 'ableton12suite:cut',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Cut',
        keys: '⌘X',
        keysWin: 'Ctrl+X',
        context: 'Selection',
        tags: ['edit', 'cut', 'clipboard'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:copy',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Copy',
        keys: '⌘C',
        keysWin: 'Ctrl+C',
        context: 'Selection',
        tags: ['edit', 'copy', 'clipboard'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:paste',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Paste',
        keys: '⌘V',
        keysWin: 'Ctrl+V',
        context: 'Selection',
        tags: ['edit', 'paste', 'clipboard'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:duplicate',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Duplicate',
        keys: '⌘D',
        keysWin: 'Ctrl+D',
        context: 'Selection',
        tags: ['edit', 'duplicate'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:delete',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Delete',
        keys: 'Delete',
        context: 'Selection',
        tags: ['edit', 'delete'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:undo',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Undo',
        keys: '⌘Z',
        keysWin: 'Ctrl+Z',
        context: 'Global',
        tags: ['edit', 'undo', 'history'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:redo',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Redo',
        keys: '⇧⌘Z',
        keysWin: 'Ctrl+Y',
        context: 'Global',
        tags: ['edit', 'redo', 'history'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:rename',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Rename',
        keys: '⌘R',
        keysWin: 'Ctrl+R',
        context: 'Selection',
        tags: ['edit', 'rename'],
        group: 'Editing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:select-all',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Select All',
        keys: '⌘A',
        keysWin: 'Ctrl+A',
        context: 'Current focus',
        tags: ['edit', 'select'],
        group: 'Editing',
        facets: ['Editing']
    },

    // ============================================
    // 41.7 Commands for Breakpoint Envelopes
    // ============================================
    {
        id: 'ableton12suite:toggle-automation',
        productId: 'ableton12suite',
        type: 'automation',
        command: 'Toggle Automation Mode',
        keys: 'A',
        context: 'Arrangement View',
        tags: ['automation', 'envelope'],
        group: 'Breakpoint Envelopes',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:toggle-fade-controls',
        productId: 'ableton12suite',
        type: 'automation',
        command: 'Momentarily Toggle Fade Controls',
        keys: 'F',
        context: 'Arrangement View',
        tags: ['fade', 'crossfade'],
        group: 'Breakpoint Envelopes',
        facets: ['Editing']
    },

    // ============================================
    // 41.9 Zooming, Display and Selections
    // ============================================
    {
        id: 'ableton12suite:zoom-in',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom In Window',
        keys: '⌘+',
        keysWin: 'Ctrl++',
        context: 'Global',
        tags: ['zoom', 'view'],
        group: 'Zooming, Display and Selections',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:zoom-out',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom Out Window',
        keys: '⌘-',
        keysWin: 'Ctrl+-',
        context: 'Global',
        tags: ['zoom', 'view'],
        group: 'Zooming, Display and Selections',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:follow-playback',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Scroll Display to Follow Playback',
        keys: '⌥⇧F',
        keysWin: 'Ctrl+Shift+F',
        context: 'Arrangement/Clip View',
        tags: ['scroll', 'follow', 'playback'],
        group: 'Zooming, Display and Selections',
        facets: ['Navigation', 'Transport']
    },

    // ============================================
    // 41.12 Clip View MIDI Note Editor
    // ============================================
    {
        id: 'ableton12suite:quantize',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Quantize',
        keys: '⌘U',
        keysWin: 'Ctrl+U',
        context: 'MIDI Clip Editor',
        tags: ['quantize', 'midi', 'timing'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:quantize-settings',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Quantize Settings…',
        keys: '⇧⌘U',
        keysWin: 'Ctrl+Shift+U',
        context: 'MIDI Clip Editor',
        tags: ['quantize', 'midi', 'settings'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:chop-notes',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Chop Selected Notes on Grid',
        keys: '⌘E',
        keysWin: 'Ctrl+E',
        context: 'MIDI Clip Editor',
        tags: ['chop', 'split', 'midi', 'notes'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:join-notes',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Join Notes',
        keys: '⌘J',
        keysWin: 'Ctrl+J',
        context: 'MIDI Clip Editor',
        tags: ['join', 'merge', 'midi', 'notes'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:highlight-scale',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Highlight Scale',
        keys: 'K',
        context: 'MIDI Clip Editor',
        tags: ['scale', 'midi', 'piano-roll'],
        group: 'MIDI Note Editor',
        facets: ['Navigation', 'MIDI Control']
    },

    // ============================================
    // 41.13 Grid Snapping and Drawing
    // ============================================
    {
        id: 'ableton12suite:toggle-draw-mode',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Toggle Draw Mode',
        keys: 'B',
        context: 'MIDI/Automation Editor',
        tags: ['draw', 'pencil', 'midi'],
        group: 'Grid Snapping and Drawing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:narrow-grid',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Narrow Grid',
        keys: '⌘1',
        keysWin: 'Ctrl+1',
        context: 'Editor',
        tags: ['grid', 'snap'],
        group: 'Grid Snapping and Drawing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:widen-grid',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Widen Grid',
        keys: '⌘2',
        keysWin: 'Ctrl+2',
        context: 'Editor',
        tags: ['grid', 'snap'],
        group: 'Grid Snapping and Drawing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:triplet-grid',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Triplet Grid',
        keys: '⌘3',
        keysWin: 'Ctrl+3',
        context: 'Editor',
        tags: ['grid', 'triplet'],
        group: 'Grid Snapping and Drawing',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:snap-to-grid',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Snap to Grid',
        keys: '⌘4',
        keysWin: 'Ctrl+4',
        context: 'Editor',
        tags: ['grid', 'snap'],
        group: 'Grid Snapping and Drawing',
        facets: ['Editing']
    },

    // ============================================
    // 41.15 Session View
    // ============================================
    {
        id: 'ableton12suite:launch-clip',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Launch Selected Clip/Slot',
        keys: 'Enter',
        context: 'Session View',
        tags: ['launch', 'clip', 'session'],
        group: 'Session View',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:insert-midi-clip',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert MIDI Clip',
        keys: '⇧⌘M',
        keysWin: 'Ctrl+Shift+M',
        context: 'Session View',
        tags: ['midi', 'clip', 'insert'],
        group: 'Session View',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:insert-scene',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert Scene',
        keys: '⌘I',
        keysWin: 'Ctrl+I',
        context: 'Session View',
        tags: ['scene', 'insert', 'session'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:capture-midi',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Capture MIDI',
        keys: '⇧⌘C',
        keysWin: 'Ctrl+Shift+C',
        context: 'Global',
        tags: ['capture', 'midi', 'recording'],
        group: 'Session View',
        facets: ['Transport', 'MIDI Control']
    },

    // ============================================
    // 41.16 Arrangement View
    // ============================================
    {
        id: 'ableton12suite:split-clip',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Split Clip at Selection',
        keys: '⌘E',
        keysWin: 'Ctrl+E',
        context: 'Arrangement View',
        tags: ['split', 'clip', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:consolidate',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Consolidate Selection into Clip',
        keys: '⌘J',
        keysWin: 'Ctrl+J',
        context: 'Arrangement View',
        tags: ['consolidate', 'clip', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:crop-clips',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Crop Selected Clips',
        keys: '⇧⌘J',
        keysWin: 'Ctrl+Shift+J',
        context: 'Arrangement View',
        tags: ['crop', 'clip', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:create-fade',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Create Fade/Crossfade',
        keys: '⌥⌘F',
        keysWin: 'Ctrl+Alt+F',
        context: 'Arrangement View',
        tags: ['fade', 'crossfade', 'audio'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:toggle-loop',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Toggle Loop Brace',
        keys: '⌘L',
        keysWin: 'Ctrl+L',
        context: 'Arrangement View',
        tags: ['loop', 'transport'],
        group: 'Arrangement View',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:insert-silence',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert Silence',
        keys: '⌘I',
        keysWin: 'Ctrl+I',
        context: 'Arrangement View',
        tags: ['silence', 'insert', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:cut-time',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Cut Time',
        keys: '⇧⌘X',
        keysWin: 'Ctrl+Shift+X',
        context: 'Arrangement View',
        tags: ['cut', 'time', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:paste-time',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Paste Time',
        keys: '⇧⌘V',
        keysWin: 'Ctrl+Shift+V',
        context: 'Arrangement View',
        tags: ['paste', 'time', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:duplicate-time',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Duplicate Time',
        keys: '⇧⌘D',
        keysWin: 'Ctrl+Shift+D',
        context: 'Arrangement View',
        tags: ['duplicate', 'time', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:reverse-clip',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Reverse Audio Clip Selection',
        keys: 'R',
        context: 'Arrangement View - Audio Clip',
        tags: ['reverse', 'audio', 'clip'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:zoom-to-selection',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom to Arrangement Time Selection',
        keys: 'Z',
        context: 'Arrangement View',
        tags: ['zoom', 'selection'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:zoom-back',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom Back from Arrangement Time Selection',
        keys: 'X',
        context: 'Arrangement View',
        tags: ['zoom', 'back'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },

    // ============================================
    // 41.19 Commands for Tracks
    // ============================================
    {
        id: 'ableton12suite:insert-audio-track',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Insert Audio Track',
        keys: '⌘T',
        keysWin: 'Ctrl+T',
        context: 'Global',
        tags: ['track', 'audio', 'insert'],
        group: 'Commands for Tracks',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:insert-midi-track',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Insert MIDI Track',
        keys: '⇧⌘T',
        keysWin: 'Ctrl+Shift+T',
        context: 'Global',
        tags: ['track', 'midi', 'insert'],
        group: 'Commands for Tracks',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:insert-return-track',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Insert Return Track',
        keys: '⌥⌘T',
        keysWin: 'Ctrl+Alt+T',
        context: 'Global',
        tags: ['track', 'return', 'send', 'insert'],
        group: 'Commands for Tracks',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:group-tracks',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Group Selected Tracks',
        keys: '⌘G',
        keysWin: 'Ctrl+G',
        context: 'Track selection',
        tags: ['track', 'group'],
        group: 'Commands for Tracks',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:ungroup-tracks',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Ungroup Tracks',
        keys: '⇧⌘G',
        keysWin: 'Ctrl+Shift+G',
        context: 'Group Track',
        tags: ['track', 'ungroup'],
        group: 'Commands for Tracks',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:arm-track',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Arm Selected Tracks',
        keys: 'C',
        context: 'Track selection',
        tags: ['track', 'arm', 'record'],
        group: 'Commands for Tracks',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:solo-track',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Solo Selected Tracks',
        keys: 'S',
        context: 'Track selection',
        tags: ['track', 'solo', 'mixer'],
        group: 'Commands for Tracks',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:freeze-track',
        productId: 'ableton12suite',
        type: 'track',
        command: 'Freeze/Unfreeze Tracks',
        keys: '⌥⇧⌘F',
        keysWin: 'Ctrl+Alt+Shift+F',
        context: 'Track selection',
        tags: ['track', 'freeze', 'cpu'],
        group: 'Commands for Tracks',
        facets: ['Editing']
    },

    // ============================================
    // 41.20 Transport
    // ============================================
    {
        id: 'ableton12suite:play-stop',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Play from Start Marker/Stop',
        keys: 'Space',
        context: 'Global',
        tags: ['play', 'stop', 'transport'],
        group: 'Transport',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:continue-play',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Continue Play from Stop Point',
        keys: '⇧Space',
        keysWin: 'Shift+Space',
        context: 'Global',
        tags: ['play', 'continue', 'transport'],
        group: 'Transport',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:record',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Record',
        keys: 'F9',
        context: 'Global',
        tags: ['record', 'transport'],
        group: 'Transport',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:back-to-arrangement',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Back to Arrangement',
        keys: 'F10',
        context: 'Global',
        tags: ['arrangement', 'transport'],
        group: 'Transport',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:toggle-metronome',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Toggle Metronome',
        keys: 'O',
        context: 'Global',
        tags: ['metronome', 'click', 'tempo'],
        group: 'Transport',
        facets: ['Transport']
    },

    // ============================================
    // 41.22 Browser
    // ============================================
    {
        id: 'ableton12suite:search-browser',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Search in Browser',
        keys: '⌘F',
        keysWin: 'Ctrl+F',
        context: 'Browser',
        tags: ['search', 'browser', 'find'],
        group: 'Browser',
        facets: ['Browser', 'Navigation']
    },
    {
        id: 'ableton12suite:preview-file',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Preview Selected File',
        keys: '⇧Enter',
        keysWin: 'Shift+Enter',
        context: 'Browser',
        tags: ['preview', 'browser', 'audition'],
        group: 'Browser',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:browser-history-back',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Browser History Back',
        keys: '⌘[',
        keysWin: 'Ctrl+[',
        context: 'Browser',
        tags: ['browser', 'history', 'back'],
        group: 'Browser',
        facets: ['Browser', 'Navigation']
    },
    {
        id: 'ableton12suite:browser-history-forward',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Browser History Forward',
        keys: '⌘]',
        keysWin: 'Ctrl+]',
        context: 'Browser',
        tags: ['browser', 'history', 'forward'],
        group: 'Browser',
        facets: ['Browser', 'Navigation']
    },

    // ============================================
    // 41.24 Key/MIDI Map Mode
    // ============================================
    {
        id: 'ableton12suite:toggle-midi-map',
        productId: 'ableton12suite',
        type: 'mapping',
        command: 'Toggle MIDI Map Mode',
        keys: '⌘M',
        keysWin: 'Ctrl+M',
        context: 'Global',
        tags: ['midi', 'map', 'controller'],
        group: 'Key/MIDI Map Mode',
        facets: ['MIDI Control']
    },
    {
        id: 'ableton12suite:toggle-key-map',
        productId: 'ableton12suite',
        type: 'mapping',
        command: 'Toggle Key Map Mode',
        keys: '⌘K',
        keysWin: 'Ctrl+K',
        context: 'Global',
        tags: ['key', 'map', 'keyboard'],
        group: 'Key/MIDI Map Mode',
        facets: ['MIDI Control']
    },
    {
        id: 'ableton12suite:computer-midi-keyboard',
        productId: 'ableton12suite',
        type: 'mapping',
        command: 'Computer MIDI Keyboard (toggle)',
        keys: 'M',
        context: 'Global',
        tags: ['midi', 'keyboard', 'computer'],
        group: 'Key/MIDI Map Mode',
        facets: ['MIDI Control']
    },

    // ============================================
    // Missing from 41.2 Keyboard Focus and Navigation
    // ============================================
    {
        id: 'ableton12suite:focus-groove-pool',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Groove Pool',
        keys: '⌥6',
        keysWin: 'Alt+6',
        context: 'Global',
        tags: ['focus', 'groove'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-help-view',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Help View',
        keys: '⌥7',
        keysWin: 'Alt+7',
        context: 'Global',
        tags: ['focus', 'help'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:focus-clip-panel',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to the Selected Clip Panel',
        keys: '⌥8',
        keysWin: 'Alt+8',
        context: 'Global',
        tags: ['focus', 'clip'],
        group: 'Keyboard Focus and Navigation',
        facets: ['Navigation']
    },

    // ============================================
    // Missing from 41.6 Adjusting Values
    // ============================================
    {
        id: 'ableton12suite:increment-decrement',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Decrement/Increment',
        keys: '↑/↓',
        keysWin: 'Up/Down Arrow',
        context: 'Value field selected',
        tags: ['value', 'adjust'],
        group: 'Adjusting Values',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:fine-adjust',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Decrement/Increment in Octaves or Fine Adjustments',
        keys: '⇧↑/↓',
        keysWin: 'Shift+Up/Down Arrow',
        context: 'Value field selected',
        tags: ['value', 'fine', 'octave'],
        group: 'Adjusting Values',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:confirm-value',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Confirm Value Entry',
        keys: 'Enter',
        context: 'Value field',
        tags: ['value', 'confirm'],
        group: 'Adjusting Values',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:cancel-value',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Cancel Value Entry',
        keys: 'Esc',
        context: 'Value field',
        tags: ['value', 'cancel'],
        group: 'Adjusting Values',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.7 Breakpoint Envelopes
    // ============================================
    {
        id: 'ableton12suite:create-curved-automation',
        productId: 'ableton12suite',
        type: 'automation',
        command: 'Create Curved Automation Segment',
        keys: 'Hold ⌥',
        keysWin: 'Hold Alt',
        context: 'Automation lane',
        tags: ['automation', 'curve', 'envelope'],
        group: 'Breakpoint Envelopes',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:delete-envelope',
        productId: 'ableton12suite',
        type: 'automation',
        command: 'Delete Selected Breakpoint Envelope',
        keys: '⌘Delete',
        keysWin: 'Ctrl+Delete',
        context: 'Automation lane',
        tags: ['automation', 'delete', 'envelope'],
        group: 'Breakpoint Envelopes',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.8 Loop Brace and Markers
    // ============================================
    {
        id: 'ableton12suite:set-start-marker',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Set Start Marker',
        keys: '⌘F9',
        keysWin: 'Ctrl+F9',
        context: 'Arrangement View',
        tags: ['marker', 'start', 'transport'],
        group: 'Loop Brace and Markers',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:set-loop-start',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Set Loop Brace Start',
        keys: '⌘F10',
        keysWin: 'Ctrl+F10',
        context: 'Arrangement View',
        tags: ['loop', 'start'],
        group: 'Loop Brace and Markers',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:set-loop-end',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Set Loop Brace End',
        keys: '⌘F11',
        keysWin: 'Ctrl+F11',
        context: 'Arrangement View',
        tags: ['loop', 'end'],
        group: 'Loop Brace and Markers',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:set-end-marker',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Set End Marker',
        keys: '⌘F12',
        keysWin: 'Ctrl+F12',
        context: 'Arrangement View',
        tags: ['marker', 'end', 'transport'],
        group: 'Loop Brace and Markers',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:select-loop-contents',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Select Material in Loop',
        keys: '⇧⌘L',
        keysWin: 'Ctrl+Shift+L',
        context: 'Arrangement View',
        tags: ['loop', 'select'],
        group: 'Loop Brace and Markers',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.9 Zooming, Display and Selections
    // ============================================
    {
        id: 'ableton12suite:zoom-in-time',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom In Time Ruler',
        keys: '+',
        context: 'Arrangement/Clip View',
        tags: ['zoom', 'time'],
        group: 'Zooming, Display and Selections',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:zoom-out-time',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom Out Time Ruler',
        keys: '-',
        context: 'Arrangement/Clip View',
        tags: ['zoom', 'time'],
        group: 'Zooming, Display and Selections',
        facets: ['Navigation']
    },

    // ============================================
    // Missing from 41.10 Clip View Editor Modes
    // ============================================
    {
        id: 'ableton12suite:switch-sample-envelopes',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Switch Between Sample/Envelopes Tabs',
        keys: '⌥Tab',
        keysWin: 'Ctrl+Tab',
        context: 'Clip View',
        tags: ['clip', 'sample', 'envelope', 'tab'],
        group: 'Clip View Editor Modes',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:switch-to-sample-tab',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Switch to Sample/Notes Tab',
        keys: '⌥⇧1',
        keysWin: 'Alt+Shift+1',
        context: 'Clip View',
        tags: ['clip', 'sample', 'notes', 'tab'],
        group: 'Clip View Editor Modes',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:switch-to-envelopes-tab',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Switch to Envelopes Tab',
        keys: '⌥⇧2',
        keysWin: 'Alt+Shift+2',
        context: 'Clip View',
        tags: ['clip', 'envelope', 'tab'],
        group: 'Clip View Editor Modes',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:switch-to-mpe-tab',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Switch to MPE Tab',
        keys: '⌥⇧3',
        keysWin: 'Alt+Shift+3',
        context: 'Clip View',
        tags: ['clip', 'mpe', 'tab'],
        group: 'Clip View Editor Modes',
        facets: ['Navigation', 'MIDI Control']
    },

    // ============================================
    // Missing from 41.11 Sample Editor
    // ============================================
    {
        id: 'ableton12suite:insert-warp-marker',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert Warp Marker',
        keys: '⌘I',
        keysWin: 'Ctrl+I',
        context: 'Sample Editor',
        tags: ['warp', 'marker', 'audio'],
        group: 'Sample Editor',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:delete-warp-marker',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Delete Warp Marker',
        keys: 'Delete',
        context: 'Sample Editor - Warp Marker selected',
        tags: ['warp', 'marker', 'delete'],
        group: 'Sample Editor',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:insert-transient',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert Transient',
        keys: '⇧⌘I',
        keysWin: 'Ctrl+Shift+I',
        context: 'Sample Editor',
        tags: ['transient', 'audio'],
        group: 'Sample Editor',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:delete-transient',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Delete Transient',
        keys: '⇧⌘Delete',
        keysWin: 'Ctrl+Shift+Delete',
        context: 'Sample Editor',
        tags: ['transient', 'delete'],
        group: 'Sample Editor',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:fit-width',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Fit Content to View Width',
        keys: 'W',
        context: 'Clip View',
        tags: ['zoom', 'fit', 'width'],
        group: 'Sample Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:fit-height',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Fit Content to View Height',
        keys: 'H',
        context: 'Clip View',
        tags: ['zoom', 'fit', 'height'],
        group: 'Sample Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:zoom-clip-selection',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom to Clip Selection',
        keys: 'Z',
        context: 'Clip View',
        tags: ['zoom', 'clip', 'selection'],
        group: 'Sample Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:zoom-back-clip',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Zoom Back from Clip Selection',
        keys: 'X',
        context: 'Clip View',
        tags: ['zoom', 'back', 'clip'],
        group: 'Sample Editor',
        facets: ['Navigation']
    },

    // ============================================
    // Missing from 41.12 MIDI Note Editor
    // ============================================
    {
        id: 'ableton12suite:select-all-notes',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Select All Notes',
        keys: '⌘A',
        keysWin: 'Ctrl+A',
        context: 'MIDI Clip Editor',
        tags: ['select', 'notes', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:fit-notes-time',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Fit Notes to Time Range',
        keys: '⌥⌘J',
        keysWin: 'Ctrl+Alt+J',
        context: 'MIDI Clip Editor',
        tags: ['fit', 'notes', 'time', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:adjust-velocity',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Adjust Note Selection Velocity',
        keys: '⌘↑/↓',
        keysWin: 'Ctrl+Up/Down Arrow',
        context: 'MIDI Clip Editor',
        tags: ['velocity', 'midi', 'notes'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:adjust-velocity-deviation',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Adjust Note Selection Velocity Deviation',
        keys: '⇧⌘↑/↓',
        keysWin: 'Ctrl+Shift+Up/Down Arrow',
        context: 'MIDI Clip Editor',
        tags: ['velocity', 'deviation', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:adjust-chance',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Adjust Note Selection Chance',
        keys: '⌥⌘↑/↓',
        keysWin: 'Ctrl+Alt+Up/Down Arrow',
        context: 'MIDI Clip Editor',
        tags: ['chance', 'probability', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:toggle-fullsize-clip',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Toggle Full-Size Clip View',
        keys: '⌥⌘E',
        keysWin: 'Ctrl+Alt+E',
        context: 'Clip View',
        tags: ['fullsize', 'clip', 'view'],
        group: 'MIDI Note Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:group-notes',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Group Notes (Play All)',
        keys: '⌘G',
        keysWin: 'Ctrl+G',
        context: 'MIDI Clip Editor',
        tags: ['group', 'notes', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:ungroup-notes',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Ungroup Notes',
        keys: '⇧⌘G',
        keysWin: 'Ctrl+Shift+G',
        context: 'MIDI Clip Editor',
        tags: ['ungroup', 'notes', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:invert-selection',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Invert Note Selection',
        keys: '⇧⌘A',
        keysWin: 'Ctrl+Shift+A',
        context: 'MIDI Clip Editor',
        tags: ['invert', 'select', 'notes', 'midi'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:show-midi-filters',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Show/Hide MIDI Note Filters',
        keys: '⇧⌘F',
        keysWin: 'Ctrl+Shift+F',
        context: 'MIDI Clip Editor',
        tags: ['filter', 'midi', 'notes'],
        group: 'MIDI Note Editor',
        facets: ['Navigation', 'MIDI Control']
    },

    // ============================================
    // Missing from 41.13 Grid Snapping and Drawing
    // ============================================
    {
        id: 'ableton12suite:fixed-adaptive-grid',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Fixed/Zoom-Adaptive Grid',
        keys: '⌘5',
        keysWin: 'Ctrl+5',
        context: 'Editor',
        tags: ['grid', 'adaptive', 'fixed'],
        group: 'Grid Snapping and Drawing',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.14 Global Quantization
    // ============================================
    {
        id: 'ableton12suite:quantize-16th',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Sixteenth-Note Quantization',
        keys: '⌘6',
        keysWin: 'Ctrl+6',
        context: 'Global',
        tags: ['quantize', 'global', '16th'],
        group: 'Global Quantization',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:quantize-8th',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Eighth-Note Quantization',
        keys: '⌘7',
        keysWin: 'Ctrl+7',
        context: 'Global',
        tags: ['quantize', 'global', '8th'],
        group: 'Global Quantization',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:quantize-quarter',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Quarter-Note Quantization',
        keys: '⌘8',
        keysWin: 'Ctrl+8',
        context: 'Global',
        tags: ['quantize', 'global', 'quarter'],
        group: 'Global Quantization',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:quantize-bar',
        productId: 'ableton12suite',
        type: 'transport',
        command: '1-Bar Quantization',
        keys: '⌘9',
        keysWin: 'Ctrl+9',
        context: 'Global',
        tags: ['quantize', 'global', 'bar'],
        group: 'Global Quantization',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:quantize-off',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Quantization Off',
        keys: '⌘0',
        keysWin: 'Ctrl+0',
        context: 'Global',
        tags: ['quantize', 'global', 'off'],
        group: 'Global Quantization',
        facets: ['Transport']
    },

    // ============================================
    // Missing from 41.15 Session View
    // ============================================
    {
        id: 'ableton12suite:stop-clips-track',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Stop Clips in Track with Slot Selection',
        keys: '⌘Enter',
        keysWin: 'Ctrl+Enter',
        context: 'Session View',
        tags: ['stop', 'clip', 'session'],
        group: 'Session View',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:insert-captured-scene',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert Captured Scene',
        keys: '⇧⌘I',
        keysWin: 'Ctrl+Shift+I',
        context: 'Session View',
        tags: ['scene', 'capture', 'insert'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:record-session',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Record to Session View',
        keys: '⇧⌘F9',
        keysWin: 'Ctrl+Shift+F9',
        context: 'Session View',
        tags: ['record', 'session'],
        group: 'Session View',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:toggle-follow-actions',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Toggle Follow Actions for Selected Clips',
        keys: '⇧Enter',
        keysWin: 'Shift+Enter',
        context: 'Session View',
        tags: ['follow', 'action', 'clip'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:create-follow-chain',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Create Follow Action Chain',
        keys: '⇧⌘Enter',
        keysWin: 'Ctrl+Shift+Enter',
        context: 'Session View',
        tags: ['follow', 'action', 'chain'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:deactivate-clip',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Deactivate Selected Clip',
        keys: '0',
        context: 'Session View',
        tags: ['deactivate', 'clip'],
        group: 'Session View',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.16 Arrangement View
    // ============================================
    {
        id: 'ableton12suite:delete-fades',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Delete Fades/Crossfades in Selected Clip(s)',
        keys: '⌥⌘Delete',
        keysWin: 'Ctrl+Alt+Backspace',
        context: 'Arrangement View',
        tags: ['fade', 'delete', 'crossfade'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:select-loop-contents-arr',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Select Loop Brace Contents',
        keys: '⇧⌘L',
        keysWin: 'Ctrl+Shift+L',
        context: 'Arrangement View',
        tags: ['loop', 'select'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:delete-time',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Delete Time',
        keys: '⇧⌘Delete',
        keysWin: 'Ctrl+Shift+Delete',
        context: 'Arrangement View',
        tags: ['delete', 'time', 'arrangement'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:fold-tracks',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Fold/Unfold Selected Tracks',
        keys: 'U',
        context: 'Arrangement View',
        tags: ['fold', 'unfold', 'track'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:unfold-all-tracks',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Unfold All Tracks',
        keys: '⌥U',
        keysWin: 'Alt+U',
        context: 'Arrangement View',
        tags: ['unfold', 'all', 'track'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:optimize-height',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Optimize Arrangement Height',
        keys: 'H',
        context: 'Arrangement View',
        tags: ['optimize', 'height', 'view'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:optimize-width',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Optimize Arrangement Width',
        keys: 'W',
        context: 'Arrangement View',
        tags: ['optimize', 'width', 'view'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:deactivate-selection',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Deactivate Selection',
        keys: '0',
        context: 'Arrangement View',
        tags: ['deactivate', 'selection'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:play-from-insert',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Play from Insert Marker in Selected Clip',
        keys: '⌥Space',
        keysWin: 'Ctrl+Space',
        context: 'Arrangement View',
        tags: ['play', 'insert', 'marker'],
        group: 'Arrangement View',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:move-insert-to-playhead',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Move Insert Marker to Playhead Position',
        keys: '⇧⌘Space',
        keysWin: 'Ctrl+Shift+Space',
        context: 'Arrangement View',
        tags: ['insert', 'marker', 'playhead'],
        group: 'Arrangement View',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:focus-mixer',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Focus to Mixer',
        keys: '⌥⇧M',
        keysWin: 'Alt+Shift+M',
        context: 'Arrangement View',
        tags: ['focus', 'mixer'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },

    // ============================================
    // Missing from 41.17 Comping
    // ============================================
    {
        id: 'ableton12suite:show-take-lanes',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Show Take Lanes',
        keys: '⌥⌘U',
        keysWin: 'Ctrl+Alt+U',
        context: 'Arrangement View',
        tags: ['comping', 'take', 'lanes'],
        group: 'Comping',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:audition-take',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Audition Selected Take Lane',
        keys: 'T',
        context: 'Comping - Take lane selected',
        tags: ['comping', 'audition', 'take'],
        group: 'Comping',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:add-take-lane',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Add Take Lane',
        keys: '⌥⇧T',
        keysWin: 'Shift+Alt+T',
        context: 'Arrangement View',
        tags: ['comping', 'take', 'lane', 'add'],
        group: 'Comping',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.18 Bounce to Audio
    // ============================================
    {
        id: 'ableton12suite:bounce-to-track',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Bounce to New Track',
        keys: '⌘B',
        keysWin: 'Ctrl+B',
        context: 'Selection',
        tags: ['bounce', 'render', 'audio'],
        group: 'Bounce to Audio',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:paste-bounced',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Paste Bounced Audio',
        keys: '⌥⌘V',
        keysWin: 'Ctrl+Alt+V',
        context: 'Arrangement View',
        tags: ['paste', 'bounce', 'audio'],
        group: 'Bounce to Audio',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.19 Tracks
    // ============================================
    {
        id: 'ableton12suite:show-grouped-tracks',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Show Grouped Tracks',
        keys: '+',
        context: 'Group Track',
        tags: ['group', 'show', 'expand'],
        group: 'Commands for Tracks',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:hide-grouped-tracks',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide Grouped Tracks',
        keys: '-',
        context: 'Group Track',
        tags: ['group', 'hide', 'collapse'],
        group: 'Commands for Tracks',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:collapse-expand-group',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Collapse/Expand Grouped Tracks',
        keys: 'U',
        context: 'Group Track',
        tags: ['group', 'collapse', 'expand'],
        group: 'Commands for Tracks',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:deactivate-track',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Deactivate Selected Track',
        keys: '0',
        context: 'Track selection',
        tags: ['track', 'deactivate'],
        group: 'Commands for Tracks',
        facets: ['Editing']
    },

    // ============================================
    // Missing from 41.20 Transport
    // ============================================
    {
        id: 'ableton12suite:stop-at-selection-end',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Stop Playback at End of Selection',
        keys: '⌥Space',
        keysWin: 'Ctrl+Space',
        context: 'Global',
        tags: ['stop', 'selection', 'transport'],
        group: 'Transport',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:move-to-beginning',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Move Insert Marker to Beginning',
        keys: 'Home',
        context: 'Global',
        tags: ['home', 'beginning', 'marker'],
        group: 'Transport',
        facets: ['Transport', 'Navigation']
    },
    {
        id: 'ableton12suite:arm-arrangement',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Arm Recording in Arrangement View',
        keys: '⇧F9',
        keysWin: 'Shift+F9',
        context: 'Global',
        tags: ['arm', 'record', 'arrangement'],
        group: 'Transport',
        facets: ['Transport']
    },

    // ============================================
    // Missing from 41.21 Audio Engine
    // ============================================
    {
        id: 'ableton12suite:toggle-audio-engine',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Turn Audio Engine On/Off',
        keys: '⌥⇧⌘E',
        keysWin: 'Ctrl+Alt+Shift+E',
        context: 'Global',
        tags: ['audio', 'engine', 'cpu'],
        group: 'Audio Engine',
        facets: ['Transport']
    },

    // ============================================
    // Missing from 41.22 Browser
    // ============================================
    {
        id: 'ableton12suite:load-browser-item',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Load Selected Item from Browser',
        keys: 'Enter',
        context: 'Browser',
        tags: ['load', 'browser'],
        group: 'Browser',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:similarity-search',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Show Similar Files Using Similarity Search',
        keys: '⇧⌘F',
        keysWin: 'Ctrl+Shift+F',
        context: 'Browser',
        tags: ['similarity', 'search', 'browser'],
        group: 'Browser',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:toggle-filter-view',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Hide/Show Filter View',
        keys: '⌥⌘G',
        keysWin: 'Ctrl+Alt+G',
        context: 'Browser',
        tags: ['filter', 'browser'],
        group: 'Browser',
        facets: ['Browser', 'Navigation']
    },
    {
        id: 'ableton12suite:toggle-tag-editor',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Hide/Show Tag Editor',
        keys: '⇧⌘E',
        keysWin: 'Ctrl+Shift+E',
        context: 'Browser',
        tags: ['tag', 'editor', 'browser'],
        group: 'Browser',
        facets: ['Browser']
    },

    // ============================================
    // Missing from 41.23 Similar Sample Swapping
    // ============================================
    {
        id: 'ableton12suite:swap-next-sample',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Swap to Next Similar Sample',
        keys: '⌘→',
        keysWin: 'Ctrl+Right Arrow',
        context: 'Drum Rack/Simpler',
        tags: ['swap', 'sample', 'similar'],
        group: 'Similar Sample Swapping',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:swap-prev-sample',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Swap to Previous Similar Sample',
        keys: '⌘←',
        keysWin: 'Ctrl+Left Arrow',
        context: 'Drum Rack/Simpler',
        tags: ['swap', 'sample', 'similar'],
        group: 'Similar Sample Swapping',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:save-similarity-ref',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Save as Similarity Reference',
        keys: '⌘↑',
        keysWin: 'Ctrl+Up Arrow',
        context: 'Drum Rack/Simpler',
        tags: ['similarity', 'reference', 'sample'],
        group: 'Similar Sample Swapping',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:return-to-reference',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Return to Reference',
        keys: '⌘↓',
        keysWin: 'Ctrl+Down Arrow',
        context: 'Drum Rack/Simpler',
        tags: ['similarity', 'reference', 'return'],
        group: 'Similar Sample Swapping',
        facets: ['Browser']
    },

    // ============================================
    // Missing from 41.24 Key/MIDI Map Mode
    // ============================================
    {
        id: 'ableton12suite:midi-keyboard-octave',
        productId: 'ableton12suite',
        type: 'mapping',
        command: 'Adjust Computer MIDI Keyboard Octave Range Up/Down',
        keys: 'X / Z',
        context: 'Computer MIDI Keyboard active',
        tags: ['midi', 'keyboard', 'octave'],
        group: 'Key/MIDI Map Mode',
        facets: ['MIDI Control']
    },
    {
        id: 'ableton12suite:midi-keyboard-velocity',
        productId: 'ableton12suite',
        type: 'mapping',
        command: 'Adjust Computer MIDI Keyboard Incoming Note Velocity Up/Down',
        keys: 'C / V',
        context: 'Computer MIDI Keyboard active',
        tags: ['midi', 'keyboard', 'velocity'],
        group: 'Key/MIDI Map Mode',
        facets: ['MIDI Control']
    },

    // ============================================
    // Missing from 41.1 - Additional View Shortcuts
    // ============================================
    {
        id: 'ableton12suite:toggle-clip-view',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Clip View',
        keys: '⌥⌘3',
        keysWin: 'Ctrl+Alt+3',
        context: 'Global',
        tags: ['view', 'clip'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:toggle-device-view',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide/Show Device View',
        keys: '⌥⌘4',
        keysWin: 'Ctrl+Alt+4',
        context: 'Global',
        tags: ['view', 'device'],
        group: 'Showing and Hiding Views',
        facets: ['Navigation']
    },

    // ============================================
    // Additional Missing Essential Shortcuts
    // ============================================
    {
        id: 'ableton12suite:activate-track-1-8',
        productId: 'ableton12suite',
        type: 'transport',
        command: 'Activate/Deactivate Track 1…8',
        keys: 'F1…F8',
        context: 'Global',
        tags: ['track', 'activate', 'function-keys'],
        group: 'Transport',
        facets: ['Transport']
    },
    {
        id: 'ableton12suite:add-remove-stop',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Add/Remove Stop Button',
        keys: '⌘E',
        keysWin: 'Ctrl+E',
        context: 'Session View - Empty slot',
        tags: ['stop', 'button', 'session'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:adjust-loop-length',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Adjust Loop Brace Length',
        keys: '⌘←/→',
        keysWin: 'Ctrl+Left/Right Arrow',
        context: 'Loop brace selected',
        tags: ['loop', 'length', 'adjust'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:apply-midi-tool',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Apply Current MIDI Tool Settings',
        keys: '⌘Enter',
        keysWin: 'Ctrl+Enter',
        context: 'MIDI Clip Editor',
        tags: ['midi', 'tool', 'apply'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:assign-browser-colors',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Assign Color(s) to Selected Browser Item(s)',
        keys: '1…7',
        context: 'Browser',
        tags: ['color', 'browser', 'organize'],
        group: 'Browser',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:reset-browser-colors',
        productId: 'ableton12suite',
        type: 'browser',
        command: 'Reset Assigned Color(s) for Selected Browser Item(s)',
        keys: '0',
        context: 'Browser',
        tags: ['color', 'reset', 'browser'],
        group: 'Browser',
        facets: ['Browser']
    },
    {
        id: 'ableton12suite:halve-double-loop',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Halve/Double Loop Length',
        keys: '⌘↑/↓',
        keysWin: 'Ctrl+Up/Down Arrow',
        context: 'Loop brace selected',
        tags: ['loop', 'length', 'double', 'halve'],
        group: 'Loop Brace and Markers',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:shorten-lengthen-loop',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Shorten/Lengthen Loop',
        keys: '⌘←/→',
        keysWin: 'Ctrl+Left/Right Arrow',
        context: 'Loop brace selected',
        tags: ['loop', 'length'],
        group: 'Loop Brace and Markers',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:hide-live',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Hide Live',
        keys: '⌘H',
        context: 'Global (macOS only)',
        tags: ['hide', 'window'],
        group: 'Working with Sets and the Program',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:insert-midi-clip-session',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Insert MIDI clip',
        keys: '⇧⌘M',
        keysWin: 'Ctrl+Shift+M',
        context: 'Session View',
        tags: ['midi', 'clip', 'insert'],
        group: 'Session View',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:move-insert-to-end',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Move Insert Marker to End',
        keys: 'End',
        context: 'Editor',
        tags: ['end', 'marker', 'navigation'],
        group: 'MIDI Note Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:select-next-prev-note',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Select Next/Previous Note',
        keys: '⌥↑/↓',
        keysWin: 'Alt+Up/Down Arrow',
        context: 'MIDI Clip Editor',
        tags: ['select', 'note', 'navigation'],
        group: 'MIDI Note Editor',
        facets: ['Navigation', 'MIDI Control']
    },
    {
        id: 'ableton12suite:select-note-same-key',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Select Next/Previous Note in Same Key Track',
        keys: '⌥←/→',
        keysWin: 'Alt+Left/Right Arrow',
        context: 'MIDI Clip Editor',
        tags: ['select', 'note', 'key', 'navigation'],
        group: 'MIDI Note Editor',
        facets: ['Navigation', 'MIDI Control']
    },
    {
        id: 'ableton12suite:scroll-editor-vertical',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Scroll Editor Vertically',
        keys: 'Page Up/Down',
        context: 'MIDI Clip Editor',
        tags: ['scroll', 'vertical', 'navigation'],
        group: 'MIDI Note Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:scroll-editor-horizontal',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Scroll Editor Horizontally',
        keys: '⌘Page Up/Down',
        keysWin: 'Ctrl+Page Up/Down',
        context: 'MIDI Clip Editor',
        tags: ['scroll', 'horizontal', 'navigation'],
        group: 'MIDI Note Editor',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:split-arrangement-clip',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Split Arrangement Clip Based on Time Selection',
        keys: '⇧⌘E',
        keysWin: 'Ctrl+Shift+E',
        context: 'MIDI Clip Editor',
        tags: ['split', 'clip', 'time', 'selection'],
        group: 'MIDI Note Editor',
        facets: ['Editing', 'MIDI Control']
    },
    {
        id: 'ableton12suite:duplicate-take-lane',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Duplicate Selected Take Lane',
        keys: '⌘D',
        keysWin: 'Ctrl+D',
        context: 'Comping - Take lane selected',
        tags: ['duplicate', 'take', 'comping'],
        group: 'Comping',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:replace-take',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Replace Main Take Clip with Next/Previous Take',
        keys: '⌘↑/↓',
        keysWin: 'Ctrl+Up/Down Arrow',
        context: 'Comping - Main lane selected',
        tags: ['replace', 'take', 'comping'],
        group: 'Comping',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:add-take-to-main',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Add Selected Take Lane Area to Main Track Lane',
        keys: 'Enter',
        context: 'Comping - Take lane selection',
        tags: ['add', 'take', 'main', 'comping'],
        group: 'Comping',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:move-track-left-right',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Move Selected Track Left/Right',
        keys: '⌘←/→',
        keysWin: 'Ctrl+Left/Right Arrow',
        context: 'Track selected',
        tags: ['move', 'track', 'reorder'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:move-nonadjacent-scenes',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Move Nonadjacent Scenes Without Collapsing',
        keys: '⌘↑/↓',
        keysWin: 'Ctrl+Up/Down Arrow',
        context: 'Session View - Scene selected',
        tags: ['move', 'scene', 'reorder'],
        group: 'Session View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:adjust-track-height',
        productId: 'ableton12suite',
        type: 'view',
        command: 'Adjust Height of Selected Tracks/Clips',
        keys: '⌥+/-',
        keysWin: 'Alt++ / Alt+-',
        context: 'Track/Clip selected',
        tags: ['height', 'track', 'clip', 'resize'],
        group: 'Arrangement View',
        facets: ['Navigation']
    },
    {
        id: 'ableton12suite:nudge-selection',
        productId: 'ableton12suite',
        type: 'edit',
        command: 'Nudge Selection Left/Right',
        keys: '←/→',
        keysWin: 'Left/Right Arrow',
        context: 'Selection',
        tags: ['nudge', 'move', 'selection'],
        group: 'Arrangement View',
        facets: ['Editing']
    },
    {
        id: 'ableton12suite:jump-track-title',
        productId: 'ableton12suite',
        type: 'navigation',
        command: 'Jump to Highlighted Track Title Bar',
        keys: 'Esc',
        context: 'Session/Arrangement View',
        tags: ['jump', 'track', 'title'],
        group: 'Session View',
        facets: ['Navigation']
    }
];

