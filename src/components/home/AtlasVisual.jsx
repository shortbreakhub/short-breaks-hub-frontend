import React from "react";

// Soft editorial scenery only: not geographic data, projection or a map engine.
export default function AtlasVisual() {
    return <svg viewBox="0 0 1000 550" aria-hidden="true" focusable="false" className="atlas-visual">
        <g fill="#ced7bd" opacity="0.65">
            <path d="M90 170Q100 125 166 95T248 94Q270 88 302 110T337 159Q325 186 300 206T258 271Q254 296 287 316Q253 321 229 280T179 242Q143 232 128 207T90 170Z" />
            <path d="M306 325Q341 303 369 323T409 373Q414 403 386 440T354 492Q337 465 333 426T306 387Q285 352 306 325Z" />
            <path d="M357 70Q402 44 436 73Q431 111 389 132Q352 123 357 70Z" />
            <path d="M460 197Q461 169 491 165Q507 125 522 134Q537 161 519 183Q551 177 575 211Q547 231 516 215Q488 235 460 197Z" />
            <path d="M482 254Q514 231 548 244Q578 259 592 294Q608 315 584 353T546 410Q518 411 510 375T480 321Q457 284 482 254Z" />
            <path d="M543 169Q563 129 626 109T719 95Q772 76 823 102T902 156Q902 180 872 190Q888 219 847 237Q834 269 794 282Q779 312 753 297Q736 275 721 243Q686 225 674 258L650 310Q634 294 621 266Q590 257 583 226Q553 215 543 169Z" />
            <path d="M757 335Q794 326 817 348Q802 366 777 353Z M828 308Q849 326 834 348Z M875 212Q893 216 879 237Z" />
            <path d="M800 403Q838 369 873 384T903 424Q888 453 851 455T791 424Q783 413 800 403Z M919 448Q932 457 914 474Z" />
        </g>
    </svg>;
}

// Six temporary color studies, deliberately small in code. Final illustrated
// assets replace this one component; no permanent landmark library is implied.
export function LandmarkSketch({kind}) {
    let artwork;
    switch (kind) {
        case "paris": artwork = <><path d="M35 88 50 12 65 88H56L50 68 44 88Z" fill="#c18a52"/><path d="M32 88h36M39 64h22M43 43h14M48 20h4" stroke="#81573d" strokeWidth="3"/><path d="M48 14V7" stroke="#81573d" strokeWidth="2"/></>; break;
        case "tokyo": artwork = <><path d="M24 84V38h52v46Z" fill="#e0ae72"/><path d="M16 38 50 20 84 38Z M21 61 50 46 79 61Z" fill="#a85743"/><path d="M31 62h38v22H31Z" fill="#d29a63"/><path d="M45 84V69h10v15" fill="#5e7661"/><path d="M29 40h42M26 63h48" stroke="#7a4838" strokeWidth="3"/></>; break;
        case "shanghai": artwork = <><path d="M20 87V52h14v35M42 87V20h13v67M65 87V37h14v50" fill="#79918a"/><path d="M51 26v-16M31 40v48" stroke="#8b5f4d" strokeWidth="3"/><circle cx="31" cy="47" r="8" fill="#c37558"/><circle cx="31" cy="69" r="5" fill="#c37558"/><path d="M43 22 55 17v70H43Z" fill="#496e68"/><path d="M69 41h5m-5 9h5m-5 9h5" stroke="#e3d4b2" strokeWidth="3"/></>; break;
        case "newYork": artwork = <><path d="M30 88V77h34v11Z" fill="#c8ab7c"/><path d="M36 77 43 39h13l7 38Z" fill="#73978a"/><circle cx="49" cy="31" r="7" fill="#73978a"/><path d="M44 24 42 18l7 3 6-4 2 8M54 44 72 20" fill="none" stroke="#52796e" strokeWidth="5"/><path d="M70 20V12h7v8Z" fill="#a97b3f"/><path d="M71 12q-4-9 4-12 5 7 0 12" fill="#d6a253"/><path d="M43 43 36 51" stroke="#52796e" strokeWidth="5"/></>; break;
        case "sydney": artwork = <><path d="M12 81 28 43 43 81Z" fill="#d6bb87"/><path d="M31 81 54 24 66 81Z" fill="#f5e2b8"/><path d="M58 81 86 45 83 81Z" fill="#e4c793"/><path d="M28 43 35 75M54 24 59 75M86 45 74 75" stroke="#b99662" strokeWidth="2"/><path d="M9 83h79" stroke="#637f7a" strokeWidth="5"/></>; break;
        default: artwork = <><path d="M23 86V27h20v59Z" fill="#c28b5c"/><path d="M20 27h26l-4-8H24Z M28 19V9h10v10Z" fill="#99633f"/><path d="M51 86V61h28v25Z" fill="#d8ab78"/><path d="M48 61Q65 33 82 61Z" fill="#b86e50"/><path d="M61 86V73q5-9 9 0v13" fill="#745c44"/><path d="M29 39h8m-8 12h8m-8 12h8" stroke="#ead3a5" strokeWidth="3"/></>;
    }
    return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="atlas-landmark">
        <ellipse cx="50" cy="58" rx="40" ry="35" fill="#ede3cf" opacity="0.8"/>
        {artwork}
        <path d="M16 90Q50 94 84 90" fill="none" stroke="#d0bea0" strokeWidth="2"/>
    </svg>;
}
