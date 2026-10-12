import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildTripComAttractionsUrl, TRIP_COM_ATTRACTIONS_URL} from "../src/utils/attractionsBooking.js";
const slugs=["4-days-paris-where-icons-meet-everyday-grace","4-days-tokyo-where-order-holds-the-motion","4-days-barcelona-between-order-and-instinct"];
test("Attractions reuses each real itinerary city mapping without Beijing or Hotel-ID substitution",()=>{
 for(const slug of slugs){const html=readFileSync(`dist/itinerary/${slug}/index.html`,"utf8");const destination=JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]).detail.hotelDestination;
 const url=new URL(buildTripComAttractionsUrl(destination));assert.equal(url.origin,"https://www.trip.com");assert.equal(url.pathname,"/things-to-do/list");assert.equal(url.searchParams.get("keyword"),destination.name);assert.equal(url.searchParams.get("pagetype"),"city");assert.equal(url.searchParams.get("pshowcode"),"all");assert.equal(url.searchParams.has("searchKey"),false);assert.equal(url.searchParams.has("searchType"),false);
 for(const key of ["Allianceid","SID","trip_sub1","trip_sub3"])assert.equal(url.searchParams.get(key),new URL(TRIP_COM_ATTRACTIONS_URL).searchParams.get(key));
 }
});
test("unsupported mappings fail closed and mapped names are safely encoded",()=>{
 for(const destination of [null,{}, {provider:"TRIP_COM",entityType:"CITY",status:"REVIEW_REQUIRED",name:"Paris",destinationKey:"france--paris",externalId:"192"}])assert.equal(buildTripComAttractionsUrl(destination),null);
 const destination={provider:"TRIP_COM",entityType:"CITY",status:"MAPPED",name:"A & B / C",destinationKey:"fixture",externalId:"1"};const url=new URL(buildTripComAttractionsUrl(destination));assert.equal(url.searchParams.get("keyword"),destination.name);assert.equal(url.searchParams.get("Allianceid"),"9927800");
});
