import React from 'react';
import './VoiceVisualizer.css';

export default function VoiceVisualizer({ state }) {
  // state can be 'idle', 'listening', 'speaking'

  if (state === 'idle') return null;

  return (
    <div className="freak-panel-container">
      {/* FREAK BOT Header */}
      <div className="freak-status-text">
        {state === 'listening'
          ? 'FREAK BOT. LINK ACTIVE'
          : 'FREAK BOT. COMMUNICATING'}
      </div>

      {/* Knight Rider 2 High-Tech Glass Console */}
      <div className={`freak-glass-console ${state}`}>
        {/* Glass Reflection Highlight Streak */}
        <div className="glass-glare"></div>

        <div className="matrix-columns-wrapper">
          {/* Side Column 1 (Middle Faded, Top/Bottom Bright) */}
          <div className="freak-col side-col col-1"></div>
          
          {/* Center Column (Solid & Sharp Sharp) */}
          <div className="freak-col center-col col-2"></div>
          
          {/* Side Column 2 (Middle Faded, Top/Bottom Bright) */}
          <div className="freak-col side-col col-3"></div>
        </div>
      </div>
    </div>
  );
}