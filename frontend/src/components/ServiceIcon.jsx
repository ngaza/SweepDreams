import React from 'react';
export default function ServiceIcon({category}) {
 return <svg width="38" height="38" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{category==='Dorm'?<><path d="M5 14 16 5l11 9M8 12v15h16V12"/><path d="M13 27v-8h6v8"/><rect x="13" y="11" width="6" height="4" rx=".7"/></>:<><path d="m3 15 13-11 13 11M7 12v15h18V12M21 8V4h4v7"/><path d="M13 27v-9h6v9M9 15h2m10 0h2"/></>}</svg>;
}
