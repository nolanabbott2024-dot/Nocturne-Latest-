import { test, expect } from "@playwright/test";

const VIDEO_B64="AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAPubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAAlgAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAxl0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAlgAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAKAAAABaAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAJYAAAEAAABAAAAAAKRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAyAAAAHgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACPG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAfxzdGJsAAAAwHN0c2QAAAAAAAAAAQAAALBhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAKAAWgBIAAAASAAAAAAAAAABFUxhdmM2MS4xOS4xMDEgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAANmF2Y0MBZAAL/+EAGWdkAAus2UKN+TARAAADAAEAAAMAMg8UKZYBAAZo6+PLIsD9+PgAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAMUUAAAAAAAAAGHN0dHMAAAAAAAAAAQAAAA8AAAIAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAACIY3R0cwAAAAAAAAAPAAAAAQAABAAAAAABAAAKAAAAAAEAAAQAAAAAAQAAAAAAAAABAAACAAAAAAEAAAoAAAAAAQAABAAAAAABAAAAAAAAAAEAAAIAAAAAAQAACgAAAAABAAAEAAAAAAEAAAAAAAAAAQAAAgAAAAABAAAGAAAAAAEAAAIAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAAPAAAAAQAAAFBzdHN6AAAAAAAAAAAAAAAPAAAC5AAAAA8AAAANAAAADAAAAAwAAAAVAAAADwAAAAwAAAAMAAAAFQAAAA8AAAAMAAAADAAAABYAAAAMAAAAFHN0Y28AAAAAAAAAAQAABB4AAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYxLjcuMTAzAAAACGZyZWUAAAO6bWRhdAAAAq4GBf//qtxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNjQgcjMxMDggMzFlMTlmOSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMjMgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMiBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz0zIGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNSBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAC5liIQAO//+906/AptUwioDklcK9sqkJlm5U3w+xrIXRFB/V9oF6AVQACPA6vyBAAAAC0GaJGxDf/6nhAHHAAAACUGeQniF/wDzgQAAAAgBnmF0Qr8BUwAAAAgBnmNqQr8BUwAAABFBmmhJqEFomUwIb//+p4QBxwAAAAtBnoZFESwv/wDzgQAAAAgBnqV0Qr8BUwAAAAgBnqdqQr8BUwAAABFBmqxJqEFsmUwIZ//+nhAGzAAAAAtBnspFFSwv/wDzgQAAAAgBnul0Qr8BUwAAAAgBnutqQr8BUwAAABJBmu5JqEFsmUwUTCv//jhAGjEAAAAIAZ8NakK/AVM=";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*"};

function item(id:string,type="movie"){
  return {
    id,type,name:`Fixture ${id}`,poster:"",background:"",description:"A fixture title for TV navigation tests.",
    releaseInfo:"2026",runtime:"1h 40m",contentRating:"PG-13",
    trailerStreams:[{url:"https://fixture.test/trailer.mp4"}],
    videos:type==="series"?[{id:`${id}:1:1`,season:1,episode:1,title:"Pilot",overview:"Episode fixture"}]:[]
  };
}
async function focus(page:any){return page.evaluate(()=>window.__NOCTURNE_TV__?.focus?.()||null)}
async function trailer(page:any){return page.evaluate(()=>window.__NOCTURNE_TV__?.trailer?.()||"missing")}

test.beforeEach(async({page})=>{
  page.on("console",m=>console.log("BROWSER",m.type(),m.text()));
  page.on("pageerror",e=>console.log("PAGEERROR",e.stack||e.message));
  await page.addInitScript(()=>{
    localStorage.setItem("addonDescriptors",JSON.stringify([{transportUrl:"https://fixture.test/manifest.json",enabled:true}]));
    localStorage.setItem("library","{}");
  });
  await page.route("**/manifest.json",async route=>route.fulfill({
    status:200,headers:cors,contentType:"application/json",
    body:JSON.stringify({
      id:"fixture",name:"Fixture",version:"1.0.0",types:["movie","series"],resources:["catalog","meta","stream"],
      catalogs:[
        {type:"movie",id:"popular",name:"Popular",extra:[{name:"search"}]},
        {type:"series",id:"shows",name:"Popular Shows",extra:[{name:"search"}]}
      ]
    })
  }));
  await page.route("**/catalog/**",async route=>{
    const url=route.request().url();const type=url.includes("/series/")?"series":"movie";
    const metas=Array.from({length:60},(_,i)=>item((type==="series"?"show":"tt")+i,type));
    metas[6]={...item((type==="series"?"showAlias":"ttAlias"),type),name:metas[5].name,releaseInfo:metas[5].releaseInfo};
    await route.fulfill({status:200,headers:cors,contentType:"application/json",body:JSON.stringify({metas})});
  });
  await page.route("**/meta/**",async route=>{
    const url=route.request().url();const type=url.includes("/series/")?"series":"movie";
    const id=decodeURIComponent(url.split("/").pop()!.replace(".json",""));
    await route.fulfill({status:200,headers:cors,contentType:"application/json",body:JSON.stringify({meta:item(id,type)})});
  });
  await page.route("**/stream/**",async route=>route.fulfill({status:200,headers:cors,contentType:"application/json",body:JSON.stringify({streams:[{name:"Fixture 1080p",url:"https://fixture.test/trailer.mp4"}]})}));
  await page.route("https://fixture.test/trailer.mp4",async route=>route.fulfill({status:200,headers:{...cors,"Accept-Ranges":"bytes"},contentType:"video/mp4",body:Buffer.from(VIDEO_B64,"base64")}));
  await page.goto("/");
  await expect(page.locator(".app-shell")).toBeVisible();
  await expect.poll(()=>focus(page),{timeout:12000}).toBe("home:hero:play");
});

test("Home rail, sidebar and Back restore exact focus",async({page})=>{
  await page.keyboard.press("ArrowDown");
  await expect.poll(()=>focus(page)).toMatch(/^home:[^:]+:(movie|series):/);
  const first=await focus(page);
  await page.keyboard.press("ArrowRight");
  const second=await focus(page);
  expect(second).not.toBe(first);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(()=>focus(page)).toBe(first);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(()=>focus(page)).toBe("sidebar:home");
  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>focus(page)).toBe(first);

  await page.keyboard.press("Enter");
  await expect.poll(()=>focus(page)).toBe("details:tt0:action:play");
  await page.keyboard.press("Escape");
  await expect.poll(()=>focus(page)).toBe(first);
});

test("Search keyboard and results are explicit focus boundaries",async({page})=>{
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  await expect.poll(()=>focus(page)).toBe("sidebar:home");
  for(let i=0;i<4;i++)await page.keyboard.press("ArrowDown");
  await expect.poll(()=>focus(page)).toBe("sidebar:search");
  await page.keyboard.press("Enter");
  await expect.poll(()=>focus(page)).toBe("search-key:A");
  await expect(page.locator(".key-button.search-submit")).toBeVisible();
  await expect(page.locator(".key-button.search-submit")).toHaveText("Search");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  for(let i=0;i<8;i++)await page.keyboard.press("ArrowRight");
  await expect.poll(()=>focus(page)).toBe("search-key:I");
  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>focus(page)).toMatch(/^search:search-popular:/);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(()=>focus(page)).toBe("search-key:I");
});

test("Trailer waits for dwell and cancels immediately on navigation",async({page})=>{
  await page.keyboard.press("ArrowDown");
  await expect.poll(()=>focus(page)).toMatch(/^home:[^:]+:(movie|series):/);
  expect(await trailer(page)).toBe("idle");
  await page.waitForTimeout(2600);
  await expect.poll(()=>trailer(page)).toBe("playing");
  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>trailer(page)).toBe("idle");
});


test("Spotlight follows focus and Details actions reflect the active control",async({page})=>{
  await page.keyboard.press("ArrowDown");
  const first=await focus(page);
  await expect.poll(()=>focus(page)).toMatch(/^home:[^:]+:(movie|series):/);
  const firstName=await page.locator(".hero-copy h1").textContent();

  await page.keyboard.press("ArrowRight");
  const second=await focus(page);
  expect(second).not.toBe(first);
  await expect.poll(async()=>page.locator(".hero-copy h1").textContent()).not.toBe(firstName);

  await page.keyboard.press("Enter");
  await expect.poll(()=>focus(page)).toMatch(/^details:.*:action:play$/);

  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>focus(page)).toMatch(/:action:watchlist$/);
  const playBg=await page.locator(".detail-action").nth(0).evaluate(el=>getComputedStyle(el).backgroundColor);
  const watchBg=await page.locator(".detail-action").nth(1).evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(watchBg).not.toBe(playBg);

  await page.keyboard.press("Enter");
  await expect(page.locator(".detail-action").nth(1)).toContainText("In Watchlist");

  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>focus(page)).toMatch(/:action:sources$/);
  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>focus(page)).toMatch(/:action:trailer$/);
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-tv-overlay='true'] .trailer-stage")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".trailer-stage")).toHaveCount(0);
});

test("TV series episodes are visible and Down from actions reaches the first episode",async({page})=>{
  await page.keyboard.press("ArrowLeft");
  await expect.poll(()=>focus(page)).toBe("sidebar:home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect.poll(()=>focus(page)).toBe("sidebar:shows");
  await page.keyboard.press("Enter");
  await expect.poll(()=>focus(page)).toBe("shows:hero:play");
  await page.keyboard.press("ArrowDown");
  await expect.poll(()=>focus(page)).toMatch(/^shows:[^:]+:series:/);
  await page.keyboard.press("Enter");
  await expect.poll(()=>focus(page)).toMatch(/^details:show\d+:action:play$/);
  await page.keyboard.press("ArrowDown");
  await expect.poll(()=>focus(page)).toMatch(/^details:show\d+:episode:show\d+:1:1$/);
  await expect(page.locator(".episodes")).toBeVisible();
  await expect(page.locator(".episode-card").first()).toContainText("Pilot");
});

test("Rows remove duplicate titles even when provider IDs differ",async({page})=>{
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  const names=await page.locator(".tv-row").first().locator(".card-meta b").allTextContents();
  const normalized=names.map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g," ").trim());
  expect(new Set(normalized).size).toBe(normalized.length);
});

test("Large rails remain virtualized",async({page})=>{
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(250);
  const counts=await page.locator(".tv-row-scroll .tv-row-inner").evaluateAll(rows=>rows.map(r=>r.querySelectorAll(".tv-card").length));
  expect(counts.length).toBeGreaterThan(0);
  for(const count of counts)expect(count).toBeLessThan(30);
});
