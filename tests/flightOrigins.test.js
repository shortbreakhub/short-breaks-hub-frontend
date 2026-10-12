import test from "node:test";
import assert from "node:assert/strict";
import {resolveFlightOrigin, FLIGHT_ORIGIN_SUGGESTIONS} from "../src/utils/flightOrigins.js";
import {buildTripComFlightUrl, flightAirportLabel} from "../src/utils/flightBooking.js";

test("city names resolve case-insensitively without inventing airport codes", () => {
 for (const [name,code] of [["London","LON"],["london","LON"],["LONDON","LON"],["Londres","LON"],["Manchester","MAN"],["Birmingham","BHX"],["Paris","PAR"]]) assert.equal(resolveFlightOrigin(name).code,code);
 for(const code of ["LHR","LGW","MAN","HND"]) assert.equal(resolveFlightOrigin(code.toLowerCase()).code,code);
 for(const name of ["Unknown City","Springfield","ZZZ","Mystery (ZZZ)","https://evil.test/LON",null,""]) assert.equal(resolveFlightOrigin(name),null);
 assert.ok(FLIGHT_ORIGIN_SUGGESTIONS.includes("London"));
});
test("resolved city code stays consistent in route and query while retaining destination airport and booking selections",()=>{
 const filters={from:"london",to:flightAirportLabel("japan--tokyo"),depart:"2026-11-12",return:"2026-11-16",nonstopOnly:true};
 const url=new URL(buildTripComFlightUrl("japan--tokyo",filters,new Date(2026,9,12,12)));
 assert.ok(url.pathname.endsWith("tickets-LON-HND"));
 for(const [key,value] of Object.entries({dcity:"LON",acity:"HND",ddate:filters.depart,rdate:filters.return,nonstoponly:"on",Allianceid:"9927800",SID:"327885881"})) assert.equal(url.searchParams.get(key),value);
 assert.equal(filters.from,"london");
 assert.equal(buildTripComFlightUrl("japan--tokyo",{...filters,from:"Atlantis"},new Date(2026,9,12,12)),null);
});
