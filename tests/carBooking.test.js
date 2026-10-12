import test from "node:test";
import assert from "node:assert/strict";
import {getCarDefaults, validateCarBooking, buildTripComCarUrl, TRIP_COM_CAR_AFFILIATE_URL} from "../src/utils/carBooking.js";
const key="china--shanghai";
const values={pickupTime:"2026-10-19T10:00",returnTime:"2026-10-26T10:00"};
test("car defaults use local calendar days and 10:00 across month/year boundaries",()=>{
 assert.deepEqual(getCarDefaults(new Date(2026,9,12,23)),values);
 assert.deepEqual(getCarDefaults(new Date(2026,11,28,23)),{pickupTime:"2027-01-04T10:00",returnTime:"2027-01-11T10:00"});
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
