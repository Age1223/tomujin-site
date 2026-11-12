/* Shared script for /events and talk pages like /tsasanjin-talk.
   - Fills every [data-signup] with the sign-up form (name, phone, email, school, grade)
   - The sign-up pop-up: openSignup({event}) for one event, or openSignup() for "tell me about the next ones"
   - Event dates and the event card used on both pages
   Sign-ups go to the "Tomujin event sign-ups" Apps Script (tools/events-signups.gs), which adds a row to its sheet. */
(function(){
  /* Paste the Apps Script web app URL (ends in /exec) here. See tools/events-signups.gs for the setup steps.
     While it's empty, the form only pretends to send on a test copy (your computer or a Vercel preview),
     so you can see the whole flow; on tomujin.edu.mn it says it couldn't send. */
  var SIGNUP_URL = "";

  var LIVE = /(^|\.)tomujin\.edu\.mn$/.test(location.hostname);
  var TZ = 8 * 3600 * 1000;   /* Ulaanbaatar is UTC+8, all year */
  var WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
  var FORMATS = {"in-person": "Биечлэн", "online": "Онлайн", "hybrid": "Биечлэн + онлайн"};
  var GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }
  function store(key, val){ try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch(e){ return null; } }

  /* ── Dates ── */
  function startMs(ev){ var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(ev.start); return Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) - TZ; }
  function endMs(ev){ return startMs(ev) + (ev.minutes || 60) * 60000; }
  function ub(ms){ return new Date(ms + TZ); }   /* read with getUTC* to get Ulaanbaatar time */
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function when(ev){
    var d = ub(startMs(ev));
    return {
      year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
      weekday: WEEKDAYS[d.getUTCDay()], time: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()),
      long: d.getUTCFullYear() + " оны " + (d.getUTCMonth() + 1) + "-р сарын " + d.getUTCDate() + ", " + WEEKDAYS[d.getUTCDay()] + " гараг"
    };
  }
  function duration(min){ return min >= 60 ? (min % 60 ? Math.floor(min / 60) + " цаг " + (min % 60) + " мин" : (min / 60) + " цаг") : min + " мин"; }
  function isPast(ev, now){ return (now || Date.now()) > endMs(ev); }
  function isOpen(ev, now){ return !isPast(ev, now) && !ev.closed && !ev.tbc; }
  /* Date not confirmed yet: people can only ask to be told once it's set */
  function isTbc(ev, now){ return !!ev.tbc && !isPast(ev, now); }
  function sorted(){
    var now = Date.now(), list = (window.EVENTS || []).slice();
    var up = list.filter(function(e){ return !isPast(e, now); }).sort(function(a, b){ return startMs(a) - startMs(b); });
    var past = list.filter(function(e){ return isPast(e, now); }).sort(function(a, b){ return startMs(b) - startMs(a); });
    return {upcoming: up, past: past};
  }
  function nextEvent(){
    var up = sorted().upcoming;
    return up.filter(function(e){ return e.featured && !e.closed; })[0] || up.filter(function(e){ return !e.closed; })[0] || up[0] || null;
  }
  /* Google Calendar link for the "Календарьт нэмэх" button after registering */
  function calendarUrl(ev){
    function z(ms){ return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(ev.title + " · Томүжин") +
      "&dates=" + z(startMs(ev)) + "/" + z(endMs(ev)) + "&location=" + encodeURIComponent(ev.place || "") +
      "&details=" + encodeURIComponent((ev.summary || "") + "\n\nhttps://tomujin.edu.mn/events");
  }

  /* ── Event card ── */
  function card(ev, opts){
    opts = opts || {};
    var w = when(ev), past = isPast(ev), open = isOpen(ev);
    var type = (window.EVENT_TYPES || {})[ev.type] || "";
    var action;
    if (open) action = '<button class="btn btn--accent btn--lg" type="button" data-register="' + esc(ev.id) + '">Бүртгүүлэх</button><small>' + esc(duration(ev.minutes || 60)) + '</small>';
    else if (isTbc(ev)) action = '<button class="btn btn--outline btn--lg" type="button" data-register="' + esc(ev.id) + '">Мэдэгдэл авах</button><small>Огноо батлагдаагүй</small>';
    else if (past && ev.page) action = '<a class="btn btn--outline btn--lg" href="' + esc(ev.page) + '"><i data-lucide="play"></i>Бичлэг үзэх</a><small>Дууссан</small>';
    else action = '<button class="btn btn--outline btn--lg" type="button" data-register="' + esc(ev.id) + '">Дараагийнхыг мэдэх</button><small>Бүртгэл хаагдсан</small>';
    return '<article class="ev' + (past ? " is-past" : "") + '" data-type="' + esc(ev.type) + '">' +
      '<div class="ev-date" aria-hidden="true"><small>' + w.month + '-р сар</small><b>' + w.day + '</b></div>' +
      '<div class="ev-body">' +
        '<div class="ev-labels">' + (type ? '<span class="kind">' + esc(type) + '</span>' : "") + '<span class="badge">' + esc(FORMATS[ev.format] || "") + '</span></div>' +
        '<' + (opts.h || "h3") + '>' + (ev.page ? '<a href="' + esc(ev.page) + '" style="color:inherit">' + esc(ev.title) + '</a>' : esc(ev.title)) + '</' + (opts.h || "h3") + '>' +
        (ev.summary ? '<p class="sum">' + esc(ev.summary) + '</p>' : "") +
        '<div class="meta"><span><i data-lucide="calendar"></i>' + esc(w.long + " · " + w.time + " · " + duration(ev.minutes || 60)) + (past ? " · Дууссан" : isTbc(ev) ? " · урьдчилсан" : "") + '</span>' +
        (ev.place ? '<span><i data-lucide="map-pin"></i>' + esc(ev.place) + '</span>' : "") + '</div>' +
      '</div>' +
      '<div class="ev-act">' + action + '</div>' +
    '</article>';
  }

  /* ── Sign-up form ── */
  var uid = 0;
  function formHtml(button){
    var n = ++uid;
    function f(id, label, input, wide){ return '<div class="field' + (wide ? " field--wide" : "") + '"><label for="su' + n + "-" + id + '">' + label + '</label>' + input.replace("{id}", "su" + n + "-" + id) + '<p class="field-error" hidden></p></div>'; }
    return '<form class="su" novalidate>' +
      '<div class="su-grid">' +
        f("name", "Овог нэр", '<input id="{id}" name="name" type="text" autocomplete="name" maxlength="120" required data-error="Нэрээ оруулна уу.">', true) +
        f("phone", "Утасны дугаар", '<input id="{id}" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required data-error="Утасны дугаараа зөв оруулна уу (8 оронтой).">') +
        f("email", "Имэйл хаяг", '<input id="{id}" name="email" type="email" inputmode="email" autocomplete="email" maxlength="160" required data-error="Имэйл хаягаа зөв оруулна уу.">') +
        f("school", "Одоо сурч буй сургууль", '<input id="{id}" name="school" type="text" autocomplete="off" maxlength="120" required data-error="Сургуулийнхаа нэрийг оруулна уу.">') +
        f("grade", "Хэддүгээр анги вэ?", '<select id="{id}" name="grade" required data-error="Ангиа сонгоно уу."><option value="" selected disabled>Сонгох</option>' +
          GRADES.map(function(g){ return '<option value="' + g + '">' + g + '-р анги</option>'; }).join("") + '<option value="Бусад">Бусад</option></select>') +
      '</div>' +
      '<div class="su-hp" aria-hidden="true"><label>Website <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>' +
      '<button class="btn btn--accent" type="submit">' + esc(button) + '</button>' +
      '<p class="su-status" role="status" aria-live="polite"></p>' +
      '<p class="su-note">Таны мэдээллийг зөвхөн Томүжингийн эвент, элсэлтийн мэдээлэл илгээхэд ашиглана.</p>' +
    '</form>' +
    '<div class="su-done" hidden role="status"><span class="icon-tile icon-tile--gold"><i data-lucide="check"></i></span><h3></h3><p></p><div class="su-done-act"></div></div>';
  }

  function problem(el){
    var v = el.value.trim();
    if (el.type === "tel"){ var d = v.replace(/\D/g, ""); return (d.length === 8 || (d.length === 11 && d.indexOf("976") === 0)) ? "" : el.getAttribute("data-error"); }
    if (el.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : el.getAttribute("data-error");
    return v ? "" : el.getAttribute("data-error");
  }
  function show(el, msg){
    var err = el.parentNode.querySelector(".field-error");
    err.textContent = msg; err.hidden = !msg;
    if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
  }

  /* opts: {button, getEvent(), interest, onDone(ev)} */
  function mountForm(box, opts){
    box.innerHTML = formHtml(opts.button || "Бүртгүүлэх");
    var form = box.querySelector("form"), done = box.querySelector(".su-done");
    var btn = form.querySelector('button[type="submit"]'), status = form.querySelector(".su-status");
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field input, .field select"));
    fields.forEach(function(el){
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function(){ if (el.hasAttribute("aria-invalid")) show(el, problem(el)); });
    });
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var bad = null;
      fields.forEach(function(el){ var m = problem(el); show(el, m); if (m && !bad) bad = el; });
      if (bad){ bad.focus(); return; }
      var ev = opts.getEvent ? opts.getEvent() : null;
      var label = btn.textContent;
      btn.disabled = true; btn.classList.add("is-sending"); btn.textContent = "Илгээж байна…"; status.textContent = "";
      var data = new URLSearchParams();
      fields.forEach(function(el){ data.append(el.name, el.value.trim()); });
      data.append("website", form.querySelector('[name="website"]').value);
      /* What they signed up for: one event, or the series in general */
      data.append("eventId", ev ? ev.id : "");
      data.append("eventTitle", ev ? ev.title : "");
      data.append("interest", ev ? (isOpen(ev) ? "Бүртгүүлсэн" : isTbc(ev) ? "Огноо батлагдмагц мэдэх" : "Дараагийнхыг мэдэх") : (opts.interest || "Мэдээлэл авах"));
      data.append("page", location.pathname);
      send(data).then(function(){
        form.hidden = true; done.hidden = false;
        var registered = ev && isOpen(ev);
        done.querySelector("h3").textContent = registered ? "Та бүртгүүллээ!" : "Баярлалаа!";
        done.querySelector("p").textContent = registered
          ? "Эвентийн дэлгэрэнгүй мэдээллийг утас, имэйлээр тань илгээнэ."
          : "Дараагийн эвентийн урилгыг танд хамгийн түрүүнд илгээнэ.";
        done.querySelector(".su-done-act").innerHTML = registered
          ? '<a class="btn btn--outline" href="' + esc(calendarUrl(ev)) + '" target="_blank" rel="noopener"><i data-lucide="calendar-plus"></i>Календарьт нэмэх</a>' : "";
        icons();
        store("tj-events-signed-up", "1");
        if (window.trackLead) window.trackLead(ev ? ev.id : (opts.interest || "series"));
        if (opts.onDone) opts.onDone(ev);
      }).catch(function(){
        status.textContent = "Илгээж чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.";
      }).then(function(){ btn.disabled = false; btn.classList.remove("is-sending"); btn.textContent = label; });
    });
    return {
      reset: function(){ form.reset(); form.hidden = false; done.hidden = true; fields.forEach(function(el){ show(el, ""); }); status.textContent = ""; },
      focus: function(){ var f = form.querySelector("input"); if (f && window.matchMedia("(pointer: fine)").matches) f.focus(); }
    };
  }

  function send(data){
    if (!SIGNUP_URL){
      if (LIVE) return Promise.reject(new Error("SIGNUP_URL is empty"));
      console.warn("events.js: SIGNUP_URL is empty, so this sign-up was not saved (test copy only).", Object.fromEntries(data));
      return new Promise(function(res){ setTimeout(res, 600); });
    }
    /* The script replies {"ok":true} once the row is in the sheet */
    return fetch(SIGNUP_URL, {method: "POST", body: data}).then(function(r){ return r.json(); }).then(function(res){ if (!res || !res.ok) throw new Error("not saved"); });
  }

  /* ── Pop-up ── */
  var dlg, dlgForm, dlgEvent = null;
  function buildDialog(){
    dlg = document.createElement("dialog");
    dlg.className = "su-dialog";
    dlg.setAttribute("aria-labelledby", "su-dlg-title");
    dlg.innerHTML = '<div class="dlg-head"><h2 id="su-dlg-title"></h2><p data-dlg-sub></p><div class="dlg-event" data-dlg-event hidden><b></b><span></span></div>' +
      '<button class="x-btn" type="button" aria-label="Хаах" data-dlg-close><i data-lucide="x"></i></button></div><div class="dlg-body" data-dlg-form></div>';
    document.body.appendChild(dlg);
    dlgForm = mountForm(dlg.querySelector("[data-dlg-form]"), {button: "Бүртгүүлэх", getEvent: function(){ return dlgEvent; }, interest: "Pop-up"});
    dlg.querySelector("[data-dlg-close]").addEventListener("click", function(){ dlg.close(); });
    dlg.addEventListener("click", function(e){ if (e.target === dlg) dlg.close(); });
  }
  /* opts: {event, title, sub} */
  function openSignup(opts){
    opts = opts || {};
    if (!dlg) buildDialog();
    dlgEvent = opts.event || null;
    dlgForm.reset();
    var open = dlgEvent && isOpen(dlgEvent), tbc = dlgEvent && isTbc(dlgEvent);
    if (tbc && !opts.title){ opts.title = "Огноо батлагдмагц танд хэлье"; opts.sub = "Энэ эвентийн огноо, цаг батлагдмагц урилгыг тань руу хамгийн түрүүнд илгээнэ."; }
    dlg.querySelector("#su-dlg-title").textContent = opts.title || (open ? "Эвентэд бүртгүүлэх" : "Дараагийн эвентийн мэдээллийг хамгийн түрүүнд аваарай");
    dlg.querySelector("[data-dlg-sub]").textContent = opts.sub || (open ? "Бүртгүүлсний дараа дэлгэрэнгүй мэдээллийг тань руу илгээнэ." :
      "Зочин илтгэгчийн цуврал, нээлттэй хаалганы өдөр, мэдээллийн уулзалтын урилгыг танд хамгийн түрүүнд илгээнэ.");
    var box = dlg.querySelector("[data-dlg-event]");
    box.hidden = !dlgEvent;
    if (dlgEvent){ var w = when(dlgEvent); box.querySelector("b").textContent = dlgEvent.title; box.querySelector("span").textContent = w.long + " · " + w.time + (tbc ? " (урьдчилсан)" : "") + (dlgEvent.place ? " · " + dlgEvent.place : ""); }
    icons();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    dlgForm.focus();
  }

  /* Any [data-register="event-id"] opens the pop-up for that event; [data-open-signup] for the series */
  document.addEventListener("click", function(e){
    var r = e.target.closest && e.target.closest("[data-register]");
    if (r){ var ev = (window.EVENTS || []).filter(function(x){ return x.id === r.getAttribute("data-register"); })[0]; openSignup({event: ev}); return; }
    if (e.target.closest && e.target.closest("[data-open-signup]")) openSignup();
  });

  function icons(){ if (window.lucide) window.lucide.createIcons(); }

  document.querySelectorAll("[data-signup]").forEach(function(box){
    mountForm(box, {button: box.getAttribute("data-button") || "Бүртгүүлэх", interest: box.getAttribute("data-signup") || "Мэдээлэл авах"});
  });

  window.TJEvents = {card: card, sorted: sorted, nextEvent: nextEvent, when: when, duration: duration, isPast: isPast, isOpen: isOpen,
    isTbc: isTbc, startMs: startMs, openSignup: openSignup, icons: icons, esc: esc, FORMATS: FORMATS,
    signedUp: function(){ return store("tj-events-signed-up") === "1"; }, store: store};
})();
