'use client';

import { useState, useEffect } from 'react';

const links = ['Home', 'About', 'Settings', 'Dashboard'];

type Props = { active: string; onNavigate: (link: string) => void };
function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  
  // UTC components
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const sec = pad(date.getUTCSeconds());

  // Timezone offset (local)
  const tzOffset = -date.getTimezoneOffset();
  const tzSign = tzOffset >= 0 ? '+' : '-';
  const tzH = pad(Math.floor(Math.abs(tzOffset) / 60));
  const tzM = pad(Math.abs(tzOffset) % 60);

  return `${yyyy}:${mm}:${dd} ${hh}:${min}:${sec} UTC ${tzSign}${tzH}:${tzM}`;
}

export default function NavBar({ active, onNavigate }: Props) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&display=swap');

        .nav-root {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          height: 60px;
          font-family: 'Space Grotesk', sans-serif;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .nav-logo {
          position: relative;
          display: flex;
          align-items: baseline;
          gap: 2px;
          cursor: default;
          user-select: none;
        }

        .nav-logo-text {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #fff;
        }

        .nav-logo-bracket {
          font-size: 18px;
          font-weight: 300;
          color: #00ffe1;
          line-height: 1;
          opacity: 0.8;
        }

        .nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link-item {
          position: relative;
          cursor: pointer;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.2s ease;
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          user-select: none;
        }

        .nav-link-item::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          right: 50%;
          height: 1px;
          background: #00ffe1;
          box-shadow: 0 0 8px rgba(0,255,225,0.6);
          transition: left 0.3s cubic-bezier(0.4,0,0.2,1), right 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        .nav-link-item.active {
          color: #fff;
        }

        .nav-link-item.active::before {
          left: 20px;
          right: 20px;
        }

        .nav-link-item:hover {
          color: rgba(255,255,255,0.85);
        }

        .nav-clock {
          position: relative;
          font-size: 10.5px;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.6);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          font-family: 'Space Grotesk', monospace;
        }
      `}</style>

      <nav className="nav-root">
        <div className="nav-logo">
          <span className="nav-logo-bracket">[</span>
          <span className="nav-logo-text">A.C.E</span>
          <span className="nav-logo-bracket">]</span>
        </div>

        <ul className="nav-links">
          {links.map((link) => (
            <li
              key={link}
              className={`nav-link-item${active === link ? ' active' : ''}`}
              onClick={() => onNavigate(link)}
            >
              {link}
            </li>
          ))}
        </ul>

        <div className="nav-clock">{time}</div>
      </nav>
    </>
  );
}
