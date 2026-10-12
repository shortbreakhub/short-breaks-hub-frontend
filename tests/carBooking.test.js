import test from "node:test";
import assert from "node:assert/strict";
import {getCarDefaults, validateCarBooking, buildTripComCarUrl, TRIP_COM_CAR_AFFILIATE_URL} from "../src/utils/carBooking.js";
const key="china--shanghai";
const values={pickupTime:"2026-10-19T10:00",returnTime:"2026-10-26T10:00"};
test("car defaults reuse the Flights month-ahead convention and actual itinerary duration",()=>{
 for(const days of [2,4,7]) assert.deepEqual(getCarDefaults({days},new Date(2026,9,12,23)),{
  pickupTime:"2026-11-12T10:00",returnTime:`2026-11-${12+days}T10:00`,
 });
 assert.deepEqual(getCarDefaults({days:4},new Date(2026,11,28,23)),{pickupTime:"2027-01-28T10:00",returnTime:"2027-02-01T10:00"});
 assert.deepEqual(getCarDefaults({days:2},new Date(2026,0,31,23)),{pickupTime:"2026-02-28T10:00",returnTime:"2026-03-02T10:00"});
 assert.deepEqual(getCarDefaults({days:7},new Date(2024,0,31,23)),{pickupTime:"2024-02-29T10:00",returnTime:"2024-03-07T10:00"});
 assert.equal(getCarDefaults({days:undefined},new Date(2026,9,12)).returnTime,"");
});
test("car URL reuses verified airport and retains every supplied tracking parameter",()=>{
 const url=new URL(buildTripComCarUrl(key,values));const base=new URL(TRIP_COM_CAR_AFFILIATE_URL);
 assert.equal(url.origin,"https://www.trip.com");assert.equal(url.pathname,"/carhire/online/list/");assert.equal(url.searchParams.get("pcode"),"PVG");
 for(const [name,value] of base.searchParams) if(name!=="pcode") assert.equal(url.searchParams.get(name),value);
 assert.equal(url.searchParams.get("ptime"),"2026/10/19 10:00");assert.equal(url.searchParams.get("rtime"),"2026/10/26 10:00");
 assert.deepEqual([...url.searchParams.keys()].sort(),["serverRoute","pcode","Allianceid","SID","trip_sub1","trip_sub3","ptime","rtime"].sort());
 assert.equal(new URL(buildTripComCarUrl("malaysia--george-town",values)).searchParams.get("pcode"),"PEN");
});
test("missing mapping and invalid or unordered date/times block handoff",()=>{
 for(const destination of [undefined,"unknown","myanmar--bagan"]) assert.equal(buildTripComCarUrl(destination,values),null);
 for(const change of [{pickupTime:""},{pickupTime:"2026-02-30T10:00"},{pickupTime:"2026-10-19T25:00"},{returnTime:""},{returnTime:values.pickupTime},{returnTime:"2026-10-18T10:00"}]) assert.equal(buildTripComCarUrl(key,{...values,...change}),null);
 assert.equal(validateCarBooking(key,{...values,returnTime:"2026-10-19T10:01"}),null);
});
