import test from "node:test";
import assert from "node:assert/strict";
import {buildTripComFlightUrl, flightAirportLabel, validateFlightBooking, FLIGHT_ATTRIBUTION_STATUS} from "../src/utils/flightBooking.js";
const now = new Date(2026, 9, 12, 12);
const values = {from: "Montréal & City (YUL)", to: flightAirportLabel("france--paris"), depart: "2026-11-12", return: "2026-11-16", nonstopOnly: false};
test("dynamic routes encode names, dates and tracking without inventing provider fields", () => {
 const url = new URL(buildTripComFlightUrl("france--paris", values, now));
 assert.equal(url.origin, "https://www.trip.com");
 assert.match(url.pathname, /Montr%C3%A9al%20%26%20City-to-/);
 assert.ok(url.pathname.endsWith("tickets-YUL-CDG"));
 for(const [key,value] of Object.entries({dcity:"YUL",acity:"CDG",triptype:"rt",ddate:values.depart,rdate:values.return,nonstoponly:"off",Allianceid:"9927800",SID:"327885881",trip_sub1:""})) assert.equal(url.searchParams.get(key),value);
 for(const key of ["trip_sub3","dcityid","acityid","class","flighttype"]) assert.equal(url.searchParams.has(key),false);
 assert.equal(FLIGHT_ATTRIBUTION_STATUS,"EXPERIMENTAL_UNCONFIRMED");
 assert.equal(new URL(buildTripComFlightUrl("france--paris", {...values, nonstopOnly:true},now)).searchParams.get("nonstoponly"),"on");
 assert.ok(buildTripComFlightUrl("france--paris", {...values,from:"SYD",to:"CDG"},now).includes("tickets-SYD-CDG"));
});
test("missing inputs, unverified mappings, mismatched destinations and invalid dates fail closed",()=>{
 for(const change of [{from:""},{from:"Unknown City"},{from:"https://evil.test/JFK"},{to:""},{to:"LHR"},{depart:"2026-02-30"},{depart:"2026-10-11"},{return:values.depart},{return:"bad"}]) assert.equal(buildTripComFlightUrl("france--paris",{...values,...change},now),null);
 assert.equal(buildTripComFlightUrl("unknown",values,now),null);
 assert.equal(buildTripComFlightUrl("myanmar--bagan",values,now),null);
 assert.equal(validateFlightBooking("france--paris",values,now),null);
});
