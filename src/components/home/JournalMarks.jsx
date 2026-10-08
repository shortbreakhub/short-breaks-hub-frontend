import React from "react";

// Small vector marginalia, not destination assets or functional controls.
export default function JournalMarks({kind, label, note}) {
    if (kind === "stamp") return <svg className="absolute top-0 right-0 pointer-events-none hidden xl:block" width="140" height="130" viewBox="0 0 140 130" aria-hidden="true">
        <g fill="none" stroke="#b4935a" opacity=".35" strokeWidth="1.5"><circle cx="60" cy="64" r="46"/><circle cx="60" cy="64" r="37"/>{[20,31,42,53,64].map(y=><path key={y} d={`M101 ${y}q15 7 32 0`}/>)}<path d="m38 62 15 4 15-14 4 3-8 16 9 6-3 4-12-5-9 8-4-3 5-11-14-5Z"/></g>
        <text x="60" y="27" textAnchor="middle" fill="#a17f46" opacity=".45" fontSize="7">{label}</text>
    </svg>;
    if (kind === "blossoms") return <svg className="absolute right-0 bottom-0 pointer-events-none hidden xl:block" width="85" height="145" viewBox="0 0 85 145" aria-hidden="true">
        <path d="M83 140Q28 113 30 55M60 126Q65 71 80 35M41 100 8 66" fill="none" stroke="#887656" strokeWidth="2" opacity=".5"/>
        {[[30,55],[12,67],[53,104],[70,69],[77,38]].map(([x,y])=><g key={x} transform={`translate(${x} ${y})`} opacity=".55">{[0,72,144,216,288].map(angle=><ellipse key={angle} cx="0" cy="-6" rx="4" ry="8" transform={`rotate(${angle})`} fill="#e0a99e"/>)}<circle r="2" fill="#b77a4e"/></g>)}
    </svg>;
    const paths = {
        paris: "M42 3 36 23 35 38 27 56 16 70H30L37 54H47L55 70H68L56 56 48 38 47 23ZM36 23H47M35 38H48M27 56H56M38 9H46M37 28 47 37M47 28 35 37M35 42 48 51M48 42 35 51M17 75H68",
        shanghai: "M5 75H79M13 74V39H24V74M34 74V52M34 47V35M34 25V7M28 36H40M29 51H39M52 74V25L64 20V74M70 74V36H77V74M54 30H62M54 37H62M54 44H62M54 51H62M54 58H62M54 65H62",
        tokyo: "M4 74H80M14 71V60H70V71M20 58V42H64V58M28 40V26H57V40M22 25 41 12 63 25ZM11 42 41 31 73 42ZM5 60 41 47 80 60ZM39 12V3M30 70V63H45V70M25 48H31M48 48H55",
    };
    return <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 300" aria-hidden="true"><g transform={kind === "paris" ? "translate(462 4) rotate(8)" : "translate(4 16) rotate(-8)"}>
        <path d="M3 5 128 0 134 52 5 63Z" fill="#f0e4c9" opacity=".95"/>
        <path d="M45 -4 77 -8 82 8 49 12Z" fill="#dccba8" opacity=".6"/>
        <text x="12" y="24" fill="#42696a" fontFamily="cursive" fontStyle="italic" fontSize="13">{note.split("\n").map((line,i)=><tspan key={line} x="12" dy={i?20:0}>{line}</tspan>)}</text>
        <g transform="translate(18 67)"><path d={paths[kind]} fill="none" stroke="#42696a" strokeWidth=".8" opacity=".6"/>{kind === "shanghai" && <g stroke="#42696a" fill="none" opacity=".6"><circle cx="34" cy="30" r="6"/><circle cx="34" cy="49" r="4"/></g>}</g></g></svg>;
}
